const express = require("express");
const SystemLog = require("../../models/systemLog");
const GatewayTransactions = require("../../models/gatewayTransactions");
const { logSystemEvent } = require("../../../libs/logger");
const customerAuthRoute = require("../user/customerAuth");

const router = express.Router();

const toStringList = (value = "") =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

router.get("/system-logs", async (req, res) => {
  try {
    const { level = "", category = "", status = "", search = "", limit = "200" } = req.query;
    const query = {};
    const levels = toStringList(level);
    const categories = toStringList(category);
    const statuses = toStringList(status);
    const parsedLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 200, 1), 500);

    if (levels.length > 0) {
      query.level = { $in: levels };
    }

    if (categories.length > 0) {
      query.category = { $in: categories };
    }

    if (statuses.length > 0) {
      query.status = { $in: statuses };
    }

    if (String(search || "").trim()) {
      const expression = new RegExp(String(search).trim(), "i");
      query.$or = [
        { message: expression },
        { source: expression },
        { action: expression },
        { requestPath: expression },
        { "actor.userName": expression },
        { "actor.userId": expression },
      ];
    }

    const logs = await SystemLog.find(query).sort({ createdAt: -1 }).limit(parsedLimit).lean();

    return res.status(200).json({
      success: 1,
      data: logs,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.get("/system-logs/errors", async (req, res) => {
  try {
    const { search = "", limit = "200" } = req.query;
    const parsedLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 200, 1), 500);
    const query = {
      level: { $in: ["warn", "error", "fatal"] },
    };

    if (String(search || "").trim()) {
      const expression = new RegExp(String(search).trim(), "i");
      query.$or = [
        { message: expression },
        { source: expression },
        { action: expression },
        { requestPath: expression },
        { "actor.userName": expression },
        { "actor.userId": expression },
      ];
    }

    const logs = await SystemLog.find(query).sort({ createdAt: -1 }).limit(parsedLimit).lean();

    return res.status(200).json({
      success: 1,
      data: logs,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/system-logs/portal-recover", async (req, res) => {
  try {
    const reference = String(req.body?.reference || "")
      .trim()
      .replace(/\s+/g, "");

    if (!reference) {
      return res.status(400).json({
        success: 0,
        message: "Transaction reference is required.",
      });
    }

    const transaction = await GatewayTransactions.findOne({ reference });

    if (!transaction) {
      await logSystemEvent({
        level: "warn",
        category: "payment",
        source: "admin.systemLogs.portalRecovery",
        action: "recover",
        status: "failed",
        message: "Portal payment recovery could not find the requested transaction reference.",
        req,
        metadata: {
          reference,
        },
      });

      return res.status(404).json({
        success: 0,
        message: "Stored transaction was not found.",
      });
    }

    if (String(transaction.provider || "").trim() !== "bridge") {
      return res.status(400).json({
        success: 0,
        message: "Only Bridge portal transactions can be recovered from this action.",
      });
    }

    if (transaction.processed) {
      return res.status(200).json({
        success: 1,
        message: "Payment was already confirmed earlier.",
        data: {
          reference: transaction.reference,
          status: transaction.status,
          processed: transaction.processed,
        },
      });
    }

    if (typeof customerAuthRoute.finalizePortalGatewayTransaction !== "function") {
      throw new Error("Portal recovery helper is not available.");
    }

    const response = await customerAuthRoute.finalizePortalGatewayTransaction({
      reference: transaction.reference,
      webhookEvent: transaction.rawWebhookEvent || null,
    });

    await logSystemEvent({
      level: response.success === 1 ? "info" : response.success === 2 ? "warn" : "error",
      category: "payment",
      source: "admin.systemLogs.portalRecovery",
      action: "recover",
      status:
        response.success === 1
          ? "success"
          : response.success === 2
          ? "pending"
          : "failed",
      message:
        response.message ||
        (response.success === 1
          ? "Portal payment recovery completed successfully."
          : "Portal payment recovery did not complete."),
      req,
      metadata: {
        reference: transaction.reference,
        provider: transaction.provider,
        transactionType: transaction.transactionType,
        phone: transaction.phone,
        loanId: transaction.loanId,
        priorStatus: transaction.status,
      },
      details: {
        response,
      },
    });

    return res.status(response.success === 1 ? 200 : response.success === 2 ? 202 : 400).json(
      response
    );
  } catch (error) {
    console.log(error);
    await logSystemEvent({
      level: "error",
      category: "payment",
      source: "admin.systemLogs.portalRecovery",
      action: "recover",
      status: "failed",
      message: error.message || "Portal payment recovery failed with an internal error.",
      req,
      details: {
        stack: error.stack || "",
      },
      metadata: {
        reference: String(req.body?.reference || "").trim(),
      },
    });
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

module.exports = router;
