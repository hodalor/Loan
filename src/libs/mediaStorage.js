const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
let RealtimeWebSocket = null;

try {
  RealtimeWebSocket = require("ws");
} catch (error) {
  RealtimeWebSocket = null;
}

let supabaseClient = null;
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 30;
const uploadUrlPattern = /\/upload\/([^?#]+)/i;

const sanitizeSegment = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^-+|-+$/g, "");

const getBackendBaseUrl = (req) => {
  const configuredBaseUrl = String(
    process.env.BACKEND_BASE_URL || process.env.BASE_URL || ""
  ).trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (req?.protocol && typeof req.get === "function") {
    return `${req.protocol}://${req.get("host")}`;
  }

  return "";
};

const deleteTempUploadFile = async (filePath = "") => {
  if (!filePath) return;

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.error("Temporary upload cleanup failed.", {
        message: error?.message || "Unknown cleanup error",
        filePath,
      });
    }
  }
};

const buildLocalFileUrl = (req, file) => {
  if (!file?.filename) return "";
  const baseUrl = getBackendBaseUrl(req);
  return baseUrl ? `${baseUrl}/upload/${file.filename}` : `/upload/${file.filename}`;
};

const getSupabaseConfig = () => ({
  url: String(process.env.SUPABASE_URL || "").trim(),
  serviceRoleKey: String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim(),
  bucket: String(process.env.SUPABASE_STORAGE_BUCKET || "").trim(),
  baseFolder: sanitizeSegment(process.env.SUPABASE_STORAGE_FOLDER || "loan-media"),
});

const isSupabaseStorageEnabled = () => {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.serviceRoleKey && config.bucket);
};

const getSupabaseClient = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const config = getSupabaseConfig();
  if (!config.url || !config.serviceRoleKey) {
    return null;
  }

  const clientOptions = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  };

  if (RealtimeWebSocket) {
    clientOptions.realtime = {
      transport: RealtimeWebSocket,
    };
  }

  supabaseClient = createClient(config.url, config.serviceRoleKey, clientOptions);

  return supabaseClient;
};

const buildObjectPath = (file, folder = "general") => {
  const extension = path.extname(file?.originalname || file?.filename || "").toLowerCase();
  const basename = path.basename(file?.filename || `${Date.now()}${extension}`, extension);
  const safeFolder = sanitizeSegment(folder || "general");
  const config = getSupabaseConfig();

  return `${config.baseFolder}/${safeFolder}/${Date.now()}-${basename}${extension}`;
};

