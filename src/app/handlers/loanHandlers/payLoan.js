const Loans = require("../../models/loans");

const _payLoan = async ({ id, payAmount }) => {
  try {
    const loan = await Loans.findOne({ loanId: id.toString() });

    let rep =
      loan.repaymentAmount === "" || loan.repaymentAmount === undefined
        ? 0
        : loan.repaymentAmount;

    let amtPa =
      loan.amountPaid === "" || loan.amountPaid === undefined
        ? 0
        : loan.amountPaid;

    let result = parseFloat(rep) - (parseFloat(amtPa) + parseFloat(payAmount));

    const savedLoan = await Loans.findOneAndUpdate(
      { _id: loan._id },
      {
        $set: {
          loanStatus: "Granted",
          paymentStatus: result > 0 ? "Not paid" : "Paid",
          isNewLoan: result > 0 ? true : false,
          dp: new Date(),
          amountPaid: JSON.stringify(parseFloat(amtPa) + parseFloat(payAmount)),
          caseStatus: result > 0 ? "Colection" : "Completed",
          paymentRecords:
            loan.paymentRecords === undefined
              ? [{ datePaid: new Date(), amountPaid: payAmount }]
              : [
                  ...loan.paymentRecords,
                  { datePaid: new Date(), amountPaid: payAmount },
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
