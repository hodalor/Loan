const { Schema, model } = require("mongoose");

const actorSchema = new Schema(
  {
    userId: {
      type: String,
      required: false,
    },
    userName: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

const systemLogSchema = new Schema(
  {
    level: {
      type: String,
      default: "info",
      index: true,
    },
    category: {
      type: String,
      default: "audit",
      index: true,
    },
    source: {
      type: String,
      default: "",
      index: true,
    },
    action: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "success",
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    actor: {
      type: actorSchema,
      default: {},
    },
    requestPath: {
      type: String,
      default: "",
    },
    requestMethod: {
      type: String,
      default: "",
    },
    origin: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
    },
    details: {
      type: Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("SystemLogs", systemLogSchema);
