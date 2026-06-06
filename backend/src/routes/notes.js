import express from "express";
import { updateCollection } from "../storage.js";
import { asyncHandler, httpError } from "../utils/errors.js";
import { createId, nowIso } from "../utils/security.js";
import { cleanArray, cleanString, requireFields } from "../utils/validators.js";
import { logActivity } from "../utils/activity.js";

const router = express.Router();

function cleanHtml(html) {
  return String(html || "")
    .slice(0, 50000)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

function normalizeNote(body) {
  return {
    title: cleanString(body.title, 160),
    content: cleanHtml(body.content),
    sectionId: cleanString(body.sectionId, 80),
    category: cleanString(body.category, 80),
    tags: cleanArray(body.tags, 12),
    pinned: Boolean(body.pinned)
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = cleanString(req.query.search, 120).toLowerCase();
    const sectionId = cleanString(req.query.sectionId, 80);
    const category = cleanString(req.query.category, 80).toLowerCase();

    const notes = await updateCollection("notes", (items) => {
      const result = items
        .filter((item) => item.userId === req.user.id)
        .filter((item) => (!sectionId ? true : item.sectionId === sectionId))
        .filter((item) => (!category ? true : String(item.category || "").toLowerCase() === category))
        .filter((item) => {
          if (!search) return true;
          return `${item.title} ${item.category} ${item.tags?.join(" ")} ${item.content}`.toLowerCase().includes(search);
        })
        .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || new Date(b.updatedAt) - new Date(a.updatedAt));

      return { returnValue: result };
    });

    res.json(notes);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    requireFields(req.body, ["title"]);
    const now = nowIso();
    const note = await updateCollection("notes", (notes) => {
      const next = {
        id: createId(),
        userId: req.user.id,
        ...normalizeNote(req.body),
        createdAt: now,
        updatedAt: now
      };
      notes.push(next);
      return { returnValue: next };
    });

    await logActivity(req.user.id, "note_created", { noteId: note.id });
    res.status(201).json(note);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const note = await updateCollection("notes", (notes) => {
      const current = notes.find((item) => item.id === req.params.id && item.userId === req.user.id);
      if (!current) throw httpError(404, "Note not found.");

      Object.assign(current, normalizeNote(req.body), { updatedAt: nowIso() });
      return { returnValue: current };
    });

    await logActivity(req.user.id, "note_updated", { noteId: note.id });
    res.json(note);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await updateCollection("notes", (notes) => {
      const index = notes.findIndex((item) => item.id === req.params.id && item.userId === req.user.id);
      if (index < 0) throw httpError(404, "Note not found.");
      notes.splice(index, 1);
      return { returnValue: true };
    });

    await logActivity(req.user.id, "note_deleted", { noteId: req.params.id });
    res.json({ ok: true });
  })
);

export default router;
