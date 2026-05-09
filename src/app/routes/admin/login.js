const express = require("express");
const { _decrypt } = require("../../../libs/encrypt");
const Admins = require("../../models/admin");
const { logger } = require("../../../libs/logger");
const log = require("simple-node-logger").createSimpleFileLogger("project.log");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { userName, password } = req.body;
    const user = await Admins.findOne({ userName });

    if (!user)
      return res.status(400).json({
        success: 0,
        message: "user does not exist, please register",
      });

    const decryptedPass = await _decrypt(user.password);

    if (decryptedPass !== password)
      return res.status(400).json({
        success: 0,
        message: "either password or user name is wrong, please try again",
      });

    if (user && user.isActive === false)
      return res.status(401).json({
        success: 0,
        message: "you are not authorized to login, please contact admin",
      });

    return res.status(201).json({
      success: 1,
      data: user,
    });
  } catch (error) {
    console.log(error);
    logger(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

module.exports = router;
