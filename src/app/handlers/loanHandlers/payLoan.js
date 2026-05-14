const mongoose = require("mongoose");
const Loans = require("../../models/loans");

const toNumber = (value = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const _payLoan = async ({ id, payAmount }) => {
  try {
    const lookupValue = String(id || "").trim();
    if (!lookupValue) return false;

    const matchers = [{ loanId: lookupValue }, { ID: lookupValue }];
    if (mongoose.Types.ObjectId.isValid(lookupValue)) {
      matchers.push({ _id: lookupValue });
    }

    const loan = await Loans.findOne({ $or: matchers });
    if (!loan) return false;

    const rep = toNumber(loan.repaymentAmount);
    const amtPa = toNumber(loan.amountPaid);
    const nextPaidAmount = amtPa + toNumber(payAmount);
    const result = rep - nextPaidAmount;

    const savedLoan = await Loans.findOneAndUpdate(
      { _id: loan._id },
      {
        $set: {
          loanStatus: "Granted",
          paymentStatus: result > 0 ? "Not paid" : "Paid",
          isNewLoan: result > 0 ? true : false,
          dp: new Date(),
          amountPaid: JSON.stringify(nextPaidAmount),
          caseStatus: result > 0 ? "Colection" : "Completed",
          paymentRecords:
            loan.paymentRecords === undefined
              ? [{ datePaid: new Date(), amountPaid: toNumber(payAmount) }]
              : [
                  ...loan.paymentRecords,
                  { datePaid: new Date(), amountPaid: toNumber(payAmount) },
                ],
        },
      },
      {
        new: true,
      }
    );

    if (savedLoan) return true;

    if (!savedLoan) return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = _payLoan;
