const express = require("express");
const Loan = require("../../models/loans");
const Users = require("../../models/users");
const syncUserLoanState = require("../../handlers/userHandlers/syncUserLoanState");
const { getSystemConfig } = require("../../services/systemConfig");
const { processLoanDisbursement } = require("../../services/payout");
const { logSystemEvent } = require("../../../libs/logger");

const router = express.Router();

router.post("/retry-disbursement/:ID", async (req, res) => {
  try {
    const loanId = req.params.ID;
    const { channel, operator } = req.body || {};

    const loan = await Loan.findOne({ ID: loanId });
    if (!loan) {
      return res.status(404).json({
        success: 0,
        message: "Loan was not found",
      });
    }

    const systemConfig = await getSystemConfig();
    const selectedChannel =
      channel && systemConfig.implementedChannels.includes(channel)
        ? channel
        : systemConfig.disbursementGateway || systemConfig.activeChannel;

    const user = await Users.findOne({ userId: loan.userId });
    const selectedOperator = String(operator || "").trim();
    const availablePaymentMethods = Array.isArray(user?.paymentMethods) ? user.paymentMethods : [];
    const recoveredPaymentMethod =
      availablePaymentMethods.find((item) => {
        const method = String(item?.method || "").trim();
        const itemOperator = String(item?.operator || "").trim().toLowerCase();
        if (!method || method.includes("@")) return false;
        if (!selectedOperator) return true;
        return itemOperator === selectedOperator.toLowerCase();
      }) ||
      availablePaymentMethods.find((item) => {
        const method = String(item?.method || "").trim();
        return method && !method.includes("@");
      }) ||
      null;

    if (!String(loan.paymentMethod || "").trim()) {
      loan.paymentMethod = String(
        recoveredPaymentMethod?.method || user?.phone || ""
      ).trim();
    }

    if (selectedOperator) {
      loan.paymentOperator = selectedOperator;

      if (user && Array.isArray(user.paymentMethods)) {
        user.paymentMethods = user.paymentMethods.map((item) =>
          String(item?.method || "").trim() === String(loan.paymentMethod || "").trim()
            ? {
                ...item,
                operator: selectedOperator,
              }
            : item
        );

        if (
          !user.paymentMethods.some(
            (item) => String(item?.method || "").trim() === String(loan.paymentMethod || "").trim()
          ) &&
          String(loan.paymentMethod || "").trim()
        ) {
          user.paymentMethods = [
            ...user.paymentMethods,
            {
              method: String(loan.paymentMethod || "").trim(),
              email: user?.email || "",
              operator: selectedOperator,
              isVerified: false,
            },
          ];
        }
      }
    }

    const payoutMethodForRetry = {
      method: String(loan.paymentMethod || recoveredPaymentMethod?.method || user?.phone || "").trim(),
      operator: String(
        loan.paymentOperator || recoveredPaymentMethod?.operator || selectedOperator || ""
      ).trim(),
      email: recoveredPaymentMethod?.email || user?.email || "",
      isVerified: Boolean(recoveredPaymentMethod?.isVerified),
    };

    const payoutResult = await processLoanDisbursement({
      loan,
      user,
      paymentMethodOverride: payoutMethodForRetry,
      systemConfig: {
        ...systemConfig,
        disbursementGateway: selectedChannel,
        activeChannel: selectedChannel,
      },
    });

    loan.isDisbursed = payoutResult.success;
    loan.disbursementProvider = selectedChannel;
    loan.disbursementChannel = payoutResult.channel || selectedChannel;
    loan.payoutStatus = payoutResult.success
      ? "success"
      : payoutResult.pending
      ? "pending"
      : "failed";
    loan.payoutReference = payoutResult.reference || loan.ID;
    loan.payoutMessage = payoutResult.message;

    await loan.save();
    if (selectedOperator && user) {
      await user.save();
    }

    await syncUserLoanState({
      userId: loan.userId,
      loanId: loan.ID,
      rootLoanStatus: loan.loanStatus,
      updates: {
        isDisbursed: loan.isDisbursed,
        disbursementProvider: loan.disbursementProvider,
        disbursementChannel: loan.disbursementChannel,
        payoutStatus: loan.payoutStatus,
        payoutReference: loan.payoutReference,
        payoutMessage: loan.payoutMessage,
        paymentOperator: loan.paymentOperator || "",
      },
    });

    await logSystemEvent({
      level: payoutResult.success ? "info" : payoutResult.pending ? "warn" : "error",
      category: "payment",
      source: "loan.retryDisbursement",
      action: "disbursement-retry",
      status: payoutResult.success ? "success" : payoutResult.pending ? "pending" : "failed",
      req,
      message:
        payoutResult.success
          ? "Loan disbursement retried successfully."
          : payoutResult.pending
          ? payoutResult.message || "Loan disbursement retry is waiting for callback confirmation."
          : payoutResult.message || "Loan disbursement retry failed.",
      metadata: {
        loanId: loan.ID,
        customerId: loan.userId,
        provider: selectedChannel,
        paymentMethod: loan.paymentMethod || "",
        operator: loan.paymentOperator || "",
        payoutReference: loan.payoutReference,
      },
      details: {
        ...(payoutResult.raw || {}),
        resolvedRetryMethod: payoutMethodForRetry,
      },
    });

    return res.status(200).json({
      success: payoutResult.success || payoutResult.pending ? 1 : 0,
      message: payoutResult.success
        ? "Loan disbursement retried successfully"
        : payoutResult.pending
        ? payoutResult.message || "Loan disbursement retry accepted and is awaiting callback."
        : payoutResult.message,
      data: {
        loanId: loan.ID,
        provider: loan.disbursementProvider,
        disbursementChannel: loan.disbursementChannel,
        paymentMethod: loan.paymentMethod || "",
        operator: loan.paymentOperator || "",
        isDisbursed: loan.isDisbursed,
        payoutStatus: loan.payoutStatus,
        payoutMessage: loan.payoutMessage,
      },
    });
  } catch (error) {
    console.log(error);
    await logSystemEvent({
      level: "error",
      category: "payment",
      source: "loan.retryDisbursement",
      action: "disbursement-retry",
      status: "failed",
      req,
      message: error.message || "Loan disbursement retry failed with an internal error.",
      details: {
        stack: error.stack || "",
      },
      metadata: {
        loanId: req.params?.ID || "",
        requestedChannel: req.body?.channel || "",
        requestedOperator: req.body?.operator || "",
      },
    });
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.patch("/cancel-bounced-disbursement/:ID", async (req, res) => {
  try {
    const loanId = req.params.ID;
    const loan = await Loan.findOne({ ID: loanId });

    if (!loan) {
      return res.status(404).json({
        success: 0,
        message: "Loan was not found",
      });
    }

    if (loan.isDisbursed === true) {
      return res.status(400).json({
        success: 0,
        message: "This loan is already disbursed and cannot be cancelled from the bounce queue.",
      });
    }

    const currentStatus = String(loan.payoutStatus || "").trim().toLowerCase();
    if (!["bounced-back", "pending"].includes(currentStatus)) {
      return res.status(400).json({
        success: 0,
        message: "Only bounced-back or pending disbursements can be cancelled here.",
      });
    }

    const cancellationMessage =
      String(req.body?.remark || "").trim() ||
      "Payout callback case cancelled by admin and removed from the bounce queue.";

    loan.payoutStatus = "cancelled";
    loan.payoutMessage = cancellationMessage;
    await loan.save();

    await syncUserLoanState({
      userId: loan.userId,
      loanId: loan.ID,
      rootLoanStatus: loan.loanStatus,
      updates: {
        isDisbursed: false,
        payoutStatus: loan.payoutStatus,
        payoutReference: loan.payoutReference,
        payoutMessage: loan.payoutMessage,
      },
    });

    await logSystemEvent({
      level: "warn",
      category: "payment",
      source: "loan.retryDisbursement",
      action: "disbursement-cancel",
      status: "cancelled",
      req,
      message: cancellationMessage,
      metadata: {
        loanId: loan.ID,
        customerId: loan.userId,
        payoutReference: loan.payoutReference || "",
      },
    });

    return res.status(200).json({
      success: 1,
      message: "Bounced-back disbursement cancelled successfully.",
      data: {
        loanId: loan.ID,
        payoutStatus: loan.payoutStatus,
        payoutMessage: loan.payoutMessage,
      },
    });
  } catch (error) {
    console.log(error);
    await logSystemEvent({
      level: "error",
      category: "payment",
      source: "loan.retryDisbursement",
      action: "disbursement-cancel",
      status: "failed",
      req,
      message: error.message || "Cancelling bounced-back disbursement failed.",
      details: {
        stack: error.stack || "",
      },
      metadata: {
        loanId: req.params?.ID || "",
      },
    });
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

module.exports = router;
