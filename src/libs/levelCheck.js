const _checkLevel = async (data) => {
  var res = [];
  await data.forEach((item) => {
    if (item.loanStatus === "Granted" && item.paymentStatus === "Paid") {
      return res.push(item);
    }
  });

  var result = 1;

  if (res.length > 0) {
    return (result = res.length + 1);
  }

  return result;
};

module.exports = _checkLevel;
