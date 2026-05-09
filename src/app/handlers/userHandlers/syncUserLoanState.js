const Users = require("../../models/users");

const syncUserLoanState = async ({ userId, loanId, updates = {}, rootLoanStatus }) => {
  try {
    const user = await Users.findOne({ userId });
    if (!user) return false;

    const userLoans = Array.isArray(user.loan?.loans) ? user.loan.loans : [];
    const targetLoan = userLoans.find((item) => item.ID === loanId);

    if (!targetLoan) return false;

    Object.assign(targetLoan, updates);

    const nextLoans = userLoans.map((item) => (item.ID === loanId ? targetLoan : item));

    user.loan = {
      ...user.loan,
      loanStatus: rootLoanStatus || user.loan.loanStatus,
      loans: nextLoans,
    };

    const savedUser = await user.save();
    return Boolean(savedUser);
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = syncUserLoanState;
