const myLogger = require("simple-node-logger").createSimpleFileLogger("project.log");
const SystemLog = require("../app/models/systemLog");

const normalizeLevel = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();

  if (["trace", "debug", "info", "warn", "error", "fatal"].includes(normalized)) {
    return normalized;
  }

  return "info";
};

const buildRequestLogContext = (req = {}) => ({
  requestPath: String(req.originalUrl || req.url || "").trim(),
  requestMethod: String(req.method || "").trim(),
  origin: String(req.headers?.origin || req.headers?.referer || "").trim(),
  ipAddress: String(
    req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress || req.ip || ""
  ).trim(),
});

const logger = (payload = {}) => {
  const level = normalizeLevel(payload.level || payload.type);
  const message =
    typeof payload === "string"
      ? payload
      : String(payload.message || payload.stack || payload.name || "System event").trim();

  myLogger.log(level, message);
};

const logSystemEvent = async (payload = {}) => {
  const level = normalizeLevel(payload.level || payload.type);
  const message =
    typeof payload === "string"
      ? payload
      : String(payload.message || payload.stack || payload.name || "System event").trim();
  const reqContext = buildRequestLogContext(payload.req || {});
  const actor = payload.actor || {};

  logger({ level, message });

  try {
    await SystemLog.create({
      level,
      category: String(payload.category || "audit").trim() || "audit",
      source: String(payload.source || "").trim(),
      action: String(payload.action || "").trim(),
      status: String(payload.status || (level === "error" ? "failed" : "success")).trim(),
      message,
      actor: {
        userId: String(actor.userId || "").trim(),
        userName: String(actor.userName || "").trim(),
        role: String(actor.role || "").trim(),
      },
      requestPath: payload.requestPath || reqContext.requestPath,
      requestMethod: payload.requestMethod || reqContext.requestMethod,
      origin: payload.origin || reqContext.origin,
      ipAddress: payload.ipAddress || reqContext.ipAddress,
      details: payload.details ?? null,
      metadata: payload.metadata ?? null,
    });
  } catch (error) {
    myLogger.log("error", `system-log-write-failed: ${error.message}`);
  }
};

module.exports = { logger, logSystemEvent };
