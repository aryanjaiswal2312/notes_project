import fs from "node:fs/promises";
import path from "node:path";
import express from "express";
import { uploadsDir } from "../config.js";
import { galleryUpload } from "../middleware/upload.js";
import { readCollection, updateCollection } from "../storage.js";
import { asyncHandler, httpError } from "../utils/errors.js";
import { cleanString } from "../utils/validators.js";
import { createId, nowIso } from "../utils/security.js";
import { logActivity } from "../utils/activity.js";

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const category = cleanString(req.query.category, 80).toLowerCase();
    const files = await readCollection("gallery");
    res.json(
      files
        .filter((file) => file.userId === req.user.id)
        .filter((file) => (!category ? true : String(file.category || "").toLowerCase() === category))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    );
  })
);

router.post(
  "/",
  galleryUpload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw httpError(400, "Select a file to upload.");

    const now = nowIso();
    const item = await updateCollection("gallery", (files) => {
      const next = {
        id: createId(),
        userId: req.user.id,
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        category: cleanString(req.body.category, 80) || "General",
        description: cleanString(req.body.description, 500),
        url: `/uploads/${req.file.filename}`,
        createdAt: now,
        updatedAt: now
      };
      files.push(next);
      return { returnValue: next };
    });

    await logActivity(req.user.id, "file_uploaded", { fileId: item.id, name: item.originalName });
    res.status(201).json(item);
  })
);

router.get(
  "/:id/download",
  asyncHandler(async (req, res) => {
    const files = await readCollection("gallery");
    const item = files.find((file) => file.id === req.params.id && file.userId === req.user.id);
    if (!item) throw httpError(404, "File not found.");

    res.download(path.join(uploadsDir, item.filename), item.originalName);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    let removed = null;
    await updateCollection("gallery", (files) => {
      const index = files.findIndex((file) => file.id === req.params.id && file.userId === req.user.id);
      if (index < 0) throw httpError(404, "File not found.");
      removed = files[index];
      files.splice(index, 1);
      return { returnValue: removed };
    });

    if (removed?.filename) {
      await fs.unlink(path.join(uploadsDir, removed.filename)).catch(() => undefined);
    }

    await logActivity(req.user.id, "file_deleted", { fileId: req.params.id });
    res.json({ ok: true });
  })
);

export default router;
