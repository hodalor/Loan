const express = require("express");
const { _encrypt } = require("../../../libs/encrypt");
const _generateString = require("../../../libs/generateID");
const Admins = require("../../models/admin");
const StaffGroups = require("../../models/staffGroup");

const router = express.Router();

router.post("/createAdmin", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      userName,
      phone,
      email,
      gender,
      password,
      role,
      department,
      permissions,
      staffGroupId,
    } = req.body;

    const user = await Admins.findOne({ userName });

    if (user !== undefined && user !== null && user)
      return res.status(400).json({
        success: 0,
        message: "This user name already exist please chose a different one!",
      });

    if (user !== undefined && user !== null && user.phone === phone)
      return res.status(400).json({
        success: 0,
        message:
          "A user with this phone number already exist please chose a different one!",
      });

    if (user !== undefined && user !== null && user.email === email)
      return res.status(400).json({
        success: 0,
        message:
          "A user with this email account already exist please chose a different one!",
      });

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

    const generatedID = await _generateString(6);

    const encryptPass = await _encrypt(password);

    const userData = new Admins({
      isActive: true,
      isOnline: false,
      email,
      phone,
      userId: generatedID,
      firstName,
      lastName,
      userName,
      gender,
      password: encryptPass,
      role,
      department,
      permissions: Array.isArray(permissions) ? permissions : [],
      staffGroupId: staffGroupId ? String(staffGroupId) : "",
      staffGroupName,
    });

    const savedUser = await userData.save();

    if (savedUser) {
      return res.status(201).json({
        success: 1,
        message: "User created successfully",
        data: savedUser,
      });
    }
    if (!savedUser)
      return res.status(201).json({
        success: 0,
        message: "Could not create user",
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
