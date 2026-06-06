import express from "express";
import { imageUpload } from "../middleware/upload.js";
import { readCollection, updateCollection } from "../storage.js";
import { asyncHandler, httpError } from "../utils/errors.js";
import { createId, nowIso } from "../utils/security.js";
import { cleanArray, cleanString, profileCompletion } from "../utils/validators.js";
import { logActivity } from "../utils/activity.js";

const router = express.Router();

function normalizeProfile(body, user) {
  return {
    fullName: cleanString(body.fullName || user.fullName, 120),
    email: user.email,
    phone: cleanString(body.phone, 30),
    address: cleanString(body.address, 240),
    bio: cleanString(body.bio, 1200),
    socialLinks: cleanArray(body.socialLinks, 8),
    skills: cleanArray(body.skills),
    strengths: cleanArray(body.strengths),
    expertise: cleanArray(body.expertise),
    interests: cleanArray(body.interests),
    knowledgeAreas: cleanArray(body.knowledgeAreas),
    customSections: Array.isArray(body.customSections)
      ? body.customSections
          .map((section) => ({
            id: section.id || createId(),
            title: cleanString(section.title, 80),
            body: cleanString(section.body, 600)
          }))
          .filter((section) => section.title || section.body)
          .slice(0, 12)
      : []
  };
}

async function getProfile(user) {
  const profiles = await readCollection("profiles");
  const profile = profiles.find((item) => item.userId === user.id);
  return {
    ...(profile || {
      id: createId(),
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: "",
      address: "",
      bio: "",
      avatarUrl: "",
      socialLinks: [],
      skills: [],
      strengths: [],
      expertise: [],
      interests: [],
      knowledgeAreas: [],
      customSections: []
    }),
    completion: profileCompletion({ ...profile, fullName: user.fullName, email: user.email })
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await getProfile(req.user));
  })
);

router.put(
  "/",
  asyncHandler(async (req, res) => {
    const now = nowIso();
    const profile = await updateCollection("profiles", (profiles) => {
      let current = profiles.find((item) => item.userId === req.user.id);
      if (!current) {
        current = {
          id: createId(),
          userId: req.user.id,
          avatarUrl: "",
          createdAt: now
        };
        profiles.push(current);
      }

      Object.assign(current, normalizeProfile(req.body, req.user), { updatedAt: now });
      return { returnValue: current };
    });

    await updateCollection("users", (users) => {
      const current = users.find((item) => item.id === req.user.id);
      if (current) {
        current.fullName = profile.fullName;
        current.updatedAt = now;
      }
      return { returnValue: current };
    });

    await logActivity(req.user.id, "profile_updated");
    res.json({ ...profile, completion: profileCompletion(profile) });
  })
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const now = nowIso();
    const profile = await updateCollection("profiles", (profiles) => {
      const current = profiles.find((item) => item.userId === req.user.id);
      if (!current) throw httpError(404, "Profile not found.");

      Object.assign(current, {
        phone: "",
        address: "",
        bio: "",
        avatarUrl: "",
        socialLinks: [],
        skills: [],
        strengths: [],
        expertise: [],
        interests: [],
        knowledgeAreas: [],
        customSections: [],
        updatedAt: now
      });
      return { returnValue: current };
    });

    await logActivity(req.user.id, "profile_cleared");
    res.json({ ...profile, completion: profileCompletion(profile) });
  })
);

router.post(
  "/avatar",
  imageUpload.single("avatar"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw httpError(400, "Upload a profile picture.");

    const now = nowIso();
    const avatarUrl = `/uploads/${req.file.filename}`;
    const profile = await updateCollection("profiles", (profiles) => {
      let current = profiles.find((item) => item.userId === req.user.id);
      if (!current) {
        current = {
          id: createId(),
          userId: req.user.id,
          fullName: req.user.fullName,
          email: req.user.email,
          createdAt: now
        };
        profiles.push(current);
      }
      current.avatarUrl = avatarUrl;
      current.updatedAt = now;
      return { returnValue: current };
    });

    await logActivity(req.user.id, "avatar_uploaded", { filename: req.file.originalname });
    res.status(201).json({ ...profile, completion: profileCompletion(profile) });
  })
);

export default router;
