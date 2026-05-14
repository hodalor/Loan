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

const hasRepaymentRecord = ({
  paymentRecords = [],
  paidAt = new Date(),
  amountPaid = 0,
  toleranceMs = 1000 * 60 * 60,
}) => {
  const targetTime = new Date(paidAt).getTime();
  const targetAmount = toNumber(amountPaid);

  return (Array.isArray(paymentRecords) ? paymentRecords : []).some((record) => {
    const recordTime = new Date(record?.datePaid || 0).getTime();
    const recordAmount = toNumber(record?.amountPaid);

    if (!Number.isFinite(recordTime) || !Number.isFinite(targetTime)) {
      return recordAmount === targetAmount;
    }

    return recordAmount === targetAmount && Math.abs(recordTime - targetTime) <= toleranceMs;
  });
};

const ensureRepaymentEventInLoanLedger = async ({
  loanId = "",
  amountPaid = 0,
  paidAt = new Date(),
}) => {
  const matchingLoans = await findMatchingLoanDocs(loanId);
  if (matchingLoans.length === 0) return null;

  const canonicalLoan = matchingLoans[0];
  const normalizedLoanId = normalizeLoanIdentifier(
    canonicalLoan.ID || canonicalLoan.loanId || canonicalLoan._id
  );
  const nextPaymentRecords = Array.isArray(canonicalLoan?.paymentRecords)
    ? [...canonicalLoan.paymentRecords]
    : [];

  if (
    !hasRepaymentRecord({
      paymentRecords: nextPaymentRecords,
      paidAt,
      amountPaid,
    })
  ) {
    nextPaymentRecords.push({
      datePaid: paidAt,
      amountPaid: toNumber(amountPaid),
    });

    await Loans.updateMany(
      {
        $or: [{ ID: normalizedLoanId }, { loanId: normalizedLoanId }, { _id: canonicalLoan._id }],
      },
      {
        $set: {
          paymentRecords: nextPaymentRecords,
        },
      }
    );
  }

  return {
    loan: canonicalLoan,
    paymentRecords: nextPaymentRecords,
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
  ensureRepaymentEventInLoanLedger,
  findMatchingLoanDocs,
};
