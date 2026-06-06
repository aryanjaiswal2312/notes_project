import express from "express";
import { updateCollection } from "../storage.js";
import { asyncHandler, httpError } from "../utils/errors.js";
import { createId, nowIso } from "../utils/security.js";
import { cleanString, requireFields } from "../utils/validators.js";
import { logActivity } from "../utils/activity.js";

const router = express.Router();

function cleanSection(body) {
  return {
    title: cleanString(body.title, 120),
    purpose: cleanString(body.purpose, 240),
    description: cleanString(body.description, 1200)
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const includeArchived = req.query.includeArchived === "true";
    const sections = await updateCollection("sections", (items) => ({
      returnValue: items
        .filter((item) => item.userId === req.user.id)
        .filter((item) => includeArchived || !item.archived)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    }));
    res.json(sections);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    requireFields(req.body, ["title"]);
    const now = nowIso();
    const section = await updateCollection("sections", (sections) => {
      const next = {
        id: createId(),
        userId: req.user.id,
        ...cleanSection(req.body),
        archived: false,
        createdAt: now,
        updatedAt: now
      };
      sections.push(next);
      return { returnValue: next };
    });

    await logActivity(req.user.id, "section_created", { sectionId: section.id });
    res.status(201).json(section);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const now = nowIso();
    const section = await updateCollection("sections", (sections) => {
      const current = sections.find((item) => item.id === req.params.id && item.userId === req.user.id);
      if (!current) throw httpError(404, "Section not found.");

      Object.assign(current, cleanSection(req.body), { updatedAt: now });
      return { returnValue: current };
    });

    await logActivity(req.user.id, "section_updated", { sectionId: section.id });
    res.json(section);
  })
);

router.patch(
  "/:id/archive",
  asyncHandler(async (req, res) => {
    const section = await updateCollection("sections", (sections) => {
      const current = sections.find((item) => item.id === req.params.id && item.userId === req.user.id);
      if (!current) throw httpError(404, "Section not found.");

      current.archived = req.body.archived !== false;
      current.updatedAt = nowIso();
      return { returnValue: current };
    });

    await logActivity(req.user.id, section.archived ? "section_archived" : "section_restored", { sectionId: section.id });
    res.json(section);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await updateCollection("sections", (sections) => {
      const index = sections.findIndex((item) => item.id === req.params.id && item.userId === req.user.id);
      if (index < 0) throw httpError(404, "Section not found.");
      sections.splice(index, 1);
      return { returnValue: true };
    });

    await updateCollection("notes", (notes) => {
      notes.forEach((note) => {
        if (note.userId === req.user.id && note.sectionId === req.params.id) note.sectionId = "";
      });
      return { returnValue: true };
    });

    await logActivity(req.user.id, "section_deleted", { sectionId: req.params.id });
    res.json({ ok: true });
  })
);

export default router;
