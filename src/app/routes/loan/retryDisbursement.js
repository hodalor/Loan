const express = require("express");
const Loan = require("../../models/loans");
const Users = require("../../models/users");
const syncUserLoanState = require("../../handlers/userHandlers/syncUserLoanState");
const { getSystemConfig } = require("../../services/systemConfig");
const { processLoanDisbursement } = require("../../services/payout");

const router = express.Router();

router.post("/retry-disbursement/:ID", async (req, res) => {
  try {
    const loanId = req.params.ID;
    const { channel } = req.body || {};

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
    const payoutResult = await processLoanDisbursement({
      loan,
      user,
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
        payoutStatus: loan.payoutStatus,
        payoutMessage: loan.payoutMessage,
      },
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
