import { createId, nowIso } from "./security.js";
import { updateCollection } from "../storage.js";

export async function logActivity(userId, type, metadata = {}) {
  if (!userId) return null;

  return updateCollection("activity", (logs) => {
    const entry = {
      id: createId(),
      userId,
      type,
      metadata,
      createdAt: nowIso()
    };
    logs.unshift(entry);
    logs.splice(5000);
    return { returnValue: entry };
  });
}
