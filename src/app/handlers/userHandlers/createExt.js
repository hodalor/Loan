const Users = require("../../models/users");

const _createExt = async (data) => {
  try {
    let { ID, dop, userId, extRecord } = data;

    const user = await Users.findOne({ userId });

    let userLoans = user.loan.loans;

    let loan = userLoans.filter((item) => item.ID === ID);

    loan[0].dop = dop;
    if (extRecord) {
      loan[0].extRecords = Array.isArray(loan[0].extRecords) ? loan[0].extRecords : [];
      loan[0].extRecords.push(extRecord);
    }

    let filteredLoans = userLoans.filter((item) => item.ID !== ID);

    let newLoans = [...filteredLoans, loan[0]];

    const loanData = {
      isApplied: user.loan.isApplied,
      loanStatus: user.loan.loanStatus,
      paymentStatus: user.loan.paymentStatus,
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

module.exports = _createExt;
