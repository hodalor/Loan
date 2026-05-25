const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

let supabaseClient = null;

const sanitizeSegment = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^-+|-+$/g, "");

const getBackendBaseUrl = (req) =>
  String(process.env.BACKEND_BASE_URL || process.env.BASE_URL || "").trim() ||
  `${req.protocol}://${req.get("host")}`;

const buildLocalFileUrl = (req, file) => {
  if (!file?.filename) return "";
  return `${getBackendBaseUrl(req)}/upload/${file.filename}`;
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

  supabaseClient = createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

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

const resolveUploadedFileUrl = async (req, file, folder = "general") => {
  const localUrl = buildLocalFileUrl(req, file);

  if (!file?.path) {
    return localUrl;
  }

  try {
    const cloudUrl = await uploadFileToSupabase({ file, folder });
    return cloudUrl || localUrl;
  } catch (error) {
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
  uploadLocalFilePathToSupabase,
};
