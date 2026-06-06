import express from "express";
import { SESSION_COOKIE, SESSION_DAYS } from "../config.js";
import { readCollection, updateCollection } from "../storage.js";
import { asyncHandler, httpError } from "../utils/errors.js";
import {
  addDays,
  createId,
  createSessionToken,
  hashPassword,
  hashToken,
  nowIso,
  sanitizeUser,
  verifyPassword
} from "../utils/security.js";
import { isEmail, isStrongPassword, normalizeEmail, profileCompletion, requireFields } from "../utils/validators.js";
import { logActivity } from "../utils/activity.js";

const router = express.Router();

function setSessionCookie(res, token, expiresAt) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    expires: new Date(expiresAt),
    path: "/"
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { sameSite: "lax", secure: false, path: "/" });
}

async function createSessionForUser(req, user) {
  const token = createSessionToken();
  const createdAt = nowIso();
  const expiresAt = addDays(new Date(), SESSION_DAYS).toISOString();

  await updateCollection("sessions", (sessions) => {
    sessions.push({
      id: createId(),
      userId: user.id,
      tokenHash: hashToken(token),
      userAgent: req.get("user-agent") || "unknown",
      ip: req.ip,
      createdAt,
      lastSeenAt: createdAt,
      expiresAt
    });
    return { returnValue: { token, expiresAt } };
  });

  return { token, expiresAt };
}

async function currentPayload(user) {
  const [profiles, settings] = await Promise.all([readCollection("profiles"), readCollection("settings")]);
  const profile = profiles.find((item) => item.userId === user.id) || {};
  const userSettings = settings.users.find((item) => item.userId === user.id) || {};
  return {
    user: sanitizeUser(user),
    profile: {
      ...profile,
      completion: profileCompletion({ ...profile, email: user.email, fullName: user.fullName })
    },
    settings: userSettings
  };
}

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    requireFields(req.body, ["fullName", "email", "password", "confirmPassword", "role"]);
    const email = normalizeEmail(req.body.email);
    const role = req.body.role === "admin" ? "admin" : "user";

    if (!isEmail(email)) throw httpError(400, "Enter a valid email address.");
    if (!isStrongPassword(req.body.password)) throw httpError(400, "Password must be at least 8 characters and include letters and numbers.");
    if (req.body.password !== req.body.confirmPassword) throw httpError(400, "Passwords do not match.");

    const now = nowIso();
    const user = await updateCollection("users", (users) => {
      if (users.some((item) => item.email === email)) throw httpError(409, "An account already exists with this email.");

      const nextUser = {
        id: createId(),
        fullName: String(req.body.fullName).trim(),
        email,
        role,
        status: "active",
        passwordHash: hashPassword(req.body.password),
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now
      };

      users.push(nextUser);
      return { returnValue: nextUser };
    });

    await Promise.all([
      updateCollection("profiles", (profiles) => {
        profiles.push({
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
          customSections: [],
          createdAt: now,
          updatedAt: now
        });
        return { returnValue: true };
      }),
      updateCollection("settings", (settings) => {
        settings.users.push({
          userId: user.id,
          theme: "light",
          compactMode: false,
          notifications: true,
          updatedAt: now
        });
        return { returnValue: true };
      })
    ]);

    const session = await createSessionForUser(req, user);
    setSessionCookie(res, session.token, session.expiresAt);
    await logActivity(user.id, "signup", { role });
    await logActivity(user.id, "login", { method: "signup" });

    res.status(201).json(await currentPayload(user));
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    requireFields(req.body, ["email", "password"]);
    const email = normalizeEmail(req.body.email);
    const users = await readCollection("users");
    const user = users.find((item) => item.email === email);

    if (!user || !verifyPassword(req.body.password, user.passwordHash)) throw httpError(401, "Invalid email or password.");
    if (user.status === "disabled") throw httpError(403, "This account is disabled.");

    await updateCollection("users", (items) => {
      const current = items.find((item) => item.id === user.id);
      current.lastLoginAt = nowIso();
      current.updatedAt = nowIso();
      return { returnValue: current };
    });

    const session = await createSessionForUser(req, user);
    setSessionCookie(res, session.token, session.expiresAt);
    await logActivity(user.id, "login", { method: "password" });

    res.json(await currentPayload({ ...user, lastLoginAt: nowIso() }));
  })
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[SESSION_COOKIE];
    if (token) {
      const tokenHash = hashToken(token);
      let removedSession = null;
      await updateCollection("sessions", (sessions) => {
        const index = sessions.findIndex((item) => item.tokenHash === tokenHash);
        if (index >= 0) {
          removedSession = sessions[index];
          sessions.splice(index, 1);
        }
        return { returnValue: removedSession };
      });

      if (removedSession) {
        const seconds = Math.max(0, Math.round((Date.now() - new Date(removedSession.createdAt).getTime()) / 1000));
        await logActivity(removedSession.userId, "logout", { sessionDurationSeconds: seconds });
      }
    }

    clearSessionCookie(res);
    res.json({ ok: true });
  })
);

router.get(
  "/me",
  asyncHandler(async (req, res) => {
    if (!req.user) return res.json({ user: null });
    const users = await readCollection("users");
    const user = users.find((item) => item.id === req.user.id);
    res.json(await currentPayload(user));
  })
);

export default router;
