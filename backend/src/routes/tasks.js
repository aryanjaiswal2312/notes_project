import express from "express";
import { updateCollection } from "../storage.js";
import { asyncHandler, httpError } from "../utils/errors.js";
import { createId, nowIso } from "../utils/security.js";
import { cleanString, requireFields } from "../utils/validators.js";
import { logActivity } from "../utils/activity.js";

const router = express.Router();
const priorities = new Set(["high", "medium", "low"]);

function normalizeTask(body) {
  return {
    title: cleanString(body.title, 140),
    details: cleanString(body.details, 700),
    dueDate: cleanString(body.dueDate, 30),
    priority: priorities.has(body.priority) ? body.priority : "medium"
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const tasks = await updateCollection("tasks", (items) => ({
      returnValue: items.filter((item) => item.userId === req.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }));

    const completed = tasks.filter((task) => task.completed).length;
    res.json({
      tasks,
      summary: {
        total: tasks.length,
        completed,
        pending: tasks.length - completed,
        completionPercentage: tasks.length ? Math.round((completed / tasks.length) * 100) : 0
      }
    });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    requireFields(req.body, ["title"]);
    const now = nowIso();
    const task = await updateCollection("tasks", (tasks) => {
      const next = {
        id: createId(),
        userId: req.user.id,
        ...normalizeTask(req.body),
        completed: false,
        completedAt: "",
        createdAt: now,
        updatedAt: now
      };
      tasks.push(next);
      return { returnValue: next };
    });

    await logActivity(req.user.id, "task_created", { taskId: task.id });
    res.status(201).json(task);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const task = await updateCollection("tasks", (tasks) => {
      const current = tasks.find((item) => item.id === req.params.id && item.userId === req.user.id);
      if (!current) throw httpError(404, "Task not found.");

      Object.assign(current, normalizeTask(req.body), { updatedAt: nowIso() });
      return { returnValue: current };
    });

    await logActivity(req.user.id, "task_updated", { taskId: task.id });
    res.json(task);
  })
);

router.patch(
  "/:id/complete",
  asyncHandler(async (req, res) => {
    const completed = req.body.completed !== false;
    const task = await updateCollection("tasks", (tasks) => {
      const current = tasks.find((item) => item.id === req.params.id && item.userId === req.user.id);
      if (!current) throw httpError(404, "Task not found.");

      current.completed = completed;
      current.completedAt = completed ? nowIso() : "";
      current.updatedAt = nowIso();
      return { returnValue: current };
    });

    await logActivity(req.user.id, completed ? "task_completed" : "task_reopened", { taskId: task.id });
    res.json(task);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await updateCollection("tasks", (tasks) => {
      const index = tasks.findIndex((item) => item.id === req.params.id && item.userId === req.user.id);
      if (index < 0) throw httpError(404, "Task not found.");
      tasks.splice(index, 1);
      return { returnValue: true };
    });

    await logActivity(req.user.id, "task_deleted", { taskId: req.params.id });
    res.json({ ok: true });
  })
);

export default router;
