// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import path from "node:path";

// import { PORT, isAllowedOrigin, uploadsDir } from "./config.js";
// import { ensureStorage } from "./storage.js";

// import {
//   attachUser,
//   requireAdmin,
//   requireAuth
// } from "./middleware/auth.js";

// import authRoutes from "./routes/auth.js";
// import profileRoutes from "./routes/profile.js";
// import settingsRoutes from "./routes/settings.js";
// import sectionRoutes from "./routes/sections.js";
// import noteRoutes from "./routes/notes.js";
// import taskRoutes from "./routes/tasks.js";
// import galleryRoutes from "./routes/gallery.js";
// import adminRoutes from "./routes/admin.js";

// const app = express();

// /**
//  * Request Logger
//  */
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.originalUrl}`);
//   next();
// });

// /**
//  * CORS
//  */
// app.use(
//   cors({
//     origin(origin, callback) {
//       if (!origin) {
//         return callback(null, true);
//       }

//       if (isAllowedOrigin(origin)) {
//         return callback(null, true);
//       }

//       return callback(new Error("Origin not allowed by CORS."));
//     },
//     credentials: true
//   })
// );

// /**
//  * Middleware
//  */
// app.use(express.json({ limit: "1mb" }));
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// /**
//  * Static uploads
//  */
// app.use("/uploads", express.static(uploadsDir));

// /**
//  * Attach user if token exists
//  */
// app.use(attachUser);

// /**
//  * Health Check
//  */
// app.get("/api/health", (req, res) => {
//   res.status(200).json({
//     ok: true,
//     service: "student-platform-api"
//   });
// });

// /**
//  * API Routes
//  */
// app.use("/api/auth", authRoutes);

// app.use("/api/profile", requireAuth, profileRoutes);

// app.use("/api/settings", requireAuth, settingsRoutes);

// app.use("/api/sections", requireAuth, sectionRoutes);

// app.use("/api/notes", requireAuth, noteRoutes);

// app.use("/api/tasks", requireAuth, taskRoutes);

// app.use("/api/gallery", requireAuth, galleryRoutes);

// app.use(
//   "/api/admin",
//   requireAuth,
//   requireAdmin,
//   adminRoutes
// );

// /**
//  * 404 Handler
//  */
// app.use((req, res, next) => {
//   res.status(404).json({
//     success: false,
//     message: "Route not found.",
//     path: req.originalUrl,
//     method: req.method
//   });
// });

// /**
//  * Global Error Handler
//  */
// app.use((error, req, res, next) => {
//   console.error(error);

//   const status =
//     error.status ||
//     (error.message?.includes("Unsupported file type")
//       ? 400
//       : 500);

//   res.status(status).json({
//     success: false,
//     message:
//       status >= 500
//         ? "Something went wrong."
//         : error.message
//   });
// });

// /**
//  * Start Server
//  */
// async function startServer() {
//   try {
//     await ensureStorage();

//     app.listen(PORT, () => {
//       console.log(
//         `Student platform API running on http://localhost:${PORT}`
//       );

//       console.log(
//         `Uploads served from ${
//           path.relative(process.cwd(), uploadsDir) ||
//           uploadsDir
//         }`
//       );
//     });
//   } catch (error) {
//     console.error("Failed to start server:", error);
//     process.exit(1);
//   }
// }

// startServer();



import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { PORT, isAllowedOrigin, uploadsDir } from "./config.js";
import { ensureStorage } from "./storage.js";
import { attachUser, requireAdmin, requireAuth } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import settingsRoutes from "./routes/settings.js";
import sectionRoutes from "./routes/sections.js";
import noteRoutes from "./routes/notes.js";
import taskRoutes from "./routes/tasks.js";
import galleryRoutes from "./routes/gallery.js";
import adminRoutes from "./routes/admin.js";

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed by CORS."));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(uploadsDir));
app.use(attachUser);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "student-platform-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", requireAuth, profileRoutes);
app.use("/api/settings", requireAuth, settingsRoutes);
app.use("/api/sections", requireAuth, sectionRoutes);
app.use("/api/notes", requireAuth, noteRoutes);
app.use("/api/tasks", requireAuth, taskRoutes);
app.use("/api/gallery", requireAuth, galleryRoutes);
app.use("/api/admin", requireAuth, requireAdmin, adminRoutes);

app.use((_req, _res, next) => {
  const error = new Error("Route not found.");
  error.status = 404;
  next(error);
});

app.use((error, _req, res, _next) => {
  const status = error.status || (error.message?.includes("Unsupported file type") ? 400 : 500);
  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({
    message: status >= 500 ? "Something went wrong." : error.message
  });
});

await ensureStorage();

app.listen(PORT, () => {
  console.log(`Student platform API running on http://localhost:${PORT}`);
  console.log(`Uploads served from ${path.relative(process.cwd(), uploadsDir) || uploadsDir}`);
});
