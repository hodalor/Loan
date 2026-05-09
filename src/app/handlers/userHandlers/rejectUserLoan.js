const Users = require("../../models/users");

const _rejectLoan = async (data) => {
  try {
    let { ID, userId, rvOfName, rvOfCom } = data;

    const user = await Users.findOne({ userId });

    let userLoans = user.loan.loans;

    let loan = userLoans.filter((item) => item.ID === ID);

    loan[0].isNewLoan = false;
    loan[0].loanStatus = "Rejected";
    loan[0].rvOfName = rvOfName;
    loan[0].rvOfCom = rvOfCom;

    let filteredLoans = userLoans.filter((item) => item.ID !== ID);

    let newLoans = [...filteredLoans, loan[0]];

    const loanData = {
      isApplied: false,
      loanStatus: "Rejected",
      paymentStatus: "Not paid",
      acumulatedOverDue: user.loan.acumulatedOverDue,
      loans: newLoans,
    };

    const updated = await Users.updateOne(
      { _id: user._id },
      {
        $set: {
          loan: loanData,
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

module.exports = _rejectLoan;
