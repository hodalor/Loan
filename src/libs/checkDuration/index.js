import { getCalendarDayDifferenceByCountry } from "../countryTime";

const isSettledPayment = (status = "") => ["Payed", "Paid"].includes(String(status || "").trim());
const hasRecordedRepayment = (loan = {}) =>
  Number.parseFloat(loan?.amountPaid || 0) > 0 ||
  (Array.isArray(loan?.paymentRecords) && loan.paymentRecords.length > 0);

const buildCustomerLookup = (customers = []) =>
  new Map(
    (Array.isArray(customers) ? customers : []).map((customer) => [
      String(customer?.userId || ""),
      customer,
    ])
  );

const getLoanCountryProfile = (loan = {}, customerLookup = new Map()) =>
  customerLookup.get(String(loan?.userId || "")) || {};

const _getPreColLoans = async (loanData, customers = []) => {
  var loans = [];
  const customerLookup = buildCustomerLookup(customers);

  if (loanData === undefined || loanData.length === 0) return (loans = []);

  loanData.forEach((loan) => {
    if (loan.caseStatus !== "Completed") {
      const actDur = getCalendarDayDifferenceByCountry(
        loan.dop,
        new Date(),
        getLoanCountryProfile(loan, customerLookup)
      );

      if (actDur >= 0 && actDur <= 2) {
        loan.dur = actDur;
        loans.push(loan);
      }
    }
  });

  return loans;
};

const _getColLoans = async (loanData, customers = []) => {
  var loans = [];
  const customerLookup = buildCustomerLookup(customers);

  if (loanData === undefined || loanData.length === 0) return (loans = []);

  loanData.forEach((loan) => {
    if (loan.caseStatus !== "Completed" && loan.loanStatus !== "Review") {
      const actDur = getCalendarDayDifferenceByCountry(
        loan.dop,
        new Date(),
        getLoanCountryProfile(loan, customerLookup)
      );

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
      (isSettledPayment(loan.paymentStatus) || hasRecordedRepayment(loan)) &&
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
      (isSettledPayment(loan.paymentStatus) || hasRecordedRepayment(loan)) &&
      loan.clearanceRecord.recordType !== "balance"
    ) {
      loans.push(loan);
    }
  });

  return loans;
};

export { _getPreColLoans, _getColLoans, _getPreColPayRecs, _getColPayRecs };
