const Users = require("../../models/users");
const Loans = require("../../models/loans");
const _checkOverdues = require("../../../libs/checkOverdue");
const _checkLevel = require("../../../libs/levelCheck");

const toNumber = (value = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeLoanId = (value = "") => String(value || "").trim();
const normalizeReference = (value = "") => String(value || "").trim();

const buildEmbeddedPaymentRecord = ({
  loan = {},
  userId = "",
  loanId = "",
  amt = 0,
  dp = new Date(),
  clear = false,
  paymentRecord = {},
}) => {
  const repaymentAmount = toNumber(loan?.repaymentAmount);
  const nextAmountPaid = toNumber(loan?.amountPaid);
  const explicitRemaining = paymentRecord?.remainingAmount;
  const computedRemaining =
    repaymentAmount > 0 ? Math.max(repaymentAmount - nextAmountPaid, 0).toFixed(2) : "";

  return {
    recordType: paymentRecord?.recordType || (clear ? "balance" : "portal-repayment"),
    loanId: normalizeLoanId(paymentRecord?.loanId || loanId || loan?.ID || loan?.loanId),
    userId: String(paymentRecord?.userId || userId || "").trim(),
    clearanceDate: paymentRecord?.clearanceDate || dp,
    datePaid: paymentRecord?.datePaid || dp,
    remainingAmount:
      explicitRemaining !== undefined && explicitRemaining !== null
        ? `${explicitRemaining}`
        : computedRemaining,
    amountPaid: `${paymentRecord?.amountPaid ?? toNumber(amt)}`,
    actualAmount: `${paymentRecord?.actualAmount ?? paymentRecord?.amountPaid ?? toNumber(amt)}`,
    clearRemainingAmount: `${paymentRecord?.clearRemainingAmount ?? clear}`,
    remarks: paymentRecord?.remarks || "",
    recordProofAudit: paymentRecord?.recordProofAudit || "",
    recordProofConfirm: paymentRecord?.recordProofConfirm || "",
    rejectRemarks: paymentRecord?.rejectRemarks || "",
    auditResults: paymentRecord?.auditResults || (clear ? "pass" : ""),
    reviewedBy: paymentRecord?.reviewedBy || "",
    confirmedBy: paymentRecord?.confirmedBy || "",
    source: paymentRecord?.source || "",
    provider: paymentRecord?.provider || "",
    reference: normalizeReference(paymentRecord?.reference || ""),
    transactionId: normalizeReference(
      paymentRecord?.transactionId || paymentRecord?.reference || ""
    ),
  };
};

const _clearLoan = async (data) => {
  try {
    let { ID, dp, userId, clear, amt, paymentRecord } = data;

    const user = await Users.findOne({ userId });
    if (!user) return false;

    const normalizedLoanId = normalizeLoanId(ID);
    let userLoans = Array.isArray(user.loan?.loans) ? [...user.loan.loans] : [];

    let loan = userLoans.find(
      (item) =>
        normalizeLoanId(item?.ID) === normalizedLoanId ||
        normalizeLoanId(item?.loanId) === normalizedLoanId
    );

    if (!loan && normalizedLoanId) {
      const globalLoan = await Loans.findOne({
        $or: [{ ID: normalizedLoanId }, { loanId: normalizedLoanId }],
      }).lean();

      if (globalLoan) {
        const { _id, __v, ...embeddedLoan } = globalLoan;
        loan = {
          ...embeddedLoan,
          ID: normalizeLoanId(globalLoan.ID || globalLoan.loanId || normalizedLoanId),
          loanId: normalizeLoanId(globalLoan.loanId || globalLoan.ID || normalizedLoanId),
        };
        userLoans.push(loan);
      }
    }

    if (!loan) return false;

    loan.dp = dp;
    loan.loanStatus = "Granted";
    loan.isNewLoan = clear === false ? true : false;
    loan.paymentStatus = clear === false ? "Not paid" : "Paid";
    loan.caseStatus = clear === false ? loan.caseStatus || "Colection" : "Completed";
    loan.amountPaid = toNumber(loan.amountPaid) + toNumber(amt);
    loan.paymentRecords = Array.isArray(loan.paymentRecords) ? [...loan.paymentRecords] : [];

    const nextPaymentRecord = buildEmbeddedPaymentRecord({
      loan,
      userId,
      loanId: normalizedLoanId,
      amt,
      dp,
      clear,
      paymentRecord,
    });
    const nextReference = normalizeReference(nextPaymentRecord.reference || nextPaymentRecord.transactionId);
    const hasDuplicateRecord = loan.paymentRecords.some((item) => {
      const existingReference = normalizeReference(item?.reference || item?.transactionId);

      if (nextReference && existingReference) {
        return existingReference === nextReference;
      }

      return (
        String(item?.recordType || "") === String(nextPaymentRecord.recordType || "") &&
        toNumber(item?.amountPaid) === toNumber(nextPaymentRecord.amountPaid) &&
        new Date(item?.datePaid || item?.clearanceDate || 0).getTime() ===
          new Date(nextPaymentRecord.datePaid || nextPaymentRecord.clearanceDate || 0).getTime()
      );
    });

    if (!hasDuplicateRecord) {
      loan.paymentRecords.push(nextPaymentRecord);
    }

    let filteredLoans = userLoans.filter(
      (item) =>
        normalizeLoanId(item?.ID) !== normalizedLoanId &&
        normalizeLoanId(item?.loanId) !== normalizedLoanId
    );

    let newLoans = [...filteredLoans, loan];

    let resp = await _checkOverdues(loan);

    let lev = !clear ? user.level : await _checkLevel(newLoans);

    const loanData = {
      isApplied: clear === false ? true : false,
      loanStatus: "Granted",
      paymentStatus: clear === false ? "Not paid" : "Paid",
      acumulatedOverDue: parseInt(user.loan?.acumulatedOverDue || 0, 10) + resp,
      loans: newLoans,
    };

    const updated = await Users.updateOne(
      { _id: user._id },
      {
        $set: {
          loan: loanData,
          level: lev,
        },
      }
    );

    if (updated.modifiedCount >= 1) return true;

    if (updated.modifiedCount < 1) return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = _clearLoan;
