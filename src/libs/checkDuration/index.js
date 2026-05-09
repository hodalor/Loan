const _getPreColLoans = async (loanData) => {
  var loans = [];

  if (loanData === undefined || loanData.length === 0) return (loans = []);

  let tda = new Date();

  loanData.forEach((loan) => {
    if (loan.caseStatus !== "Completed") {
      let loanDate = new Date(loan.dop);

      let timeDiff = loanDate.getTime() - tda.getTime();

      let diffDate = timeDiff / (1000 * 3600 * 24);

      let dur = parseInt(diffDate);

      let actDur = dur === -0 ? 0 : dur;

      if (actDur >= 0 && actDur <= 2) {
        loan.dur = actDur;
        loans.push(loan);
      }
    }
  });

  return loans;
};

const _getColLoans = async (loanData) => {
  var loans = [];

  if (loanData === undefined || loanData.length === 0) return (loans = []);

  let tda = new Date();

  loanData.forEach((loan) => {
    if (loan.caseStatus !== "Completed" && loan.loanStatus !== "Review") {
      let loanDate = new Date(loan.dop);

      let timeDiff = loanDate.getTime() - tda.getTime();

      let diffDate = timeDiff / (1000 * 3600 * 24);

      let dur = parseInt(diffDate);

      let actDur = dur === -0 ? 0 : dur;

      if (actDur < 0) {
        loan.dur = actDur;
        loans.push(loan);
      }
    }
  });

  return loans;
};

const _getPreColPayRecs = async (loanData) => {
  var loans = [];

  if (loanData === undefined || loanData.length === 0) return (loans = []);

  loanData.forEach((loan) => {
    let colCallRec =
      loan.collCallRecords === undefined ? 0 : loan.collCallRecords.length;
    let preCallRec =
      loan.preCollCallRecords === undefined
        ? 0
        : loan.preCollCallRecords.length;

    if (
      colCallRec === 0 &&
      preCallRec !== 0 &&
      loan.paymentStatus === "Payed" &&
      loan.clearanceRecord.recordType !== "balance"
    ) {
      loans.push(loan);
    }
  });

  return loans;
};

const _getColPayRecs = async (loanData) => {
  var loans = [];

  if (loanData === undefined || loanData.length === 0) return (loans = []);

  loanData.forEach((loan) => {
    let colCallRec =
      loan.collCallRecords === undefined ? 0 : loan.collCallRecords.length;

    if (
      colCallRec !== 0 &&
      loan.paymentStatus === "Payed" &&
      loan.clearanceRecord.recordType !== "balance"
    ) {
      loans.push(loan);
    }
  });

  return loans;
};

export { _getPreColLoans, _getColLoans, _getPreColPayRecs, _getColPayRecs };
