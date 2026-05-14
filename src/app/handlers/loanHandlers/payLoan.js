const Loans = require("../../models/loans");
const { dedupeLoanRecords } = require("../../../libs/loanRecords");

const normalizeLoanIdentifier = (value = "") => String(value || "").trim();

const _payLoan = async ({ id, payAmount }) => {
  try {
    const normalizedId = normalizeLoanIdentifier(id);
    if (!normalizedId) return false;

    let matchingLoans = await Loans.find({
      $or: [{ loanId: normalizedId }, { ID: normalizedId }],
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    if (matchingLoans.length === 0) {
      const directMatch = await Loans.findById(normalizedId).catch(() => null);
      matchingLoans = directMatch ? [directMatch.toObject ? directMatch.toObject() : directMatch] : [];
    }

    const loan = dedupeLoanRecords(matchingLoans)[0];

    if (!loan) return false;

    let rep =
      loan.repaymentAmount === "" || loan.repaymentAmount === undefined
        ? 0
        : loan.repaymentAmount;

    let amtPa =
      loan.amountPaid === "" || loan.amountPaid === undefined
        ? 0
        : loan.amountPaid;

    let result = parseFloat(rep) - (parseFloat(amtPa) + parseFloat(payAmount));

    const nextPaymentRecords =
      loan.paymentRecords === undefined
        ? [{ datePaid: new Date(), amountPaid: payAmount }]
        : [...loan.paymentRecords, { datePaid: new Date(), amountPaid: payAmount }];

    const savedLoan = await Loans.updateMany(
      {
        $or: [{ loanId: normalizedId }, { ID: normalizedId }, { _id: loan._id }],
      },
      {
        $set: {
          loanStatus: "Granted",
          paymentStatus: result > 0 ? "Not paid" : "Paid",
          isNewLoan: result > 0 ? true : false,
          dp: new Date(),
          amountPaid: JSON.stringify(parseFloat(amtPa) + parseFloat(payAmount)),
          caseStatus: result > 0 ? "Colection" : "Completed",
          paymentRecords: nextPaymentRecords,
        },
      }
    );

    if (savedLoan?.modifiedCount >= 1 || savedLoan?.matchedCount >= 1) return true;

    if (!savedLoan) return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = _payLoan;
