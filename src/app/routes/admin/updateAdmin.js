const express = require("express");
const { _encrypt } = require("../../../libs/encrypt");
const {
  getAuditActorFromRequest,
  summarizeAdmin,
  listChangedFields,
  logAuditEvent,
} = require("../../../libs/audit");
const Admins = require("../../models/admin");
const StaffGroups = require("../../models/staffGroup");

const router = express.Router();

router.patch("/updateAdmin/:userName", async (req, res) => {
  try {
    const userName = req.params.userName;

    const {
      password,
      role,
      firstName,
      lastName,
      phone,
      salaryNumber,
      salaryOperator,
      email,
      department,
      permissions,
      staffGroupId,
      managedStaffGroupIds,
      auditActor,
    } = req.body;
    const actor = getAuditActorFromRequest(req, auditActor || {});

    const user = await Admins.findOne({ userName });

    if (!user) {
      await logAuditEvent({
        req,
        actor,
        source: "admin.updateAdmin",
        action: "update",
        status: "failed",
        message: "Admin account update failed because the target user was not found.",
        metadata: {
          targetUserName: userName,
        },
      });
      return res.status(400).json({
        success: 0,
        messsage: "Could not identify user!",
      });
    }

    const beforeState = summarizeAdmin(user);

    if (password && password.trim() !== "") {
      const encryptedPass = await _encrypt(password);
      user.password = encryptedPass;
    }

    let staffGroupName = "";
    const normalizedManagedGroupIds = [
      ...new Set(
        (Array.isArray(managedStaffGroupIds) ? managedStaffGroupIds : [])
          .map((item) => String(item || "").trim())
          .filter(Boolean)
      ),
    ];
    if (staffGroupId) {
      const group = await StaffGroups.findById(staffGroupId).lean();

      if (!group)
        return res.status(400).json({
          success: 0,
          message: "Selected group could not be found",
        });

      if (String(group.department || "").trim() !== String(department || "").trim())
        return res.status(400).json({
          success: 0,
          message: "Selected group does not belong to the chosen department",
        });

      staffGroupName = group.name;
    }

    if (normalizedManagedGroupIds.length > 0) {
      const managedGroups = await StaffGroups.find({
        _id: { $in: normalizedManagedGroupIds },
      }).lean();

      if (managedGroups.length !== normalizedManagedGroupIds.length)
        return res.status(400).json({
          success: 0,
          message: "One or more managed groups could not be found",
        });

      const invalidGroup = managedGroups.find(
        (group) => String(group.department || "").trim() !== String(department || "").trim()
      );

      if (invalidGroup)
        return res.status(400).json({
          success: 0,
          message: "Managed groups must belong to the chosen department",
        });
    }

    user.role = role;
    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phone;
    user.salaryNumber = String(salaryNumber || "").trim();
    user.salaryOperator = String(salaryOperator || "").trim();
    user.email = email;
    user.department = department;
    user.staffGroupId = staffGroupId ? String(staffGroupId) : "";
    user.staffGroupName = staffGroupName;
    user.managedStaffGroupIds = normalizedManagedGroupIds;
    user.permissions = Array.isArray(permissions) ? permissions : user.permissions;

    let updatedUser = await user.save();

    if (updatedUser) {
      const afterState = summarizeAdmin(updatedUser);
      await logAuditEvent({
        req,
        actor,
        source: "admin.updateAdmin",
        action: "update",
        status: "success",
        message: "Admin account updated successfully.",
        details: {
          changedFields: listChangedFields(beforeState, afterState, [
            "firstName",
            "lastName",
            "role",
            "department",
            "phone",
            "staffGroupId",
            "staffGroupName",
            "isActive",
          ]),
        },
        metadata: {
          before: beforeState,
          after: afterState,
        },
      });
      return res.status(201).json({
        success: 1,
        message: "User updated successfully",
      });
    }

    if (!updatedUser)
      return res.status(400).json({
        success: 0,
        message: "could not update user",
      });
  } catch (error) {
    console.log(error);
    await logAuditEvent({
      req,
      actor: getAuditActorFromRequest(req),
      level: "error",
      source: "admin.updateAdmin",
      action: "update",
      status: "failed",
      message: error.message || "Admin account update failed.",
      details: {
        stack: error.stack || "",
      },
      metadata: {
        targetUserName: req.params?.userName || "",
      },
    });
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

module.exports = router;
