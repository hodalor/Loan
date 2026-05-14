const Loans = require("../../models/loans");

const normalizeLoanIdentifier = (value = "") => String(value || "").trim();
const toNumber = (value = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const findMatchingLoanDocs = async (loanId = "") => {
  const normalizedLoanId = normalizeLoanIdentifier(loanId);
  if (!normalizedLoanId) return [];

  const matches = await Loans.find({
    $or: [{ ID: normalizedLoanId }, { loanId: normalizedLoanId }],
  }).sort({ updatedAt: -1, createdAt: -1 });

  if (matches.length > 0) return matches;

  const byMongoId = await Loans.findById(normalizedLoanId).catch(() => null);
  return byMongoId ? [byMongoId] : [];
};

const buildRepaymentLedgerState = ({
  loan = {},
  amountJustCleared = 0,
  paidAt = new Date(),
  clearOverride,
}) => {
  const repaymentTarget = toNumber(loan?.repaymentAmount);
  const currentPaid = toNumber(loan?.amountPaid);
  const nextPaid = currentPaid + toNumber(amountJustCleared);
  const shouldClear =
    typeof clearOverride === "boolean"
      ? clearOverride
      : repaymentTarget > 0
      ? nextPaid + 0.009 >= repaymentTarget
      : false;

  return {
    isNewLoan: !shouldClear,
    paymentStatus: shouldClear ? "Paid" : "Not paid",
    loanStatus: "Granted",
    caseStatus: shouldClear ? "Completed" : "Colection",
    dp: paidAt,
    amountPaid: nextPaid,
    paymentRecords: [
      ...(Array.isArray(loan?.paymentRecords) ? loan.paymentRecords : []),
      {
        datePaid: paidAt,
        amountPaid: toNumber(amountJustCleared),
      },
    ],
    clear: shouldClear,
  };
};

const applyRepaymentToLoanLedger = async ({
  loanId = "",
  amountJustCleared = 0,
  paidAt = new Date(),
  clearOverride,
}) => {
  const matchingLoans = await findMatchingLoanDocs(loanId);
  if (matchingLoans.length === 0) return null;

  const canonicalLoan = matchingLoans[0];
  const state = buildRepaymentLedgerState({
    loan: canonicalLoan,
    amountJustCleared,
    paidAt,
    clearOverride,
  });

  const normalizedLoanId = normalizeLoanIdentifier(
    canonicalLoan.ID || canonicalLoan.loanId || canonicalLoan._id
  );

  await Loans.updateMany(
    {
      $or: [{ ID: normalizedLoanId }, { loanId: normalizedLoanId }, { _id: canonicalLoan._id }],
    },
    {
      $set: {
        isNewLoan: state.isNewLoan,
        paymentStatus: state.paymentStatus,
        loanStatus: state.loanStatus,
        caseStatus: state.caseStatus,
        dp: state.dp,
        amountPaid: `${state.amountPaid}`,
        paymentRecords: state.paymentRecords,
      },
    }
  );

  return {
    loan: canonicalLoan,
    state,
  };
};

module.exports = {
  applyRepaymentToLoanLedger,
  buildRepaymentLedgerState,
  findMatchingLoanDocs,
};
