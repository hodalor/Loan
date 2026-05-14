const _checkDuration = async (data) => {
  let tda = new Date();

  let result = {
    days: 0,
    reAmount: 0,
    payDate: null,
  };

  let loan = await data.find((item) => item.isNewLoan === true);

  if (!loan) return (result = null);

  if (loan.isDisbursed !== true || loan.dop === null || loan.dop === undefined)
    return (result = null);

  let amount = parseFloat(loan.amount); // loan amonut collected
  let repaymentAmount = parseFloat(loan.repaymentAmount); // amount to be paid back, with interest
  let dateOfPayment = loan.dop; // date loan will be paid back

  let loanDate = new Date(dateOfPayment);
  if (Number.isNaN(loanDate.getTime())) return (result = null);

  let timeDiff = loanDate.getTime() - tda.getTime();

  let diffDate = timeDiff / (1000 * 3600 * 24);

  let dur = parseInt(diffDate);

  let percentage = (2 / 100) * amount * dur;

  let newAmount =
    Math.sign(dur) === -1 ? Math.abs(percentage) + repaymentAmount : 0;

  let paidAmount =
    loan.amountPaid === "" || loan.amountPaid === undefined
      ? 0
      : parseFloat(loan.amountPaid);

  result = {
    days: Math.sign(dur) === -1 ? dur : dur,
    reAmount:
      Math.sign(dur) === -1
        ? newAmount - paidAmount
        : parseFloat(loan.repaymentAmount) - paidAmount,
    payDate: loanDate,
  };

  return result;
};

module.exports = _checkDuration;
