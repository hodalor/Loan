const Users = require("../../models/users");
const Loans = require("../../models/loans");
const _checkOverdues = require("../../../libs/checkOverdue");
const _checkLevel = require("../../../libs/levelCheck");

const toNumber = (value = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeLoanId = (value = "") => String(value || "").trim();

const _clearLoan = async (data) => {
  try {
    let { ID, dp, userId, clear, amt } = data;

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
