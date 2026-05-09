const _getPreColLoans = async (loan) => {
  var loans = {};

  let tda = new Date();

  let loanDate = new Date(loan.dop);

  let timeDiff = loanDate.getTime() - tda.getTime();

  let diffDate = timeDiff / (1000 * 3600 * 24);

  let dur = parseInt(diffDate);

  if (0 <= dur && dur <= 2) {
    if (loan.caseStatus !== "Completed") {
      loans = loan;
    }
  }

  let colCallRec =
    loan.collCallRecords === undefined ? 0 : loan.collCallRecords.length;
  let preCallRec =
    loan.preCollCallRecords === undefined ? 0 : loan.preCollCallRecords.length;

  if (colCallRec === 0 && preCallRec !== 0 && loan.paymentStatus === "Payed") {
    loans = loan;
  }

  return loans;
};

const _getColLoans = async (loan) => {
  var loans = {};

  let tda = new Date();

  let loanDate = new Date(loan.dop);

  let timeDiff = loanDate.getTime() - tda.getTime();

  let diffDate = timeDiff / (1000 * 3600 * 24);

  let dur = parseInt(diffDate);

  if (dur < 0) {
    if (loan.caseStatus !== "Completed") {
      loans = loan;
    }
  }

  let colCallRec =
    loan.collCallRecords === undefined ? 0 : loan.collCallRecords.length;

  if (colCallRec !== 0 && loan.paymentStatus === "Payed") {
    loans = loan;
  }

  return loans;
};

module.exports = { _getPreColLoans, _getColLoans };
