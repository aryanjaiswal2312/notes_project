import express from "express";
import { readCollection, updateCollection } from "../storage.js";
import { asyncHandler, httpError } from "../utils/errors.js";
import { cleanString, isEmail, normalizeEmail, profileCompletion } from "../utils/validators.js";
import { nowIso, sanitizeUser } from "../utils/security.js";
import { logActivity } from "../utils/activity.js";

const router = express.Router();

function userCounts(users) {
  return {
    totalUsers: users.length,
    activeUsers: users.filter((user) => user.status !== "disabled").length,
    disabledUsers: users.filter((user) => user.status === "disabled").length
  };
}

router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [users, profiles, notes, gallery, tasks, activity] = await Promise.all([
      readCollection("users"),
      readCollection("profiles"),
      readCollection("notes"),
      readCollection("gallery"),
      readCollection("tasks"),
      readCollection("activity")
    ]);

    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentActivity = activity.filter((item) => new Date(item.createdAt).getTime() >= since);
    const activeUserIds = new Set(recentActivity.map((item) => item.userId));
    const engagement = users
      .map((user) => ({
        user: sanitizeUser(user),
        events: activity.filter((item) => item.userId === user.id).length,
        notesCreated: notes.filter((note) => note.userId === user.id).length,
        filesUploaded: gallery.filter((file) => file.userId === user.id).length,
        tasksCompleted: tasks.filter((task) => task.userId === user.id && task.completed).length,
        profileCompletion: profileCompletion(profiles.find((profile) => profile.userId === user.id) || {})
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 5);

    res.json({
      ...userCounts(users),
      activeUsersLast7Days: activeUserIds.size,
      notesCreated: notes.length,
      filesUploaded: gallery.length,
      tasksCompleted: tasks.filter((task) => task.completed).length,
      activityEvents: activity.length,
      mostActiveUsers: engagement
    });
  })
);

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const search = cleanString(req.query.search, 120).toLowerCase();
    const [users, profiles, activity] = await Promise.all([readCollection("users"), readCollection("profiles"), readCollection("activity")]);

    const result = users
      .filter((user) => {
        if (!search) return true;
        return `${user.fullName} ${user.email} ${user.role} ${user.status}`.toLowerCase().includes(search);
      })
      .map((user) => {
        const profile = profiles.find((item) => item.userId === user.id) || {};
        const lastEvent = activity.find((item) => item.userId === user.id);
        return {
          ...sanitizeUser(user),
          profileCompletion: profileCompletion({ ...profile, fullName: user.fullName, email: user.email }),
          lastActivityAt: lastEvent?.createdAt || ""
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(result);
  })
);

router.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const [users, profiles, notes, gallery, tasks, activity] = await Promise.all([
      readCollection("users"),
      readCollection("profiles"),
      readCollection("notes"),
      readCollection("gallery"),
      readCollection("tasks"),
      readCollection("activity")
    ]);
    const user = users.find((item) => item.id === req.params.id);
    if (!user) throw httpError(404, "User not found.");

    res.json({
      user: sanitizeUser(user),
      profile: profiles.find((item) => item.userId === user.id) || null,
      notes: notes.filter((item) => item.userId === user.id),
      gallery: gallery.filter((item) => item.userId === user.id),
      tasks: tasks.filter((item) => item.userId === user.id),
      activity: activity.filter((item) => item.userId === user.id).slice(0, 80)
    });
  })
);

router.put(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const fullName = cleanString(req.body.fullName, 120);
    const email = normalizeEmail(req.body.email);
    const role = req.body.role === "admin" ? "admin" : "user";
    const status = req.body.status === "disabled" ? "disabled" : "active";

    if (!fullName) throw httpError(400, "Full name is required.");
    if (!isEmail(email)) throw httpError(400, "Valid email is required.");

    const user = await updateCollection("users", (users) => {
      const current = users.find((item) => item.id === req.params.id);
      if (!current) throw httpError(404, "User not found.");
      if (users.some((item) => item.id !== current.id && item.email === email)) throw httpError(409, "Email is already used by another user.");

      Object.assign(current, { fullName, email, role, status, updatedAt: nowIso() });
      return { returnValue: current };
    });

    await updateCollection("profiles", (profiles) => {
      const profile = profiles.find((item) => item.userId === user.id);
      if (profile) {
        profile.fullName = fullName;
        profile.email = email;
        profile.updatedAt = nowIso();
      }
      return { returnValue: profile };
    });

    await logActivity(req.user.id, "admin_user_updated", { targetUserId: user.id });
    res.json(sanitizeUser(user));
  })
);

router.patch(
  "/users/:id/status",
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.id && req.body.status === "disabled") {
      throw httpError(400, "Admins cannot disable their own active session.");
    }

    const status = req.body.status === "disabled" ? "disabled" : "active";
    const user = await updateCollection("users", (users) => {
      const current = users.find((item) => item.id === req.params.id);
      if (!current) throw httpError(404, "User not found.");
      current.status = status;
      current.updatedAt = nowIso();
      return { returnValue: current };
    });

    if (status === "disabled") {
      await updateCollection("sessions", (sessions) => ({
        data: sessions.filter((session) => session.userId !== user.id),
        returnValue: true
      }));
    }

    await logActivity(req.user.id, "admin_user_status_changed", { targetUserId: user.id, status });
    res.json(sanitizeUser(user));
  })
);

router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.id) throw httpError(400, "Admins cannot delete their own account.");

    const collections = ["users", "profiles", "notes", "sections", "gallery", "tasks", "sessions"];
    await Promise.all(
      collections.map((key) =>
        updateCollection(key, (items) => ({
          data: items.filter((item) => item.id !== req.params.id && item.userId !== req.params.id),
          returnValue: true
        }))
      )
    );

    await logActivity(req.user.id, "admin_user_deleted", { targetUserId: req.params.id });
    res.json({ ok: true });
  })
);

router.get(
  "/activity",
  asyncHandler(async (_req, res) => {
    const [activity, users] = await Promise.all([readCollection("activity"), readCollection("users")]);
    res.json(
      activity.slice(0, 200).map((event) => ({
        ...event,
        user: sanitizeUser(users.find((user) => user.id === event.userId))
      }))
    );
  })
);

export default router;
