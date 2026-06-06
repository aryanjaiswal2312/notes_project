# Architecture

## System Design

The app uses a simple split architecture:

- React frontend with page-level modules and reusable controls.
- Express backend with route modules grouped by domain.
- Local JSON files as the persistence layer.
- Local filesystem uploads for profile pictures and gallery resources.
- Cookie-based sessions stored in `backend/data/sessions.json`.

## Component Architecture

```text
App
├── Auth
├── Sidebar
├── Topbar
├── Dashboard
├── Profile
├── Customization
├── Notes
│   ├── SectionModal
│   └── RichTextEditor
├── Gallery
├── Tasks
├── Settings
├── Admin
├── WelcomeModal
└── TimerWidget
```

## Data Schema

`users.json`

```json
{
  "id": "uuid",
  "fullName": "Student Name",
  "email": "student@example.com",
  "role": "user",
  "status": "active",
  "passwordHash": "pbkdf2-hash",
  "createdAt": "ISO date",
  "updatedAt": "ISO date",
  "lastLoginAt": "ISO date"
}
```

`profiles.json`

```json
{
  "id": "uuid",
  "userId": "uuid",
  "fullName": "Student Name",
  "email": "student@example.com",
  "phone": "",
  "address": "",
  "bio": "",
  "avatarUrl": "/uploads/file.png",
  "socialLinks": [],
  "skills": [],
  "strengths": [],
  "expertise": [],
  "interests": [],
  "knowledgeAreas": [],
  "customSections": []
}
```

Other collections:

- `sections.json`: course, subject, and document sections.
- `notes.json`: rich HTML notes grouped by section, category, and tags.
- `gallery.json`: uploaded study resources and metadata.
- `tasks.json`: daily target tasks and completion state.
- `activity_logs.json`: login, logout, upload, task, note, and admin events.
- `settings.json`: per-user theme and preference settings.

## Authentication Flow

1. User signs up or logs in.
2. Backend validates input and password.
3. Passwords are hashed with Node crypto PBKDF2.
4. Backend creates a random session token.
5. A SHA-256 hash of the token is saved in `sessions.json`.
6. The raw token is sent as an HTTP-only cookie.
7. Auth middleware checks the cookie hash and user status on protected routes.
8. Admin routes additionally require `role: "admin"`.

## Routing Design

The frontend uses app state for page routing to keep dependencies minimal. The sidebar updates `activePage`, and the shell renders the matching page module. Backend routing is REST-style and grouped by entity.

## Wireframe Descriptions

- Login/Signup: centered authentication panel with segmented mode switch, validation, and role selection on signup.
- Dashboard: responsive feature-card grid for Notes, CG Notes, Daily Target, Gallery, and Profile Progress, followed by daily summary and completion panels.
- Notes: horizontal section strip, rich note editor on the left, searchable note list on the right.
- Profile: profile hero with avatar and contact status, bio panel, completion indicator, and custom fields.
- Customization: profile edit form, avatar upload control, comma-separated skill fields, and repeatable custom profile sections.
- Gallery: upload panel at top, responsive resource cards with previews and download/delete actions.
- Daily Target: summary cards, task editor, progress bar, and task list with priority pills.
- Admin: stat cards, searchable user table, editable user detail panel, activity monitoring, and most-active users.

## Security Recommendations

- Use HTTPS and set `secure: true` on cookies before internet deployment.
- Keep JSON data and upload directories outside public web roots except for files intentionally served.
- Back up `backend/data` and `backend/uploads`.
- For multi-user production, replace JSON files with a transactional database.
- Add rate limiting and CSRF protection if exposed beyond trusted local networks.
- Expand HTML sanitization for notes with a maintained sanitizer before public use.

