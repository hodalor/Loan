const mongoose = require("mongoose");

const userContacts = new mongoose.Schema({
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

const paymentMethods = new mongoose.Schema(
  {
    method: {
      type: String,
      required: true,
      unique: false,
    },
    email: {
      type: String,
      required: false,
      unique: false,
    },
    operator: {
      type: String,
      required: true,
      unique: false,
    },
    isVerified: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

const auditCallRecords = new mongoose.Schema({
  calledNumber: {
    type: String,
    required: true,
    unique: false,
  },
  emContactField: {
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
    required: true,
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

const extensionRecords = new mongoose.Schema({
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
    required: true,
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
});

const collCallRecords = new mongoose.Schema({
  calledNumber: {
    type: String,
    required: true,
    unique: false,
  },
  emContactField: {
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
    required: true,
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

const paymentRecords = new mongoose.Schema({
  recordType: {
    type: String, //balance , public transfare
    required: true,
    unique: false,
  },
  loanId: {
    type: String,
    required: true,
    unique: false,
  },
  userId: {
    type: String,
    required: true,
    unique: false,
  },
  clearanceDate: {
    type: Date,
    required: true,
    unique: false,
  },
  remainingAmount: {
    type: String,
    required: true,
    unique: false,
  },
  amountPaid: {
    type: String,
    required: true,
    unique: false,
  },
  actualAmount: {
    type: String,
    required: true,
    unique: false,
  },
  clearRemainingAmount: {
    type: String,
    required: true,
    unique: false,
  },
  remarks: {
    type: String,
    required: true,
    unique: false,
  },
  recordProofAudit: {
    type: String,
    required: true,
    unique: false,
  },
  recordProofConfirm: {
    type: String,
    required: true,
    unique: false,
  },
  rejectRemarks: {
    type: String,
    required: true,
    unique: false,
  },
  auditResults: {
    type: String, //pass(clear and close case) , reject(case still open for collection)
    required: true,
    unique: false,
  },
  reviewedBy: {
    type: String,
    required: true,
    unique: false,
  },
  confirmedBy: {
    type: String,
    required: true,
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
    required: false,
    unique: false,
  },
  terms: {
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
  auditCaseStatus: {
    type: String, //assigned,not-assigned
    required: false,
    unique: false,
  },
  preCollCaseStatus: {
    type: String,
    required: false,
    unique: false,
  },
  collCaseStatus: {
    type: String,
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
  auditCallRecords: {
    type: [auditCallRecords],
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
});

const userSchema = new mongoose.Schema(
  {
    isActive: {
      type: Boolean,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: false,
    },
    userId: {
      type: String,
      required: true,
      unique: false,
    },
    phone: {
      type: String,
      required: true,
      unique: false,
    },
    countryCode: {
      type: String,
      required: false,
      unique: false,
      default: "",
    },
    countryName: {
      type: String,
      required: false,
      unique: false,
      default: "",
    },
    countryDialCode: {
      type: String,
      required: false,
      unique: false,
      default: "",
    },
    locale: {
      type: String,
      required: false,
      unique: false,
      default: "",
    },
    timeZone: {
      type: String,
      required: false,
      unique: false,
      default: "",
    },
    currencyCode: {
      type: String,
      required: false,
      unique: false,
      default: "",
    },
    currencySymbol: {
      type: String,
      required: false,
      unique: false,
      default: "",
    },
    isVerified: {
      type: Boolean,
      required: true,
      unique: false,
    },
    isRegistered: {
      type: Boolean,
      required: true,
      unique: false,
    },
    level: {
      type: String,
      required: true,
      unique: false,
    },
    contacts: {
      type: [userContacts],
      required: true,
    },
    userImage: {
      type: String,
      required: false,
      unique: false,
    },
    IDinfo: {
      idFront: {
        type: String,
        required: true,
        unique: false,
      },
      idBack: {
        type: String,
        required: true,
        unique: false,
      },
      firstName: {
        type: String,
        required: true,
        unique: false,
      },
      lastName: {
        type: String,
        required: true,
        unique: false,
      },
      middleName: {
        type: String,
        required: false,
        unique: false,
      },
      gender: {
        type: String,
        required: true,
        unique: false,
      },
      gCardNumber: {
        type: String,
        required: true,
        unique: false,
      },
    },
    pesonalInfo: {
      dob: {
        type: String,
        required: true,
        unique: false,
      },
      schoolStatus: {
        type: Boolean,
        required: true,
      },
      educationalLevel: {
        type: String,
        required: true,
        unique: false,
      },
      residenceType: {
        type: String,
        required: true,
        unique: false,
      },
      dAddress: {
        type: String,
        required: true,
        unique: false,
      },
      areaName: {
        type: String,
        required: true,
        unique: false,
      },
      landMark: {
        type: String,
        required: true,
        unique: false,
      },
      residenceTime: {
        type: String,
        required: true,
        unique: false,
      },
      incomeSource: {
        type: String,
        required: true,
        unique: false,
      },
      maritalStatus: {
        type: String,
        required: true,
        unique: false,
      },
      relativesINOC: {
        type: String,
        required: true,
        unique: false,
      },
      bUPphone: {
        type: String,
        required: false,
        unique: false,
      },
    },
    educationInfo: {
      currentSchoolName: {
        type: String,
        required: false,
        unique: false,
      },
      highestLevel: {
        type: String,
        required: false,
        unique: false,
      },
      courseOfStudy: {
        type: String,
        required: false,
        unique: false,
      },
      graduationYear: {
        type: String,
        required: false,
        unique: false,
      },
      schoolAddress: {
        type: String,
        required: false,
        unique: false,
      },
    },
    workInfo: {
      workUnit: {
        type: String,
        required: true,
        unique: false,
      },
      industry: {
        type: String,
        required: true,
        unique: false,
      },
      workAddress: {
        type: String,
        required: true,
        unique: false,
      },
      companyAddress: {
        type: String,
        required: true,
        unique: false,
      },
      LNDmarkCompany: {
        type: String,
        required: true,
        unique: false,
      },
      workHours: {
        type: String,
        required: true,
        unique: false,
      },
      currentIncome: {
        type: String,
        required: true,
        unique: false,
      },
      workContent: {
        type: String,
        required: true,
        unique: false,
      },
    },
    emergncyContacts: {
      contact1: {
        name: {
          type: String,
          required: true,
          unique: false,
        },
        phone: {
          type: String,
          required: true,
          unique: false,
        },
        educationalLevel: {
          type: String,
          required: true,
          unique: false,
        },
        relationship: {
          type: String,
          required: true,
          unique: false,
        },
      },
      contact2: {
        name: {
          type: String,
          required: true,
          unique: false,
        },
        phone: {
          type: String,
          required: true,
          unique: false,
        },
        educationalLevel: {
          type: String,
          required: true,
          unique: false,
        },
        relationship: {
          type: String,
          required: true,
          unique: false,
        },
      },
      contact3: {
        name: {
          type: String,
          required: true,
          unique: false,
        },
        phone: {
          type: String,
          required: true,
          unique: false,
        },
        educationalLevel: {
          type: String,
          required: true,
          unique: false,
        },
        relationship: {
          type: String,
          required: true,
          unique: false,
        },
      },
    },
    paymentMethods: {
      type: [paymentMethods],
      required: false,
    },
    loan: {
      isApplied: {
        type: Boolean,
        required: false,
      },
      loanStatus: {
        type: String,
        required: false,
      },
      paymentStatus: {
        type: String,
        required: false,
      },
      acumulatedOverDue: {
        type: Number,
        required: false,
      },
      loans: {
        type: [loanSchema],
        required: false,
      },
    },
  },
  { timestamps: true }
);

userSchema.index({ userId: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model("User", userSchema);
