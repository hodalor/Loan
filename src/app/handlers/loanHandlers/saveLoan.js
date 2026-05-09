const Loans = require("../../models/loans");

const _saveLoan = async (data) => {
  try {
    const newLoan = new Loans(data);

    const savedLoan = await newLoan.save();

    if (savedLoan) return true;

    if (!savedLoan) return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = _saveLoan;
