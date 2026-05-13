const express = require("express");
const {
  getSystemConfig,
  saveSystemConfig,
} = require("../../services/systemConfig");
const { logSystemEvent } = require("../../../libs/logger");

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
    await logSystemEvent({
      level: "error",
      category: "system",
      source: "admin.systemConfig",
      action: "read",
      status: "failed",
      message: error.message || "System configuration could not be loaded.",
      req,
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

router.patch("/system-config", async (req, res) => {
  try {
    const config = await saveSystemConfig(req.body);

    await logSystemEvent({
      level: "info",
      category: "system",
      source: "admin.systemConfig",
      action: "update",
      status: "success",
      message: "System configuration updated successfully.",
      req,
      metadata: {
        collectionGateway: config.collectionGateway,
        disbursementGateway: config.disbursementGateway,
        activeCountryCode: config.activeCountryCode,
      },
    });

    return res.status(200).json({
      success: 1,
      message: "System configuration updated successfully",
      data: config,
    });
  } catch (error) {
    console.log(error);
    await logSystemEvent({
      level: "error",
      category: "system",
      source: "admin.systemConfig",
      action: "update",
      status: "failed",
      message: error.message || "System configuration update failed.",
      req,
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

module.exports = router;
