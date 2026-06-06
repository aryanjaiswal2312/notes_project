import fs from "node:fs/promises";
import path from "node:path";
import { dataDir, uploadsDir } from "./config.js";

export const collections = {
  users: "users.json",
  profiles: "profiles.json",
  notes: "notes.json",
  sections: "sections.json",
  gallery: "gallery.json",
  tasks: "tasks.json",
  activity: "activity_logs.json",
  sessions: "sessions.json",
  settings: "settings.json"
};

const defaults = {
  users: [],
  profiles: [],
  notes: [],
  sections: [],
  gallery: [],
  tasks: [],
  activity: [],
  sessions: [],
  settings: { users: [] }
};

const writeQueues = new Map();

export async function ensureStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadsDir, { recursive: true });

  await Promise.all(
    Object.entries(collections).map(async ([key, filename]) => {
      const filePath = path.join(dataDir, filename);
      try {
        await fs.access(filePath);
      } catch {
        await fs.writeFile(filePath, JSON.stringify(defaults[key], null, 2));
      }
    })
  );
}

export async function readCollection(key) {
  const filename = collections[key];
  if (!filename) throw new Error(`Unknown collection: ${key}`);

  const filePath = path.join(dataDir, filename);
  const raw = await fs.readFile(filePath, "utf8");
  return raw.trim() ? JSON.parse(raw) : structuredClone(defaults[key]);
}

export async function writeCollection(key, data) {
  const filename = collections[key];
  if (!filename) throw new Error(`Unknown collection: ${key}`);

  const filePath = path.join(dataDir, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  return data;
}

export function updateCollection(key, updater) {
  const previous = writeQueues.get(key) || Promise.resolve();
  const next = previous.then(async () => {
    const current = await readCollection(key);
    const result = await updater(current);
    const nextData = result?.data ?? current;
    await writeCollection(key, nextData);
    return result?.returnValue ?? nextData;
  });

  writeQueues.set(
    key,
    next.catch(() => undefined)
  );

  return next;
}
