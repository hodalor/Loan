import { apiBaseUrl } from "./endpoints";

const IMAGE_LIKE_PATTERN = /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i;
const UPLOAD_URL_PATTERN = /\/upload\/([^?#]+)/i;

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

export const isLegacyMediaUrl = (value = "") => {
  const normalized = normalizeValue(value);
  if (!normalized) return false;

  return UPLOAD_URL_PATTERN.test(normalized);
};
