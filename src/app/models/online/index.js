const mongoose = require("mongoose");

const onlineSchema = new mongoose.Schema(
  {
    status: {
      type: Boolean,
      required: true,
      unique: false,
    },
    userId: {
      type: String,
      required: true,
      unique: false,
    },
    dateTime: {
      type: Date,
      required: true,
      unique: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Online", onlineSchema);
