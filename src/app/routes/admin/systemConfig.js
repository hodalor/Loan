const express = require("express");
const {
  getSystemConfig,
  saveSystemConfig,
} = require("../../services/systemConfig");
const {
  getAuditActorFromRequest,
  summarizeSystemConfig,
  listChangedFields,
  logAuditEvent,
} = require("../../../libs/audit");

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
    await logAuditEvent({
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
    const previousConfig = await getSystemConfig();
    const { auditActor, ...payload } = req.body || {};
    const config = await saveSystemConfig(payload);

    await logAuditEvent({
      level: "info",
      category: "system",
      source: "admin.systemConfig",
      action: "update",
      status: "success",
      message: "System configuration updated successfully.",
      req,
      actor: getAuditActorFromRequest(req, auditActor || {}),
      details: {
        changedFields: listChangedFields(
          summarizeSystemConfig(previousConfig),
          summarizeSystemConfig(config),
          [
            "appName",
            "activeCountryCode",
            "collectionGateway",
            "disbursementGateway",
            "disbursementMode",
            "implementedChannels",
            "allowPartialRepayment",
            "autoRepaymentPosting",
            "requireGatewayApprovalCheck",
          ]
        ),
      },
      metadata: {
        before: summarizeSystemConfig(previousConfig),
        after: summarizeSystemConfig(config),
      },
    });

    return res.status(200).json({
      success: 1,
      message: "System configuration updated successfully",
      data: config,
    });
  } catch (error) {
    console.log(error);
    await logAuditEvent({
      level: "error",
      category: "system",
      source: "admin.systemConfig",
      action: "update",
      status: "failed",
      message: error.message || "System configuration update failed.",
      req,
      actor: getAuditActorFromRequest(req),
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
