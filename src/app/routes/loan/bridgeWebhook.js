const express = require("express");
const Loan = require("../../models/loans");
const syncUserLoanState = require("../../handlers/userHandlers/syncUserLoanState");
const { _getDatefromDays } = require("../../../libs/calcDate");
const { logSystemEvent } = require("../../../libs/logger");

const router = express.Router();

router.post("/bridge/webhook", async (req, res) => {
  try {
    const payload = req.body || {};
    const transactionId = String(payload.transaction_id || "").trim();

    if (!transactionId) {
      return res.sendStatus(200);
    }

    const loan = await Loan.findOne({ payoutReference: transactionId });
    if (!loan) {
      return res.sendStatus(200);
    }

    const callbackStatus = String(payload.status || "").trim();
    const callbackMessage =
      String(payload.status_desc || "").trim() ||
      String(payload.message || "").trim() ||
      "Bridge callback received.";

    if (callbackStatus === "000") {
      const durationDays = Number.parseInt(String(loan.duration || "").split(" ")[0], 10);
      const dateOfDisbursement = loan.dod || new Date();
      const dateOfPayment =
        loan.dop || (Number.isFinite(durationDays) && durationDays > 0
          ? await _getDatefromDays(durationDays)
          : null);

      loan.isDisbursed = true;
      loan.dod = dateOfDisbursement;
      loan.dop = dateOfPayment;
      loan.disbursementProvider = loan.disbursementProvider || "bridge";
      loan.disbursementChannel = loan.disbursementChannel || String(payload.nw || "").trim();
      loan.payoutStatus = "success";
      loan.payoutMessage = callbackMessage;
      await loan.save();

      await syncUserLoanState({
        userId: loan.userId,
        loanId: loan.ID,
        rootLoanStatus: loan.loanStatus,
        updates: {
          isDisbursed: loan.isDisbursed,
          dod: loan.dod,
          dop: loan.dop,
          disbursementProvider: loan.disbursementProvider,
          disbursementChannel: loan.disbursementChannel,
          payoutStatus: loan.payoutStatus,
          payoutReference: loan.payoutReference,
          payoutMessage: loan.payoutMessage,
        },
      });

      await logSystemEvent({
        level: "info",
        category: "payment",
        source: "loan.bridgeWebhook",
        action: "disbursement-webhook",
        status: "success",
        message: "Bridge disbursement webhook confirmed a successful payout.",
        metadata: {
          loanId: loan.ID,
          customerId: loan.userId,
          transactionId,
          network: payload.nw || "",
        },
        details: payload,
      });

      return res.sendStatus(200);
    }

    if (callbackStatus === "001" || callbackStatus === "003") {
      loan.isDisbursed = false;
      loan.payoutStatus = "failed";
      loan.payoutMessage = callbackMessage;
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
        level: "error",
        category: "payment",
        source: "loan.bridgeWebhook",
        action: "disbursement-webhook",
        status: "failed",
        message: callbackMessage,
        metadata: {
          loanId: loan.ID,
          customerId: loan.userId,
          transactionId,
          network: payload.nw || "",
        },
        details: payload,
      });

      return res.sendStatus(200);
    }

    loan.payoutStatus = "pending";
    loan.payoutMessage = callbackMessage;
    await loan.save();

    await syncUserLoanState({
      userId: loan.userId,
      loanId: loan.ID,
      rootLoanStatus: loan.loanStatus,
      updates: {
        payoutStatus: loan.payoutStatus,
        payoutReference: loan.payoutReference,
        payoutMessage: loan.payoutMessage,
      },
    });

    await logSystemEvent({
      level: "warn",
      category: "payment",
      source: "loan.bridgeWebhook",
      action: "disbursement-webhook",
      status: "pending",
      message: callbackMessage,
      metadata: {
        loanId: loan.ID,
        customerId: loan.userId,
        transactionId,
        network: payload.nw || "",
      },
      details: payload,
    });

    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    await logSystemEvent({
      level: "error",
      category: "payment",
      source: "loan.bridgeWebhook",
      action: "disbursement-webhook",
      status: "failed",
      req,
      message: error.message || "Bridge disbursement webhook processing failed.",
      details: {
        stack: error.stack || "",
        body: req.body,
      },
    });
    return res.sendStatus(200);
  }
});

module.exports = router;
