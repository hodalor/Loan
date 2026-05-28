const express = require("express");
const {
  getSystemConfig,
  saveSystemConfig,
} = require("../../services/systemConfig");
const { upload } = require("../../../libs/uploadImage");
const { resolveUploadedFileUrl } = require("../../../libs/mediaStorage");
const {
  getAuditActorFromRequest,
  summarizeSystemConfig,
  listChangedFields,
  logAuditEvent,
} = require("../../../libs/audit");

const router = express.Router();
const uploadSystemConfigAssets = (req, res, next) =>
  upload.single("homeBannerImage")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: 0,
        message: error.message || "Invalid image upload.",
      });
    }
    return next();
  });

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

router.patch("/system-config", uploadSystemConfigAssets, async (req, res) => {
  try {
    const previousConfig = await getSystemConfig();
    const rawBody = req.body || {};
    const parsedConfig =
      typeof rawBody.config === "string" ? JSON.parse(rawBody.config || "{}") : rawBody;
    const parsedAuditActor =
      typeof rawBody.auditActor === "string"
        ? JSON.parse(rawBody.auditActor || "{}")
        : rawBody.auditActor || {};
    const payload = {
      ...parsedConfig,
    };

    if (req.file) {
      payload.portalContent = {
        ...(payload.portalContent || previousConfig.portalContent || {}),
        homeBannerImageUrl: await resolveUploadedFileUrl(req, req.file, "portal/banner"),
      };
    }

    const config = await saveSystemConfig(payload);

    await logAuditEvent({
      level: "info",
      category: "system",
      source: "admin.systemConfig",
      action: "update",
      status: "success",
      message: "System configuration updated successfully.",
      req,
      actor: getAuditActorFromRequest(req, parsedAuditActor || {}),
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
