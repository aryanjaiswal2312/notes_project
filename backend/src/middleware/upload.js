import path from "node:path";
import multer from "multer";
import { uploadLimits, uploadsDir } from "../config.js";
import { createId } from "../utils/security.js";

const safeName = (name) => path.basename(name).replace(/[^\w.\-]+/g, "_").slice(-120);

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${createId()}-${safeName(file.originalname)}`);
  }
});

const allowedGalleryTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/octet-stream"
]);

const allowedGalleryExtensions = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".zip"
]);

function fileFilter(_req, file, cb) {
  const extension = path.extname(file.originalname || "").toLowerCase();
  if (allowedGalleryTypes.has(file.mimetype) || allowedGalleryExtensions.has(extension)) return cb(null, true);
  cb(new Error("Unsupported file type. Upload images, PDFs, spreadsheets, slides, Word files, ZIPs, text files, or common study documents."));
}

function imageFilter(_req, file, cb) {
  if (file.mimetype.startsWith("image/")) return cb(null, true);
  cb(new Error("Profile picture must be an image."));
}

export const galleryUpload = multer({ storage, limits: uploadLimits, fileFilter });
export const imageUpload = multer({ storage, limits: uploadLimits, fileFilter: imageFilter });
