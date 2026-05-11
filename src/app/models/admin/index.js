const mongoose = require("mongoose");

const userLogSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: Boolean,
    required: true,
  },
});

const casesSchema = new mongoose.Schema(
  {
    loanId: {
      type: String,
      required: true,
    },
    isProcessed: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

const adminSchema = new mongoose.Schema(
  {
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
    userName: {
      type: String,
      required: true,
      unique: false,
    },
    email: {
      type: String,
      required: true,
      unique: false,
    },
    phone: {
      type: String,
      required: true,
      unique: false,
    },
    password: {
      type: String,
      required: true,
      unique: false,
    },
    gender: {
      type: String,
      required: true,
      unique: false,
    },
    userId: {
      type: String,
      required: true,
      unique: false,
    },
    role: {
      type: String,
      required: true,
      unique: false,
    },
    department: {
      type: String,
      required: true,
      unique: false,
    },
    staffGroupId: {
      type: String,
      required: false,
      default: "",
      index: true,
    },
    staffGroupName: {
      type: String,
      required: false,
      default: "",
    },
    isActive: {
      type: Boolean,
      required: true,
      unique: false,
    },
    isOnline: {
      type: Boolean,
      required: true,
      unique: false,
    },
    logData: {
      type: [userLogSchema],
      required: false,
    },
    casesAssigned: {
      type: [casesSchema],
      required: false,
    },
    permissions: {
      type: [String],
      required: false,
      default: [],
    },
  },
  { timestamps: true }
);

adminSchema.index({ userId: 1 });
adminSchema.index({ userName: 1 });
adminSchema.index({ role: 1, createdAt: -1 });
adminSchema.index({ department: 1, createdAt: -1 });
adminSchema.index({ isActive: 1 });

module.exports = mongoose.model("Admin", adminSchema);
