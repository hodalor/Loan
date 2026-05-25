require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const connectDB = require("../src/config/db");
const User = require("../src/app/models/users");
const Loans = require("../src/app/models/loans");
const SystemConfig = require("../src/app/models/systemConfig");
const {
  isSupabaseStorageEnabled,
  uploadLocalFilePathToSupabase,
} = require("../src/libs/mediaStorage");

const args = process.argv.slice(2);
const shouldApply = args.includes("--apply");
const limitArg = args.find((item) => item.startsWith("--limit="));
const perCollectionLimit = limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : 0;
const uploadDir = path.resolve(__dirname, "../upload");
const uploadUrlPattern = /\/upload\/([^?#]+)/i;
const cache = new Map();

const summary = {
  scanned: 0,
  eligible: 0,
  migrated: 0,
  missingFiles: 0,
  failed: 0,
  updatedDocuments: 0,
};

const toIterable = (value) => (Array.isArray(value) ? value : []);
const isLocalUploadUrl = (value = "") =>
  typeof value === "string" && uploadUrlPattern.test(String(value).trim());
const getMimeTypeFromFilename = (filename = "") => {
  const extension = path.extname(filename).toLowerCase();
  const mimeTypeMap = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".heic": "image/heic",
    ".heif": "image/heif",
  };

  return mimeTypeMap[extension] || "application/octet-stream";
};
const extractUploadFilename = (value = "") => {
  const match = String(value || "").match(uploadUrlPattern);
  return match ? decodeURIComponent(match[1]) : "";
};
const buildLocalFilePath = (value = "") => {
  const filename = extractUploadFilename(value);
  if (!filename) return "";
  return path.join(uploadDir, filename);
};

const migrateMediaField = async ({
  currentValue,
  folder,
  docLabel,
  fieldLabel,
}) => {
  summary.scanned += 1;

  if (!isLocalUploadUrl(currentValue)) {
    return { changed: false, value: currentValue };
  }

  summary.eligible += 1;
  const localFilePath = buildLocalFilePath(currentValue);
  const filename = path.basename(localFilePath || "");

  if (!localFilePath || !fs.existsSync(localFilePath)) {
    summary.missingFiles += 1;
    console.warn(`[missing] ${docLabel} -> ${fieldLabel}: ${currentValue}`);
    return { changed: false, value: currentValue };
  }

  if (!shouldApply) {
    console.log(`[dry-run] ${docLabel} -> ${fieldLabel}: ${currentValue}`);
    return { changed: false, value: currentValue };
  }

  const cacheKey = `${folder}::${localFilePath}`;
  if (cache.has(cacheKey)) {
    return { changed: true, value: cache.get(cacheKey) };
  }

  try {
    const uploadedUrl = await uploadLocalFilePathToSupabase({
      filePath: localFilePath,
      originalName: filename,
      mimetype: getMimeTypeFromFilename(filename),
      folder,
    });

    if (!uploadedUrl) {
      summary.failed += 1;
      console.warn(`[failed] ${docLabel} -> ${fieldLabel}: no cloud URL returned`);
      return { changed: false, value: currentValue };
    }

    cache.set(cacheKey, uploadedUrl);
    summary.migrated += 1;
    console.log(`[migrated] ${docLabel} -> ${fieldLabel}: ${uploadedUrl}`);
    return { changed: true, value: uploadedUrl };
  } catch (error) {
    summary.failed += 1;
    console.error(`[failed] ${docLabel} -> ${fieldLabel}: ${error.message || error}`);
    return { changed: false, value: currentValue };
  }
};

const migrateUserDocument = async (user) => {
  const updates = {};
  const userLabel = `User(${user.userId || user._id})`;

  const selfieResult = await migrateMediaField({
    currentValue: user.userImage,
    folder: "identity/selfie",
    docLabel: userLabel,
    fieldLabel: "userImage",
  });
  if (selfieResult.changed) {
    updates.userImage = selfieResult.value;
  }

  const idFrontResult = await migrateMediaField({
    currentValue: user.IDinfo?.idFront,
    folder: "identity/front",
    docLabel: userLabel,
    fieldLabel: "IDinfo.idFront",
  });
  if (idFrontResult.changed && user.IDinfo) {
    updates["IDinfo.idFront"] = idFrontResult.value;
  }

  const idBackResult = await migrateMediaField({
    currentValue: user.IDinfo?.idBack,
    folder: "identity/back",
    docLabel: userLabel,
    fieldLabel: "IDinfo.idBack",
  });
  if (idBackResult.changed && user.IDinfo) {
    updates["IDinfo.idBack"] = idBackResult.value;
  }

  for (const [loanIndex, loan] of toIterable(user.loan?.loans).entries()) {
    for (const [extIndex, record] of toIterable(loan.extRecords).entries()) {
      const result = await migrateMediaField({
        currentValue: record?.proofUrl,
        folder: "loan-extension/proof",
        docLabel: `${userLabel} loan[${loanIndex}]`,
        fieldLabel: `extRecords[${extIndex}].proofUrl`,
      });
      if (result.changed) {
        updates[`loan.loans.${loanIndex}.extRecords.${extIndex}.proofUrl`] = result.value;
      }
    }

    for (const [paymentIndex, record] of toIterable(loan.paymentRecords).entries()) {
      const auditResult = await migrateMediaField({
        currentValue: record?.recordProofAudit,
        folder: "loan-clearance/audit",
        docLabel: `${userLabel} loan[${loanIndex}]`,
        fieldLabel: `paymentRecords[${paymentIndex}].recordProofAudit`,
      });
      if (auditResult.changed) {
        updates[`loan.loans.${loanIndex}.paymentRecords.${paymentIndex}.recordProofAudit`] =
          auditResult.value;
      }

      const confirmResult = await migrateMediaField({
        currentValue: record?.recordProofConfirm,
        folder: "loan-clearance/confirm",
        docLabel: `${userLabel} loan[${loanIndex}]`,
        fieldLabel: `paymentRecords[${paymentIndex}].recordProofConfirm`,
      });
      if (confirmResult.changed) {
        updates[`loan.loans.${loanIndex}.paymentRecords.${paymentIndex}.recordProofConfirm`] =
          confirmResult.value;
      }
    }
  }

  if (Object.keys(updates).length > 0 && shouldApply) {
    await User.updateOne({ _id: user._id }, { $set: updates });
    summary.updatedDocuments += 1;
  }
};

const migrateLoanDocument = async (loan) => {
  const updates = {};
  const loanLabel = `Loan(${loan.ID || loan._id})`;

  for (const [extIndex, record] of toIterable(loan.extRecords).entries()) {
    const result = await migrateMediaField({
      currentValue: record?.proofUrl,
      folder: "loan-extension/proof",
      docLabel: loanLabel,
      fieldLabel: `extRecords[${extIndex}].proofUrl`,
    });
    if (result.changed) {
      updates[`extRecords.${extIndex}.proofUrl`] = result.value;
    }
  }

  const auditResult = await migrateMediaField({
    currentValue: loan.clearanceRecord?.recordProofAudit,
    folder: "loan-clearance/audit",
    docLabel: loanLabel,
    fieldLabel: "clearanceRecord.recordProofAudit",
  });
  if (auditResult.changed && loan.clearanceRecord) {
    updates["clearanceRecord.recordProofAudit"] = auditResult.value;
  }

  const confirmResult = await migrateMediaField({
    currentValue: loan.clearanceRecord?.recordProofConfirm,
    folder: "loan-clearance/confirm",
    docLabel: loanLabel,
    fieldLabel: "clearanceRecord.recordProofConfirm",
  });
  if (confirmResult.changed && loan.clearanceRecord) {
    updates["clearanceRecord.recordProofConfirm"] = confirmResult.value;
  }

  if (Object.keys(updates).length > 0 && shouldApply) {
    await Loans.updateOne({ _id: loan._id }, { $set: updates });
    summary.updatedDocuments += 1;
  }
};

const migrateSystemConfigDocument = async (configDoc) => {
  const updates = {};
  const result = await migrateMediaField({
    currentValue: configDoc.portalContent?.logoUrl,
    folder: "portal/logo",
    docLabel: `SystemConfig(${configDoc._id})`,
    fieldLabel: "portalContent.logoUrl",
  });

  if (result.changed && configDoc.portalContent && shouldApply) {
    updates["portalContent.logoUrl"] = result.value;
  }

  if (Object.keys(updates).length > 0 && shouldApply) {
    await SystemConfig.updateOne({ _id: configDoc._id }, { $set: updates });
    summary.updatedDocuments += 1;
  }
};

const withLimit = (query) =>
  perCollectionLimit > 0 ? query.limit(perCollectionLimit) : query;

async function runMigration() {
  if (!isSupabaseStorageEnabled()) {
    throw new Error("Supabase storage is not configured. Set backend Supabase env values first.");
  }

  if (!fs.existsSync(uploadDir)) {
    throw new Error(`Upload directory not found: ${uploadDir}`);
  }

  await connectDB();

  console.log(
    shouldApply
      ? "Running APPLY migration from local /upload files to Supabase."
      : "Running DRY RUN migration from local /upload files to Supabase."
  );
  if (perCollectionLimit > 0) {
    console.log(`Per-collection limit: ${perCollectionLimit}`);
  }

  const users = await withLimit(User.find());
  for (const user of users) {
    await migrateUserDocument(user);
  }

  const loans = await withLimit(Loans.find());
  for (const loan of loans) {
    await migrateLoanDocument(loan);
  }

  const configs = await withLimit(SystemConfig.find());
  for (const configDoc of configs) {
    await migrateSystemConfigDocument(configDoc);
  }

  console.log("Migration summary:", summary);
}

runMigration()
  .then(async () => {
    await mongoose.connection.close();
  })
  .catch(async (error) => {
    console.error("Media migration failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  });
