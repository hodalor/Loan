const mongoose = require("mongoose");

const gatewayTransactionSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      default: "paystack",
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    transactionType: {
      type: String,
      required: true,
      enum: ["repayment", "extension"],
    },
    status: {
      type: String,
      default: "pending",
      index: true,
    },
    processed: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    loanId: {
      type: String,
      required: true,
      index: true,
    },
    methodKey: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "GHS",
    },
    checkoutUrl: {
      type: String,
      default: "",
    },
    context: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    rawInitializeResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    rawVerifyResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    rawWebhookEvent: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GatewayTransactions", gatewayTransactionSchema);
