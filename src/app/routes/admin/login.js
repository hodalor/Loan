const express = require("express");
const { _decrypt } = require("../../../libs/encrypt");
const Admins = require("../../models/admin");
const { logSystemEvent } = require("../../../libs/logger");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { userName, password } = req.body;
    const user = await Admins.findOne({ userName });

    if (!user) {
      await logSystemEvent({
        level: "warn",
        category: "auth",
        source: "admin.login",
        action: "login",
        status: "failed",
        message: "Admin login failed because the user was not found.",
        req,
        metadata: {
          userName,
        },
      });
      return res.status(400).json({
        success: 0,
        message: "user does not exist, please register",
      });
    }

    const decryptedPass = await _decrypt(user.password);

    if (decryptedPass !== password) {
      await logSystemEvent({
        level: "warn",
        category: "auth",
        source: "admin.login",
        action: "login",
        status: "failed",
        message: "Admin login failed because the password did not match.",
        req,
        actor: {
          userId: user.userId,
          userName: user.userName,
          role: user.role,
        },
      });
      return res.status(400).json({
        success: 0,
        message: "either password or user name is wrong, please try again",
      });
    }

    if (user && user.isActive === false) {
      await logSystemEvent({
        level: "warn",
        category: "auth",
        source: "admin.login",
        action: "login",
        status: "blocked",
        message: "Admin login was blocked because the account is inactive.",
        req,
        actor: {
          userId: user.userId,
          userName: user.userName,
          role: user.role,
        },
      });
      return res.status(401).json({
        success: 0,
        message: "you are not authorized to login, please contact admin",
      });
    }

    await logSystemEvent({
      level: "info",
      category: "auth",
      source: "admin.login",
      action: "login",
      status: "success",
      message: "Admin login completed successfully.",
      req,
      actor: {
        userId: user.userId,
        userName: user.userName,
        role: user.role,
      },
    });

    return res.status(201).json({
      success: 1,
      data: user,
    });
  } catch (error) {
    console.log(error);
    await logSystemEvent({
      level: "error",
      category: "auth",
      source: "admin.login",
      action: "login",
      status: "failed",
      message: error.message || "Admin login failed with an internal error.",
      req,
      details: {
        stack: error.stack || "",
      },
      metadata: {
        userName: req.body?.userName || "",
      },
    });
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

module.exports = router;
