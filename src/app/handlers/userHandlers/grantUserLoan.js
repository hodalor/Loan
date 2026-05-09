const syncUserLoanState = require("./syncUserLoanState");

const _grantLoan = async (data) => {
  try {
    const {
      ID,
      dod,
      dop,
      loanStatus,
      userId,
      rvOfName,
      rvOfCom,
      caseStatus,
      isDisbursed,
      disbursementMode,
      disbursementProvider,
      disbursementChannel,
      payoutStatus,
      payoutReference,
      payoutMessage,
    } = data;

    return await syncUserLoanState({
      userId,
      loanId: ID,
      rootLoanStatus: loanStatus,
      updates: {
        dop,
        dod,
        loanStatus,
        caseStatus,
        rvOfName,
        rvOfCom,
        isDisbursed,
        disbursementMode,
        disbursementProvider,
        disbursementChannel,
        payoutStatus,
        payoutReference,
        payoutMessage,
      },
    });
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = _grantLoan;
