const mongoose = require("mongoose");

const customerAccessSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    pin: {
      type: String,
      required: false,
    },
    userId: {
      type: String,
      required: false,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    isPinSet: {
      type: Boolean,
      default: false,
    },
    draftApplication: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
      default: null,
    },
    countryCode: {
      type: String,
      required: false,
      default: "",
    },
    countryName: {
      type: String,
      required: false,
      default: "",
    },
    countryDialCode: {
      type: String,
      required: false,
      default: "",
    },
    locale: {
      type: String,
      required: false,
      default: "",
    },
    currencyCode: {
      type: String,
      required: false,
      default: "",
    },
    currencySymbol: {
      type: String,
      required: false,
      default: "",
    },
    lastLoginAt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomerAccess", customerAccessSchema);
