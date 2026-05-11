const mongoose = require("mongoose");

const staffGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    createdBy: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    updatedBy: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

staffGroupSchema.index({ department: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("StaffGroup", staffGroupSchema);
