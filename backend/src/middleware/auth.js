import { SESSION_COOKIE } from "../config.js";
import { readCollection, updateCollection } from "../storage.js";
import { hashToken, sanitizeUser, nowIso } from "../utils/security.js";
import { httpError } from "../utils/errors.js";

export async function attachUser(req, _res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) return next();

    const tokenHash = hashToken(token);
    const [sessions, users] = await Promise.all([readCollection("sessions"), readCollection("users")]);
    const session = sessions.find((item) => item.tokenHash === tokenHash && new Date(item.expiresAt) > new Date());
    if (!session) return next();

    const user = users.find((item) => item.id === session.userId);
    if (!user || user.status === "disabled") return next();

    req.session = session;
    req.user = sanitizeUser(user);

    updateCollection("sessions", (items) => {
      const current = items.find((item) => item.id === session.id);
      if (current) current.lastSeenAt = nowIso();
      return { returnValue: current || session };
    }).catch(() => undefined);

    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(httpError(401, "Authentication required."));
  next();
}

export function requireAdmin(req, _res, next) {
  if (!req.user) return next(httpError(401, "Authentication required."));
  if (req.user.role !== "admin") return next(httpError(403, "Admin access required."));
  next();
}
