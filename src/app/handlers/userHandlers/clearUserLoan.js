const Users = require("../../models/users");
const _checkOverdues = require("../../../libs/checkOverdue");
const _checkLevel = require("../../../libs/levelCheck");

const _clearLoan = async (data) => {
  try {
    let { ID, dp, userId, clear, amt } = data;

    const user = await Users.findOne({ userId });

    let userLoans = user.loan.loans;

    let loan = userLoans.find((item) => item.ID === ID);

    loan.dp = dp;
    loan.loanStatus = "Granted";
    loan.isNewLoan = clear === false ? true : false;
    loan.paymentStatus = clear === false ? "Not paid" : "Paid";
    loan.amountPaid =
      loan.amountPaid === undefined
        ? amt
        : parseFloat(loan.amountPaid) + parseFloat(amt);

    let filteredLoans = userLoans.filter((item) => item.ID !== ID);

    let newLoans = [...filteredLoans, loan];

    let resp = await _checkOverdues(loan);

    let lev = !clear ? user.level : await _checkLevel(newLoans);

    const loanData = {
      isApplied: clear === false ? true : false,
      loanStatus: "Granted",
      paymentStatus: clear === false ? "Not paid" : "Paid",
      acumulatedOverDue: parseInt(user.loan.acumulatedOverDue) + resp,
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
