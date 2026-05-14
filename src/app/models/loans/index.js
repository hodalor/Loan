const mongoose = require("mongoose");

const auditCallRecords = new mongoose.Schema({
  calledNumber: {
    type: String,
    required: true,
    unique: false,
  },
  relation: {
    type: String,
    required: true,
    unique: false,
  },
  callResult: {
    type: String,
    required: true,
    unique: false,
  },
  callDate: {
    type: Date,
    required: true,
    unique: false,
  },
  auditOfficer: {
    type: String,
    required: true,
    unique: false,
  },
  remarks: {
    type: String,
    required: true,
    unique: false,
  },
});

const preCollCallRecords = new mongoose.Schema({
  calledNumber: {
    type: String,
    required: true,
    unique: false,
  },
  relation: {
    type: String,
    required: true,
    unique: false,
  },
  callResult: {
    type: String,
    required: true,
    unique: false,
  },
  plannedRepayDate: {
    type: Date,
    required: false,
    unique: false,
  },
  callDate: {
    type: Date,
    required: true,
    unique: false,
  },
  preCollOfficer: {
    type: String,
    required: true,
    unique: false,
  },
  remarks: {
    type: String,
    required: true,
    unique: false,
  },
});

const extensionRecords = new mongoose.Schema(
  {
    loanId: {
      type: String,
      required: true,
      unique: false,
    },
    extPeriod: {
      type: String,
      required: true,
      unique: false,
    },
    extHandlingFee: {
      type: String,
      required: true,
      unique: false,
    },
    extExpDate: {
      type: Date,
      required: true,
      unique: false,
    },
    extStatus: {
      type: String,
      required: false,
      unique: false,
    },
    source: {
      type: String,
      required: false,
      unique: false,
    },
    requestStatus: {
      type: String,
      required: false,
      unique: false,
    },
    requestedBy: {
      type: String,
      required: false,
      unique: false,
    },
    approvedBy: {
      type: String,
      required: false,
      unique: false,
    },
    proofUrl: {
      type: String,
      required: false,
      unique: false,
    },
  },
  { timestamps: true }
);

const collCallRecords = new mongoose.Schema({
  calledNumber: {
    type: String,
    required: true,
    unique: false,
  },
  relation: {
    type: String,
    required: true,
    unique: false,
  },
  callResult: {
    type: String,
    required: true,
    unique: false,
  },
  plannedRepayDate: {
    type: Date,
    required: false,
    unique: false,
  },
  callDate: {
    type: Date,
    required: true,
    unique: false,
  },
  collOfficer: {
    type: String,
    required: true,
    unique: false,
  },
  remarks: {
    type: String,
    required: true,
    unique: false,
  },
});

const contacts = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    unique: false,
  },
  number: {
    type: String,
    required: false,
    unique: false,
  },
});

const paymentRecs = new mongoose.Schema({
  datePaid: {
    type: Date,
    required: false,
    unique: false,
  },
  amountPaid: {
    type: String,
    required: false,
    unique: false,
  },
});

const loanSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: false,
    unique: false,
  },
  ID: {
    type: String,
    required: true,
    unique: false,
  },
  loanId: {
    type: String,
    required: false,
    unique: false,
  },
  terms: {
    type: String,
    required: false,
    unique: false,
  },
  loanStatus: {
    type: String,
    required: false,
    unique: false,
  },
  paymentStatus: {
    type: String,
    required: false,
    unique: false,
  },
  amount: {
    type: String,
    required: false,
    unique: false,
  },
  duration: {
    type: String,
    required: false,
    unique: false,
  },
  dop: {
    type: Date,
    required: false,
    unique: false,
  },
  actualDop: {
    type: Date,
    required: false,
    unique: false,
  },
  isNewLoan: {
    type: Boolean,
    required: false,
    unique: false,
  },
  interest: {
    type: String,
    required: false,
    unique: false,
  },
  repaymentAmount: {
    type: String,
    required: false,
    unique: false,
  },
  usage: {
    type: String,
    required: false,
    unique: false,
  },
  paymentMethod: {
    type: String,
    required: false,
    unique: false,
  },
  paymentOperator: {
    type: String,
    required: false,
    unique: false,
  },
  whereHeard: {
    type: String,
    required: false,
    unique: false,
  },
  facialRecog: {
    type: String,
    required: false,
    unique: false,
  },
  doa: {
    type: Date,
    required: false,
    unique: false,
  },
  dod: {
    type: Date,
    required: false,
    unique: false,
  },
  dp: {
    type: Date,
    required: false,
    unique: false,
  },
  rvOfName: {
    type: String,
    required: false,
    unique: false,
  },
  rvOfCom: {
    type: String,
    required: false,
    unique: false,
  },
  caseStatus: {
    type: String, //Review , Colection
    required: false,
    unique: false,
  },
  preCollOfficer: {
    type: String,
    required: false,
    unique: false,
  },
  collofficer: {
    type: String,
    required: false,
    unique: false,
  },
  clearanceFlag: {
    type: Boolean,
    required: false,
  },
  amountPaid: {
    type: String,
    required: false,
    unique: false,
  },
  isDisbursed: {
    type: Boolean,
    required: false,
    unique: false,
  },
  disbursementMode: {
    type: String,
    required: false,
    unique: false,
  },
  disbursementProvider: {
    type: String,
    required: false,
    unique: false,
  },
  disbursementChannel: {
    type: String,
    required: false,
    unique: false,
  },
  payoutStatus: {
    type: String,
    required: false,
    unique: false,
  },
  payoutReference: {
    type: String,
    required: false,
    unique: false,
  },
  payoutMessage: {
    type: String,
    required: false,
    unique: false,
  },
  gpsLocation: {
    type: String,
    required: false,
    unique: false,
  },
  auditCallRecords: {
    type: [auditCallRecords],
    required: false,
  },
  contacts: {
    type: [contacts],
    required: false,
  },
  preCollCallRecords: {
    type: [preCollCallRecords],
    required: false,
  },
  collCallRecords: {
    type: [collCallRecords],
    required: false,
  },
  extRecords: {
    type: [extensionRecords],
    required: false,
  },
  paymentRecords: {
    type: [paymentRecs],
    required: false,
  },
  clearanceRecord: {
    recordType: {
      type: String, //balance , public transfare
      required: false,
      unique: false,
    },
    loanId: {
      type: String,
      required: false,
      unique: false,
    },
    userId: {
      type: String,
      required: false,
      unique: false,
    },
    clearanceDate: {
      type: Date,
      required: false,
      unique: false,
    },
    remainingAmount: {
      type: String,
      required: false,
      unique: false,
    },
    amountPaid: {
      type: String,
      required: false,
      unique: false,
    },
    actualAmount: {
      type: String,
      required: false,
      unique: false,
    },
    clearRemainingAmount: {
      type: Boolean,
      required: false,
      unique: false,
    },
    remarks: {
      type: String,
      required: false,
      unique: false,
    },
    recordProofAudit: {
      type: String,
      required: false,
      unique: false,
    },
    recordProofConfirm: {
      type: String,
      required: false,
      unique: false,
    },
    rejectRemarks: {
      type: String,
      required: false,
      unique: false,
    },
    auditResults: {
      type: String, //pass(clear and close case) , reject(case still open for collection)
      required: false,
      unique: false,
    },
    reviewedBy: {
      type: String,
      required: false,
      unique: false,
    },
    confirmedBy: {
      type: String,
      required: false,
      unique: false,
    },
  },
});

loanSchema.index({ ID: 1 });
loanSchema.index({ userId: 1, doa: -1 });
loanSchema.index({ rvOfName: 1, doa: -1 });
loanSchema.index({ preCollOfficer: 1, dop: 1 });
loanSchema.index({ collofficer: 1, dop: 1 });
loanSchema.index({ loanStatus: 1, isDisbursed: 1, doa: -1 });
loanSchema.index({ paymentStatus: 1, dop: 1 });
loanSchema.index({ payoutStatus: 1, loanStatus: 1 });
loanSchema.index({ isNewLoan: 1, rvOfName: 1, doa: -1 });
loanSchema.index({ caseStatus: 1, dop: 1 });

module.exports = mongoose.model("Loans", loanSchema);
