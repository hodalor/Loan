const _getPreColUserLoans = async (data) => {
  var loans = {};

  let tda = new Date();

  let loanDate = new Date(data.loan.dop);

  let timeDiff = loanDate.getTime() - tda.getTime();

  let diffDate = timeDiff / (1000 * 3600 * 24);

  let dur = parseInt(diffDate);

  if (0 <= dur && dur <= 2) {
    if (
      data.loan.preCollOfficer === data.userName &&
      data.loan.caseStatus !== "Completed"
    ) {
      loans = data.loan;
    }
  }

  let colCallRec =
    data.loan.collCallRecords === undefined
      ? 0
      : data.loan.collCallRecords.length;
  let preCallRec =
    data.loan.preCollCallRecords === undefined
      ? 0
      : data.loan.preCollCallRecords.length;

  if (
    colCallRec === 0 &&
    preCallRec !== 0 &&
    data.loan.paymentStatus === "Payed" &&
    data.loan.preCollOfficer === data.userName
  ) {
    loans = data.loan;
  }

  return loans;
};

const _getColUserLoans = async (data) => {
  var loans = {};

  let tda = new Date();

  let loanDate = new Date(data.loan.dop);

  let timeDiff = loanDate.getTime() - tda.getTime();

  let diffDate = timeDiff / (1000 * 3600 * 24);

  let dur = parseInt(diffDate);

  if (dur < 0) {
    if (
      data.loan.collofficer === data.userName &&
      data.loan.caseStatus !== "Completed"
    ) {
      loans = data.loan;
    }
  }

  let colCallRec =
    data.loan.collCallRecords === undefined
      ? 0
      : data.loan.collCallRecords.length;

  if (
    colCallRec !== 0 &&
    data.loan.paymentStatus === "Payed" || data.loan.paymentStatus === "Paid" &&
    data.loan.collofficer === data.userName && Object.keys(data.loan).length !== 0
  ) {
    loans = data.loan;
  }
  
  return loans;
};

module.exports = { _getPreColUserLoans, _getColUserLoans };
