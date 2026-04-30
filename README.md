# Team Task Manager

A full-stack web app for managing projects and tasks with role-based access control. Users sign up, create projects, invite teammates as **Admin** or **Member**, and track work on a Kanban board with comments, priorities, tags, and an activity log.

**Stack:** Next.js 16 (App Router) · React 19 · Prisma 7 · PostgreSQL · TypeScript · Tailwind CSS · Zod · jose (JWT) · bcryptjs

## Features

- Email + password auth with bcrypt-hashed passwords and HTTP-only-cookie JWT sessions
- Projects with **per-project** Admin / Member roles (RBAC enforced server-side)
- Tasks: title, description, status (Todo / In Progress / Done), priority (Low / Medium / High), assignee, due date, tags
- Kanban board with drag-and-drop status changes
- Comments and full activity log per project
- Dashboard with stats: my projects, status breakdown, due today, overdue, recent activity

## Local development

### 1. Prerequisites

- Node.js 20+
- A running PostgreSQL instance (local Docker, Postgres.app, or Railway)

### 2. Install

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# then edit .env:
#   DATABASE_URL=postgresql://...
#   JWT_SECRET=$(openssl rand -base64 48)
```

### 4. Migrate + seed

```bash
npm run db:migrate     # creates tables, prompts for migration name on first run
npm run db:seed        # optional: creates demo users (alice@example.com / bob@example.com, password "password123")
```

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000.

## API reference

All routes return JSON. Errors use `{ error: { code, message, details? } }`. Auth is via the `ttm_session` HTTP-only cookie set by `/api/auth/{signup,login}`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | `{ email, password, name }` -> sets cookie |
| POST | `/api/auth/login` | — | `{ email, password }` -> sets cookie |
| POST | `/api/auth/logout` | — | clears cookie |
| GET  | `/api/auth/me` | — | returns `{ user }` or `{ user: null }` |
| GET  | `/api/projects` | yes | list projects the user belongs to |
| POST | `/api/projects` | yes | `{ name, description? }` — creator becomes Admin |
| GET  | `/api/projects/:id` | yes | project details (member only) |
| PATCH| `/api/projects/:id` | Admin | update name / description |
| DELETE| `/api/projects/:id` | Admin | delete project |
| GET  | `/api/projects/:id/members` | yes | list members |
| POST | `/api/projects/:id/members` | Admin | `{ email, role }` invite by email |
| PATCH| `/api/projects/:id/members/:userId` | Admin | `{ role }` change role |
| DELETE| `/api/projects/:id/members/:userId` | Admin | remove member |
| GET  | `/api/projects/:id/tasks` | yes | filters: `?status=`, `?assigneeId=` (use `me`), `?overdue=true`, `?tag=` |
| POST | `/api/projects/:id/tasks` | yes | create task |
| GET  | `/api/tasks/:id` | member | task with comments |
| PATCH| `/api/tasks/:id` | creator/assignee/admin | update task |
| DELETE| `/api/tasks/:id` | creator/admin | delete task |
| GET  | `/api/tasks/:id/comments` | member | list comments |
| POST | `/api/tasks/:id/comments` | member | `{ body }` |
| GET  | `/api/dashboard` | yes | aggregated stats for the current user |

### RBAC summary

Roles are scoped to each project. The user who creates a project is its first Admin.

| Action | Admin | Member |
|---|---|---|
| Edit / delete project | yes | no |
| Invite / remove members, change roles | yes | no |
| Create task | yes | yes |
| Edit task created by them OR assigned to them | yes | yes |
| Edit other members' tasks | yes | no |
| Delete other members' tasks | yes | no |
| Comment | yes | yes |

## Deployment (Railway)

1. **Provision Postgres**: in your Railway project, click *New -> Database -> PostgreSQL*. Railway will set `DATABASE_URL` on the linked services automatically.
2. **Create the web service**: *New -> GitHub Repo* -> pick this repo. Railway will detect Next.js via Nixpacks.
3. **Set env vars** on the web service:
   - `JWT_SECRET` — a 32+ char random string (`openssl rand -base64 48`)
   - `NODE_ENV=production`
   - (`DATABASE_URL` is injected from the Postgres plugin)
4. **Build & start commands** are defined in `railway.json`:
   - Build: `npx prisma generate && npx prisma migrate deploy && npm run build`
   - Start: `npm run start`
5. **Generate a public domain** for the service (Settings -> Networking -> Generate Domain).
6. Visit the URL, sign up, and you're live.

If you want demo data on the deployed DB, run `npm run db:seed` against the Railway connection string (or use the Railway shell).

## Project structure

```
prisma/
  schema.prisma            data model
  seed.ts                  demo data
src/
  app/
    (app)/                 authenticated routes (dashboard, projects)
    login/, signup/        public auth pages
    api/                   REST endpoints
    page.tsx               root redirect
    layout.tsx             root html
  components/              client UI (board, drawer, panels)
  lib/
    auth.ts                hashing, JWT, cookies, getSession()
    db.ts                  Prisma client singleton (PrismaPg adapter)
    rbac.ts                requireProjectAdmin, canEditTask, canDeleteTask
    validators.ts          zod schemas
    activity.ts            logActivity()
    http.ts                error handling
  proxy.ts                 auth gate (Next.js 16 renamed middleware -> proxy)
  generated/prisma/        generated client (do not edit)
railway.json
.env.example
```

## Notes on Next.js 16 / Prisma 7

- The `middleware.ts` convention was renamed to `proxy.ts` in Next.js 16.
- Route handler `params` are async (`{ params: Promise<...> }`) and must be awaited.
- Prisma 7 moves the connection string from `schema.prisma` to `prisma.config.ts` and uses driver adapters; we use `@prisma/adapter-pg`. The generated client lives at `src/generated/prisma/`.
