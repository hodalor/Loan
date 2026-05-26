const express = require("express");
const StaffGroups = require("../../models/staffGroup");
const Admins = require("../../models/admin");
const {
  getAuditActorFromRequest,
  summarizeStaffGroup,
  logAuditEvent,
} = require("../../../libs/audit");

const router = express.Router();

const normalizeName = (value = "") => String(value || "").trim();
const normalizeDepartment = (value = "") => String(value || "").trim();

router.get("/staff-groups", async (_req, res) => {
  try {
    const groups = await StaffGroups.find().sort({ department: 1, name: 1 }).lean();

    return res.status(200).json({
      success: 1,
      data: groups,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/staff-groups", async (req, res) => {
  try {
    const {
      name,
      department,
      description = "",
      createdBy = "",
      updatedBy = "",
    } = req.body || {};
    const actor = getAuditActorFromRequest(req, {
      userName: createdBy || updatedBy,
    });

    const normalizedName = normalizeName(name);
    const normalizedDepartment = normalizeDepartment(department);

    if (!normalizedName || !normalizedDepartment) {
      return res.status(400).json({
        success: 0,
        message: "Group name and department are required",
      });
    }

    const existingGroup = await StaffGroups.findOne({
      name: normalizedName,
      department: normalizedDepartment,
    });

    if (existingGroup) {
      await logAuditEvent({
        req,
        actor,
        source: "admin.staffGroups",
        action: "create",
        status: "failed",
        message: "Staff group creation failed because the name already exists in the department.",
        metadata: {
          name: normalizedName,
          department: normalizedDepartment,
        },
      });
      return res.status(400).json({
        success: 0,
        message: "A group with this name already exists in the selected department",
      });
    }

    const group = await StaffGroups.create({
      name: normalizedName,
      department: normalizedDepartment,
      description: String(description || "").trim(),
      createdBy: String(createdBy || "").trim(),
      updatedBy: String(updatedBy || createdBy || "").trim(),
    });

    await logAuditEvent({
      req,
      actor,
      source: "admin.staffGroups",
      action: "create",
      status: "success",
      message: "Staff group created successfully.",
      metadata: {
        target: summarizeStaffGroup(group),
      },
    });

    return res.status(201).json({
      success: 1,
      message: "Group created successfully",
      data: group,
    });
  } catch (error) {
    console.log(error);
    await logAuditEvent({
      req,
      actor: getAuditActorFromRequest(req),
      level: "error",
      source: "admin.staffGroups",
      action: "create",
      status: "failed",
      message: error.message || "Staff group creation failed.",
      details: {
        stack: error.stack || "",
      },
    });
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.patch("/staff-groups/:groupId", async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const { name, department, description = "", updatedBy = "" } = req.body || {};
    const actor = getAuditActorFromRequest(req, {
      userName: updatedBy,
    });

    const group = await StaffGroups.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: 0,
        message: "Group not found",
      });
    }

    const beforeState = summarizeStaffGroup(group);

    const normalizedName = normalizeName(name || group.name);
    const normalizedDepartment = normalizeDepartment(department || group.department);

    if (!normalizedName || !normalizedDepartment) {
      return res.status(400).json({
        success: 0,
        message: "Group name and department are required",
      });
    }

    const existingGroup = await StaffGroups.findOne({
      _id: { $ne: groupId },
      name: normalizedName,
      department: normalizedDepartment,
    });

    if (existingGroup) {
      return res.status(400).json({
        success: 0,
        message: "Another group with this name already exists in the selected department",
      });
    }

    const departmentChanged = normalizedDepartment !== group.department;

    group.name = normalizedName;
    group.department = normalizedDepartment;
    group.description = String(description || "").trim();
    group.updatedBy = String(updatedBy || "").trim();

    const savedGroup = await group.save();

    await Admins.updateMany(
      { staffGroupId: String(groupId) },
      {
        $set: {
          staffGroupId: String(savedGroup._id),
          staffGroupName: savedGroup.name,
          ...(departmentChanged ? { department: savedGroup.department } : {}),
        },
      }
    );

    await logAuditEvent({
      req,
      actor,
      source: "admin.staffGroups",
      action: "update",
      status: "success",
      message: "Staff group updated successfully.",
      metadata: {
        before: beforeState,
        after: summarizeStaffGroup(savedGroup),
      },
    });

    return res.status(200).json({
      success: 1,
      message: "Group updated successfully",
      data: savedGroup,
    });
  } catch (error) {
    console.log(error);
    await logAuditEvent({
      req,
      actor: getAuditActorFromRequest(req),
      level: "error",
      source: "admin.staffGroups",
      action: "update",
      status: "failed",
      message: error.message || "Staff group update failed.",
      details: {
        stack: error.stack || "",
      },
      metadata: {
        groupId: req.params?.groupId || "",
      },
    });
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.delete("/staff-groups/:groupId", async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const actor = getAuditActorFromRequest(req);
    const linkedAdmins = await Admins.find({ staffGroupId: String(groupId) })
      .select("userName firstName lastName")
      .lean();

    if (linkedAdmins.length > 0) {
      return res.status(400).json({
        success: 0,
        message: "Remove all users from this group before deleting it",
        data: linkedAdmins,
      });
    }

    const deletedGroup = await StaffGroups.findByIdAndDelete(groupId);

    if (!deletedGroup) {
      return res.status(404).json({
        success: 0,
        message: "Group not found",
      });
    }

    await logAuditEvent({
      req,
      actor,
      source: "admin.staffGroups",
      action: "delete",
      status: "success",
      message: "Staff group deleted successfully.",
      metadata: {
        target: summarizeStaffGroup(deletedGroup),
      },
    });

    return res.status(200).json({
      success: 1,
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.log(error);
    await logAuditEvent({
      req,
      actor: getAuditActorFromRequest(req),
      level: "error",
      source: "admin.staffGroups",
      action: "delete",
      status: "failed",
      message: error.message || "Staff group deletion failed.",
      details: {
        stack: error.stack || "",
      },
      metadata: {
        groupId: req.params?.groupId || "",
      },
    });
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

module.exports = router;
