const express = require("express");
const {
  getSystemConfig,
  saveSystemConfig,
} = require("../../services/systemConfig");

const router = express.Router();

router.get("/system-config", async (req, res) => {
  try {
    const config = await getSystemConfig();

    return res.status(200).json({
      success: 1,
      data: config,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.patch("/system-config", async (req, res) => {
  try {
    const config = await saveSystemConfig(req.body);

    return res.status(200).json({
      success: 1,
      message: "System configuration updated successfully",
      data: config,
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
