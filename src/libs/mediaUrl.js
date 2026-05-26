const trimTrailingSlash = (value = "") => String(value || "").replace(/\/+$/, "");
const IMAGE_LIKE_PATTERN = /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i;
const UPLOAD_URL_PATTERN = /\/upload\/([^?#]+)/i;

const isLocalHost = () => {
  if (typeof window === "undefined") return false;

  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
};

const normalizeCustomerApiBase = (value = "") => {
  const trimmed = trimTrailingSlash(value);
  return /\/users$/i.test(trimmed) ? trimmed : `${trimmed}/users`;
};

const configuredCustomerApiBase =
  process.env.REACT_APP_CUSTOMER_AUTH_BASEURL ||
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_BASE_URL;

const customerApiBase = normalizeCustomerApiBase(
  configuredCustomerApiBase ||
    (isLocalHost() ? "http://localhost:9000/users" : "https://loan-htqt.onrender.com/users")
);

const apiBaseUrl = trimTrailingSlash(customerApiBase.replace(/\/users$/i, ""));

const normalizeValue = (value = "") => String(value || "").trim().replace(/\\/g, "/");
const extractUploadFilename = (value = "") => {
  const match = normalizeValue(value).match(UPLOAD_URL_PATTERN);
  return match ? decodeURIComponent(match[1]) : "";
};

const buildLocalUploadUrl = (value = "") => {
  const normalized = normalizeValue(value);
  if (!normalized) return "";
  const uploadFilename = extractUploadFilename(normalized);

  if (uploadFilename) {
    return `${apiBaseUrl}/upload/${encodeURIComponent(uploadFilename)}`;
  }

  if (normalized.startsWith("/upload/")) {
    return `${apiBaseUrl}${normalized}`;
  }

  if (normalized.startsWith("upload/")) {
    return `${apiBaseUrl}/${normalized}`;
  }

  if (IMAGE_LIKE_PATTERN.test(normalized) && !normalized.includes("/")) {
    return `${apiBaseUrl}/upload/${normalized}`;
  }

  return "";
};

export const resolveMediaUrl = (value = "") => {
  const normalized = normalizeValue(value);
  if (!normalized) return "";

  if (/^(data:|blob:)/i.test(normalized)) {
    return normalized;
  }

  const localUrl = buildLocalUploadUrl(normalized);
  if (localUrl) {
    return encodeURI(localUrl);
  }

  if (/^https?:\/\//i.test(normalized)) {
    return encodeURI(normalized);
  }

  return normalized;
};
