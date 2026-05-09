const multer = require("multer");
const fs = require("fs");

const uuid = require("./uuid");

const DIR = "upload/";

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpg",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(DIR, { recursive: true });
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(" ").join("-");
    cb(null, uuid() + "-" + fileName);
  },
});

var upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(
        new Error("Only PNG, JPG, JPEG, WEBP, HEIC and HEIF image formats are allowed.")
      );
    }
  },
});

module.exports = { upload };
