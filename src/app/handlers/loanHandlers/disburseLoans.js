const Loans = require("../../models/loans");
const Users = require("../../models/users");
const syncUserLoanState = require("../userHandlers/syncUserLoanState");
const { getSystemConfig } = require("../../services/systemConfig");
const { processLoanDisbursement } = require("../../services/payout");

const _disburseLoans = async (data) => {
  const loans = await Loans.find({ ID: { $in: data } });
  const systemConfig = await getSystemConfig();
  const results = [];

  for (const loan of loans) {
    const user = await Users.findOne({ userId: loan.userId });
    const payoutResult = await processLoanDisbursement({
      loan,
      user,
      systemConfig: {
        ...systemConfig,
        disbursementMode: "manual",
      },
    });

    loan.isDisbursed = payoutResult.success;
    loan.disbursementMode = "manual";
    loan.disbursementProvider = payoutResult.provider;
    loan.disbursementChannel = payoutResult.channel || "manual-queue";
    loan.payoutStatus = payoutResult.success ? "success" : "failed";
    loan.payoutReference = payoutResult.reference;
    loan.payoutMessage = payoutResult.message;

    await loan.save();

    await syncUserLoanState({
      userId: loan.userId,
      loanId: loan.ID,
      updates: {
        isDisbursed: loan.isDisbursed,
        disbursementMode: loan.disbursementMode,
        disbursementProvider: loan.disbursementProvider,
        disbursementChannel: loan.disbursementChannel,
        payoutStatus: loan.payoutStatus,
        payoutReference: loan.payoutReference,
        payoutMessage: loan.payoutMessage,
      },
    });

    results.push({
      loanId: loan.ID,
      success: payoutResult.success,
      message: payoutResult.message,
      provider: payoutResult.provider,
    });
  }

  return {
    success: results.length > 0 && results.every((item) => item.success),
    results,
  };
};

module.exports = _disburseLoans;
