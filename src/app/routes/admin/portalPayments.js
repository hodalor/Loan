const express = require("express");
const GatewayTransactions = require("../../models/gatewayTransactions");
const { logSystemEvent } = require("../../../libs/logger");
const customerAuthRoute = require("../user/customerAuth");

const router = express.Router();

const normalizeReference = (value = "") =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "");

const buildSearchMatcher = (search = "") => {
  const normalized = String(search || "").trim().toLowerCase();
  if (!normalized) return null;

  return (record = {}) =>
    [
      record.reference,
      record.phone,
      record.userId,
      record.loanId,
      record.provider,
      record.transactionType,
      record.status,
      record.failureReason,
      record.rawWebhookEvent?.trans_id,
      record.rawWebhookEvent?.collection_trans_id,
      record.rawWebhookEvent?.trans_ref,
      record.rawInitializeResponse?.transaction_id,
      record.rawVerifyResponse?.data?.id,
      record.rawVerifyResponse?.message,
      record.rawWebhookEvent?.message,
    ]
      .map((item) => String(item || "").toLowerCase())
      .some((item) => item.includes(normalized));
};

const buildPortalPaymentRow = (record = {}) => ({
  ...record,
  reference: normalizeReference(record.reference || ""),
  loanId: String(record.loanId || "").trim(),
  gatewayTransactionId:
    record.rawWebhookEvent?.trans_id ||
    record.rawWebhookEvent?.collection_trans_id ||
    record.rawInitializeResponse?.transaction_id ||
    record.rawVerifyResponse?.data?.id ||
    "",
  gatewayStatusCode:
    record.rawWebhookEvent?.trans_status ||
    record.rawWebhookEvent?.status ||
    record.rawVerifyResponse?.data?.status ||
    record.rawVerifyResponse?.status ||
    "",
  gatewayMessage:
    record.rawWebhookEvent?.message ||
    record.rawWebhookEvent?.status_desc ||
    record.rawVerifyResponse?.message ||
    record.failureReason ||
    "",
});

router.get("/portal-payments", async (req, res) => {
  try {
    const { stage = "pending", search = "", limit = "300" } = req.query;
    const parsedLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 300, 1), 1000);
    const query = {
      transactionType: "repayment",
    };

    if (stage === "pending") {
      query.processed = false;
      query.status = { $in: ["success", "verified"] };
    }

    if (stage === "completed") {
      query.processed = true;
    }

    const records = await GatewayTransactions.find(query)
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(parsedLimit)
      .lean();

    const matcher = buildSearchMatcher(search);
    const data = (matcher ? records.filter(matcher) : records).map(buildPortalPaymentRow);

    return res.status(200).json({
      success: 1,
      data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/portal-payments/:reference/restore", async (req, res) => {
  try {
    const reference = normalizeReference(req.params?.reference || req.body?.reference || "");

    if (!reference) {
      return res.status(400).json({
        success: 0,
        message: "Transaction reference is required.",
      });
    }

    const transaction = await GatewayTransactions.findOne({ reference });

    if (!transaction) {
      return res.status(404).json({
        success: 0,
        message: "Stored transaction was not found.",
      });
    }

    if (transaction.processed) {
      return res.status(200).json({
        success: 1,
        message: "Payment was already completed earlier.",
        data: buildPortalPaymentRow(transaction.toObject()),
      });
    }

    if (
      !["success", "verified"].includes(String(transaction.status || "").trim().toLowerCase()) &&
      !transaction.rawWebhookEvent &&
      !transaction.rawVerifyResponse
    ) {
      return res.status(400).json({
        success: 0,
        message: "This transaction has not been confirmed by the gateway yet.",
      });
    }

    if (typeof customerAuthRoute.finalizePortalGatewayTransaction !== "function") {
      throw new Error("Portal restore helper is not available.");
    }

    const response = await customerAuthRoute.finalizePortalGatewayTransaction({
      reference: transaction.reference,
      webhookEvent: transaction.rawWebhookEvent || null,
    });

    const latestTransaction = await GatewayTransactions.findOne({ reference }).lean();

    await logSystemEvent({
      level: response.success === 1 ? "info" : response.success === 2 ? "warn" : "error",
      category: "payment",
      source: "admin.portalPayments",
      action: "restore",
      status:
        response.success === 1 ? "success" : response.success === 2 ? "pending" : "failed",
      message:
        response.message ||
        (response.success === 1
          ? "Portal repayment restore completed successfully."
          : "Portal repayment restore failed."),
      req,
      metadata: {
        reference,
        provider: transaction.provider,
        phone: transaction.phone,
        userId: transaction.userId,
        loanId: transaction.loanId,
        previousStatus: transaction.status,
      },
      details: {
        response,
      },
    });

    return res.status(response.success === 1 ? 200 : response.success === 2 ? 202 : 400).json({
      ...response,
      data: {
        ...(response.data || {}),
        record: buildPortalPaymentRow(latestTransaction || transaction.toObject()),
      },
    });
  } catch (error) {
    console.log(error);
    await logSystemEvent({
      level: "error",
      category: "payment",
      source: "admin.portalPayments",
      action: "restore",
      status: "failed",
      message: error.message || "Portal repayment restore failed with an internal error.",
      req,
      details: {
        stack: error.stack || "",
      },
      metadata: {
        reference: normalizeReference(req.params?.reference || req.body?.reference || ""),
      },
    });
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

module.exports = router;
