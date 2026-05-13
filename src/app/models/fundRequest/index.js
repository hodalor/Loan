const mongoose = require("mongoose");

const actorSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: "",
    },
    userName: {
      type: String,
      default: "",
    },
    fullName: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const approvalSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      default: "pending",
    },
    remark: {
      type: String,
      default: "",
    },
    actedAt: {
      type: Date,
      default: null,
    },
    actor: {
      type: actorSchema,
      default: {},
    },
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: "",
    },
    actedAt: {
      type: Date,
      default: Date.now,
    },
    actor: {
      type: actorSchema,
      default: {},
    },
  },
  { _id: false }
);

const fundRequestSchema = new mongoose.Schema(
  {
    requestCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    batchReference: {
      type: String,
      default: "",
      index: true,
    },
    requestType: {
      type: String,
      enum: ["payment", "airtime"],
      required: true,
      index: true,
    },
    requestMode: {
      type: String,
      enum: ["single", "batch"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      default: "pending_first_approval",
      index: true,
    },
    employeeUserId: {
      type: String,
      required: true,
      index: true,
    },
    employeeUserName: {
      type: String,
      required: true,
      index: true,
    },
    employeeName: {
      type: String,
      default: "",
    },
    department: {
      type: String,
      default: "",
      index: true,
    },
    staffGroupId: {
      type: String,
      default: "",
      index: true,
    },
    staffGroupName: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    salaryNumber: {
      type: String,
      default: "",
    },
    salaryOperator: {
      type: String,
      default: "",
    },
    destinationNumber: {
      type: String,
      default: "",
    },
    destinationOperator: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: "",
    },
    remark: {
      type: String,
      default: "",
    },
    initiatedBy: {
      type: actorSchema,
      default: {},
    },
    firstApproval: {
      type: approvalSchema,
      default: {},
    },
    secondApproval: {
      type: approvalSchema,
      default: {},
    },
    gatewayProvider: {
      type: String,
      default: "",
    },
    gatewayReference: {
      type: String,
      default: "",
      index: true,
    },
    gatewayStatus: {
      type: String,
      default: "",
    },
    gatewayMessage: {
      type: String,
      default: "",
    },
    history: {
      type: [historySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FundRequest", fundRequestSchema);
