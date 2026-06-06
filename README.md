# Student Management & Note-Making Platform

A full-stack student productivity app built with React, JavaScript, CSS, Node.js, Express, and local JSON storage. It includes authentication, profile customization, rich-text notes, subject sections, study-resource uploads, daily targets, a floating productivity timer, app settings, and an admin dashboard.

## Quick Start

```powershell
code "C:\Users\hp\OneDrive\Desktop\trying app\notes for students"
npm run install:all
npm run dev
```

If PowerShell blocks `npm.ps1`, run the same commands with `npm.cmd`, for example `npm.cmd run dev`.

Frontend: `http://127.0.0.1:5173`  
Backend API: `http://localhost:4000`

If Vite starts on another local port, such as `5174`, the backend accepts it automatically.

## Production Commands

```powershell
npm run build
npm start
npm --prefix frontend run preview
```

## Project Structure

```text
.
├── backend
│   ├── data
│   │   ├── activity_logs.json
│   │   ├── gallery.json
│   │   ├── notes.json
│   │   ├── profiles.json
│   │   ├── sections.json
│   │   ├── sessions.json
│   │   ├── settings.json
│   │   ├── tasks.json
│   │   └── users.json
│   ├── src
│   │   ├── middleware
│   │   ├── routes
│   │   ├── utils
│   │   ├── config.js
│   │   ├── server.js
│   │   └── storage.js
│   └── uploads
├── frontend
│   ├── src
│   │   ├── api
│   │   ├── components
│   │   ├── data
│   │   ├── pages
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   └── vite.config.js
└── docs
    └── ARCHITECTURE.md
```

## Feature Map

- Authentication: signup, login, cookie sessions, logout, password hashing, duplicate account checks.
- Student profile: required fields, avatar upload, social links, custom skills/strengths/expertise/interests/knowledge sections, completion indicator.
- Notes: rich-text editor, headings, lists, links, images by URL, tables, tags, categories, search, edit, delete.
- Sections: add/edit/archive/delete course, subject, or document sections.
- Gallery: upload, view, download, delete, and categorize study documents.
- Daily targets: task CRUD, priority, completion tracking, daily summary, pending counter.
- Productivity timer: confirmation popup, floating timer, start/pause/resume/reset, add/remove 5 seconds, minimize/restore.
- Admin: user management, enable/disable/delete/edit users, profile monitoring, activity events, engagement metrics.
- Settings: light/dark mode, compact preference, notifications flag.

## API Overview

All authenticated routes use an HTTP-only cookie named `student_platform_session`.

```text
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/profile
PUT    /api/profile
DELETE /api/profile
POST   /api/profile/avatar

GET    /api/sections
POST   /api/sections
PUT    /api/sections/:id
PATCH  /api/sections/:id/archive
DELETE /api/sections/:id

GET    /api/notes
POST   /api/notes
PUT    /api/notes/:id
DELETE /api/notes/:id

GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/:id
PATCH  /api/tasks/:id/complete
DELETE /api/tasks/:id

GET    /api/gallery
POST   /api/gallery
GET    /api/gallery/:id/download
DELETE /api/gallery/:id

GET    /api/settings
PUT    /api/settings

GET    /api/admin/stats
GET    /api/admin/users
GET    /api/admin/users/:id
PUT    /api/admin/users/:id
PATCH  /api/admin/users/:id/status
DELETE /api/admin/users/:id
GET    /api/admin/activity
```

## Deployment Notes

This project is optimized for local use with JSON files. For a small private deployment, run the backend on a trusted machine, build the frontend with `npm run build`, and serve `frontend/dist` through a static host or reverse proxy. Keep `backend/data` and `backend/uploads` backed up because they are the app database and local file store.
