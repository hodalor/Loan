const { logSystemEvent } = require("./logger");

const toText = (value = "") => String(value || "").trim();

const buildAuditActor = (value = {}) => ({
  userId: toText(value?.userId),
  userName: toText(value?.userName),
  role: toText(value?.role),
});

const getAuditActorFromRequest = (req = {}, fallback = {}) => {
  const bodyActor = buildAuditActor(req?.body?.auditActor || req?.body?.actor || {});
  const multipartActor = buildAuditActor({
    userId: req?.body?.auditActorUserId,
    userName: req?.body?.auditActorUserName,
    role: req?.body?.auditActorRole,
  });
  const fallbackActor = buildAuditActor(fallback);

  return {
    userId: bodyActor.userId || multipartActor.userId || fallbackActor.userId,
    userName: bodyActor.userName || multipartActor.userName || fallbackActor.userName,
    role: bodyActor.role || multipartActor.role || fallbackActor.role,
  };
};

const summarizeAdmin = (admin = {}) => ({
  id: toText(admin?._id),
  userId: toText(admin?.userId),
  userName: toText(admin?.userName),
  firstName: toText(admin?.firstName),
  lastName: toText(admin?.lastName),
  role: toText(admin?.role),
  department: toText(admin?.department),
  staffGroupId: toText(admin?.staffGroupId),
  staffGroupName: toText(admin?.staffGroupName),
  isActive: Boolean(admin?.isActive),
});

const summarizeCustomer = (customer = {}) => ({
  id: toText(customer?._id),
  userId: toText(customer?.userId),
  phone: toText(customer?.phone),
  firstName: toText(customer?.IDinfo?.firstName),
  lastName: toText(customer?.IDinfo?.lastName),
  isActive: Boolean(customer?.isActive),
  isVerified: Boolean(customer?.isVerified),
  isRegistered: Boolean(customer?.isRegistered),
  level: Number(customer?.level || 0),
});

const summarizeStaffGroup = (group = {}) => ({
  id: toText(group?._id),
  name: toText(group?.name),
  department: toText(group?.department),
  description: toText(group?.description),
});

const summarizeSystemConfig = (config = {}) => ({
  appName: toText(config?.portalContent?.appName),
  activeCountryCode: toText(config?.activeCountryCode),
  collectionGateway: toText(config?.collectionGateway),
  disbursementGateway: toText(config?.disbursementGateway),
  disbursementMode: toText(config?.disbursementMode),
  implementedChannels: Array.isArray(config?.implementedChannels)
    ? config.implementedChannels.map((item) => toText(item)).filter(Boolean)
    : [],
  allowPartialRepayment: Boolean(config?.allowPartialRepayment),
  autoRepaymentPosting: Boolean(config?.autoRepaymentPosting),
  requireGatewayApprovalCheck: Boolean(config?.requireGatewayApprovalCheck),
});

const listChangedFields = (before = {}, after = {}, fields = []) =>
  fields.filter(
    (field) => JSON.stringify(before?.[field] ?? null) !== JSON.stringify(after?.[field] ?? null)
  );

const logAuditEvent = async (payload = {}) =>
  logSystemEvent({
    level: payload.level || "info",
    category: payload.category || "audit",
    source: payload.source || "system.audit",
    action: payload.action || "",
    status: payload.status || "success",
    message: payload.message || "Audit event recorded.",
    req: payload.req,
    actor: buildAuditActor(payload.actor),
    details: payload.details ?? null,
    metadata: payload.metadata ?? null,
  });

module.exports = {
  buildAuditActor,
  getAuditActorFromRequest,
  summarizeAdmin,
  summarizeCustomer,
  summarizeStaffGroup,
  summarizeSystemConfig,
  listChangedFields,
  logAuditEvent,
};
