const grantLoan = require("./grantLoan");
const loanStatus = require("./loanStatus");
const rejectLoan = require("./rejectLoan");
const repaymen = require("./repaymen");
const assignCase = require("./assignCase");
const assignColCase = require("./assignColCase");
const assignPreCol = require("./assignPreCol");
const auditCallRecords = require("./auditCallRecords");
const clearCase = require("./clearCase");
const clearCaseBalance = require("./clearCaseBalance");
const colCallRecords = require("./colCallRecords");
const confirmClearBalance = require("./confirmClearBalance");
const confirmClearPublic = require("./confirmClearPublic");
const extRecord = require("./extRecord");
const preColCallRecords = require("./preColCallRecords");
const unassignAuditCases = require("./unassignAuditCases");
const unassignColCases = require("./unassignColCases");
const unassignPreColCases = require("./unassignPreColCases");
const requestLoan = require("./requestLoan");
const getLoans = require("./getLoans");
const getLoansByAdminID = require("./getLoansByAdminID");
const retryDisbursement = require("./retryDisbursement");
const manualDisbursement = require("./manualDisbursement");
const adminExtension = require("./adminExtension");

module.exports = {
  grantLoan,
  loanStatus,
  rejectLoan,
  repaymen,
  requestLoan,
  assignCase,
  assignColCase,
  assignPreCol,
  auditCallRecords,
  clearCase,
  clearCaseBalance,
  colCallRecords,
  confirmClearBalance,
  confirmClearPublic,
  extRecord,
  preColCallRecords,
  unassignAuditCases,
  unassignColCases,
  unassignPreColCases,
  getLoans,
  getLoansByAdminID,
  retryDisbursement,
  manualDisbursement,
  adminExtension,
};
