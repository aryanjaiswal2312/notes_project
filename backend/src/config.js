import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const backendRoot = path.resolve(__dirname, "..");
export const dataDir = path.join(backendRoot, "data");
export const uploadsDir = path.join(backendRoot, "uploads");

export const PORT = Number(process.env.PORT || 4000);
export const SESSION_COOKIE = "student_platform_session";
export const SESSION_DAYS = 7;

export const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const url = new URL(origin);
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    return isHttp && isLocalHost;
  } catch {
    return false;
  }
}

export const uploadLimits = {
  fileSize: 8 * 1024 * 1024
};
