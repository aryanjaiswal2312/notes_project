import express from "express";
import { updateCollection } from "../storage.js";
import { asyncHandler } from "../utils/errors.js";
import { nowIso } from "../utils/security.js";

const router = express.Router();

function normalizeSettings(body) {
  return {
    theme: body.theme === "dark" ? "dark" : "light",
    compactMode: Boolean(body.compactMode),
    notifications: body.notifications !== false
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const settings = await updateCollection("settings", (data) => {
      let current = data.users.find((item) => item.userId === req.user.id);
      if (!current) {
        current = {
          userId: req.user.id,
          theme: "light",
          compactMode: false,
          notifications: true,
          updatedAt: nowIso()
        };
        data.users.push(current);
      }
      return { returnValue: current };
    });

    res.json(settings);
  })
);

router.put(
  "/",
  asyncHandler(async (req, res) => {
    const next = normalizeSettings(req.body);
    const settings = await updateCollection("settings", (data) => {
      let current = data.users.find((item) => item.userId === req.user.id);
      if (!current) {
        current = { userId: req.user.id };
        data.users.push(current);
      }
      Object.assign(current, next, { updatedAt: nowIso() });
      return { returnValue: current };
    });

    res.json(settings);
  })
);

export default router;