const uploadFileToSupabase = async ({ file, folder = "general" }) => {
  if (!file?.path || !isSupabaseStorageEnabled()) {
    return "";
  }

  const client = getSupabaseClient();
  if (!client) {
    return "";
  }

  const config = getSupabaseConfig();
  const objectPath = buildObjectPath(file, folder);
  const fileBuffer = await fs.promises.readFile(file.path);
  const { error } = await client.storage.from(config.bucket).upload(objectPath, fileBuffer, {
    contentType: file.mimetype || "application/octet-stream",
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = client.storage.from(config.bucket).getPublicUrl(objectPath);
  return data?.publicUrl || "";
};

const uploadBufferToSupabase = async ({
  buffer,
  filename = "",
  originalName = "",
  mimetype = "",
  folder = "general",
}) => {
  if (!buffer || !isSupabaseStorageEnabled()) {
    return "";
  }

  const client = getSupabaseClient();
  if (!client) {
    return "";
  }

  const config = getSupabaseConfig();
  const uploadTarget = {
    filename: filename || `${Date.now()}`,
    originalname: originalName || filename || `${Date.now()}`,
  };
  const objectPath = buildObjectPath(uploadTarget, folder);
  const { error } = await client.storage.from(config.bucket).upload(objectPath, buffer, {
    contentType: mimetype || "application/octet-stream",
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = client.storage.from(config.bucket).getPublicUrl(objectPath);
  return data?.publicUrl || "";
};

const normalizeMediaValue = (value = "") => String(value || "").trim().replace(/\\/g, "/");
const extractUploadFilename = (value = "") => {
  const match = normalizeMediaValue(value).match(uploadUrlPattern);
  return match ? decodeURIComponent(match[1]) : "";
};

const hasImageLikeExtension = (value = "") =>
  /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(String(value || "").trim());

const buildStoredLocalUrl = (req, value = "") => {
  const normalized = normalizeMediaValue(value);
  if (!normalized) return "";
  const uploadFilename = extractUploadFilename(normalized);
  const baseUrl = getBackendBaseUrl(req);

  if (uploadFilename) {
    return baseUrl
      ? `${baseUrl}/upload/${encodeURIComponent(uploadFilename)}`
      : `/upload/${encodeURIComponent(uploadFilename)}`;
  }

  if (normalized.startsWith("/upload/")) {
    return baseUrl ? `${baseUrl}${normalized}` : normalized;
  }

  if (normalized.startsWith("upload/")) {
    return baseUrl ? `${baseUrl}/${normalized}` : `/${normalized}`;
  }

  if (hasImageLikeExtension(normalized) && !normalized.includes("/")) {
    return baseUrl ? `${baseUrl}/upload/${normalized}` : `/upload/${normalized}`;
  }

  return "";
};

const extractSupabaseObjectPath = (value = "") => {
  const normalized = normalizeMediaValue(value);
  const config = getSupabaseConfig();
  if (!normalized || !config.bucket) return "";

  if (normalized.startsWith(`${config.baseFolder}/`)) {
    return normalized;
  }

  if (/^https?:\/\//i.test(normalized)) {
    try {
      const parsed = new URL(normalized);
      const match = parsed.pathname.match(
        /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/i
      );

      if (match && match[1] === config.bucket) {
        return decodeURIComponent(match[2]);
      }
    } catch (error) {
      return "";
    }
  }

  return "";
};

const createSignedSupabaseUrl = async (value = "") => {
  const objectPath = extractSupabaseObjectPath(value);
  if (!objectPath || !isSupabaseStorageEnabled()) {
    return "";
  }

  const client = getSupabaseClient();
  const config = getSupabaseConfig();
  if (!client || !config.bucket) {
    return "";
  }

  const { data, error } = await client.storage
    .from(config.bucket)
    .createSignedUrl(objectPath, SIGNED_URL_TTL_SECONDS);

  if (error) {
    throw error;
  }

  return data?.signedUrl || "";
};

const resolveStoredFileUrl = async (req, value = "") => {
  const normalized = normalizeMediaValue(value);
  if (!normalized) return "";

  const localUrl = buildStoredLocalUrl(req, normalized);
  if (localUrl) {
    return localUrl;
  }

  try {
    const signedUrl = await createSignedSupabaseUrl(normalized);
    if (signedUrl) {
      return signedUrl;
    }
  } catch (error) {
    console.error("Supabase signed URL generation failed, falling back to stored value.", {
      message: error?.message || "Unknown signed URL error",
      value: normalized,
    });
  }

  return /^https?:\/\//i.test(normalized) ? encodeURI(normalized) : normalized;
};

const resolveUserMediaUrls = async (req, user = {}) => {
  const record =
    user && typeof user.toObject === "function" ? user.toObject() : JSON.parse(JSON.stringify(user || {}));

  if (!record || typeof record !== "object") {
    return record;
  }

  record.userImage = await resolveStoredFileUrl(req, record.userImage || "");

  if (record.IDinfo && typeof record.IDinfo === "object") {
    record.IDinfo = {
      ...record.IDinfo,
      idFront: await resolveStoredFileUrl(req, record.IDinfo.idFront || ""),
      idBack: await resolveStoredFileUrl(req, record.IDinfo.idBack || ""),
    };
  }

  if (Array.isArray(record?.loan?.loans)) {
    record.loan = {
      ...record.loan,
      loans: await Promise.all(
        record.loan.loans.map(async (loan) => ({
          ...loan,
          facialRecog: await resolveStoredFileUrl(req, loan?.facialRecog || ""),
        }))
      ),
    };
  }

  return record;
};

const uploadLocalFilePathToSupabase = async ({
  filePath = "",
  originalName = "",
  mimetype = "",
  folder = "general",
}) => {
  if (!filePath || !isSupabaseStorageEnabled()) {
    return "";
  }

  const resolvedPath = path.resolve(filePath);
  const file = {
    path: resolvedPath,
    filename: path.basename(resolvedPath),
    originalname: originalName || path.basename(resolvedPath),
    mimetype,
  };

  return uploadFileToSupabase({ file, folder });
};

const resolveUploadedFileUrl = async (
  req,
  file,
  folder = "general",
  { requireSupabase = false } = {}
) => {
  const localUrl = buildLocalFileUrl(req, file);

  if (!file?.path) {
    return localUrl;
  }

  try {
    if (requireSupabase && !isSupabaseStorageEnabled()) {
      throw new Error("Supabase storage is not configured for persistent uploads.");
    }

    const cloudUrl = await uploadFileToSupabase({ file, folder });

    if (cloudUrl) {
      await deleteTempUploadFile(file.path);
      return cloudUrl;
    }

    if (requireSupabase) {
      throw new Error("Cloud upload completed without returning a stored file URL.");
    }

    return localUrl;
  } catch (error) {
    if (requireSupabase) {
      await deleteTempUploadFile(file.path);
      throw error;
    }

    console.error("Supabase upload failed, falling back to local file URL.", {
      message: error?.message || "Unknown upload error",
      bucket: getSupabaseConfig().bucket,
      filename: file?.filename || "",
      folder,
    });
    return localUrl;
  }
};

module.exports = {
  buildLocalFileUrl,
  isSupabaseStorageEnabled,
  resolveUploadedFileUrl,
  resolveStoredFileUrl,
  resolveUserMediaUrls,
  uploadBufferToSupabase,
  uploadLocalFilePathToSupabase,
};
