const _checkOverdues = async (data) => {
  let tda = new Date();

  let result = 0;

  let loanDate = new Date(data.dop);

  let timeDiff = loanDate.getTime() - tda.getTime();

  let diffDate = timeDiff / (1000 * 3600 * 24);

  let dur = parseInt(diffDate);

  result = Math.sign(dur) === -1 ? -dur : 0;

  return result;
};

module.exports = _checkOverdues;
