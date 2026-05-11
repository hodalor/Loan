const express = require("express");
const { _encrypt } = require("../../../libs/encrypt");
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
      email,
      department,
      permissions,
      staffGroupId,
    } = req.body;

    const user = await Admins.findOne({ userName });

    if (!user)
      return res.status(400).json({
        success: 0,
        messsage: "Could not identify user!",
      });

    if (password && password.trim() !== "") {
      const encryptedPass = await _encrypt(password);
      user.password = encryptedPass;
    }

    let staffGroupName = "";
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

    user.role = role;
    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phone;
    user.email = email;
    user.department = department;
    user.staffGroupId = staffGroupId ? String(staffGroupId) : "";
    user.staffGroupName = staffGroupName;
    user.permissions = Array.isArray(permissions) ? permissions : user.permissions;

    let updatedUser = await user.save();

    if (updatedUser)
      return res.status(201).json({
        success: 1,
        message: "User updated successfully",
      });

    if (!updatedUser)
      return res.status(400).json({
        success: 0,
        message: "could not update user",
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

module.exports = router;
