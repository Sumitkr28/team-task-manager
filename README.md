# Team Task Manager

A full-stack web app for managing projects and tasks with role-based access control. Users sign up, create projects, invite teammates as **Admin** or **Member**, and track work on a Kanban board with comments, priorities, tags, and an activity log.

## 🌐 Live Demo

🚀 **Live Application:**
https://team-task-manager-production-e13c.up.railway.app

The application is fully deployed on Railway and is production-ready. You can sign up, create projects, assign tasks, and explore all features in real-time.

---

## 🧱 Tech Stack

**Frontend & Backend:** Next.js 16 (App Router), React 19
**Database & ORM:** PostgreSQL, Prisma 7
**Language:** TypeScript
**Styling:** Tailwind CSS
**Validation:** Zod
**Authentication:** JWT (HTTP-only cookies), jose, bcryptjs

---

## ✨ Features

* Secure authentication (JWT in HTTP-only cookies)
* Role-Based Access Control (**Admin / Member per project**)
* Project creation and team member management
* Task management:

  * Status: Todo / In Progress / Done
  * Priority: Low / Medium / High
  * Due dates & assignment
  * Tags for filtering
* Kanban board (drag-and-drop task updates)
* Comments system per task
* Activity log (audit trail for actions)
* Dashboard with:

  * My projects count
  * Task status breakdown
  * Tasks due today
  * Overdue tasks
  * Recent activity

---

## 🛠️ Local Development

### 1. Prerequisites

* Node.js 20+
* PostgreSQL (local or Railway)

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

```bash
cp .env.example .env
```

Update `.env`:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_here
```

Generate a secure secret:

```bash
openssl rand -base64 48
```

---

### 4. Database setup

```bash
npx prisma generate
npx prisma migrate dev
npm run db:seed   # optional demo data
```

---

### 5. Run the app

```bash
npm run dev
```

Open: http://localhost:3000

---

## 📡 API Reference

All routes return JSON. Errors follow:

```json
{ "error": { "code": "string", "message": "string", "details": {} } }
```

Auth uses `ttm_session` HTTP-only cookie.

| Method | Endpoint         | Description      |
| ------ | ---------------- | ---------------- |
| POST   | /api/auth/signup | Register user    |
| POST   | /api/auth/login  | Login user       |
| POST   | /api/auth/logout | Logout           |
| GET    | /api/auth/me     | Get current user |

### Projects

| Method | Endpoint          | Description            |
| ------ | ----------------- | ---------------------- |
| GET    | /api/projects     | List user projects     |
| POST   | /api/projects     | Create project         |
| GET    | /api/projects/:id | Project details        |
| PATCH  | /api/projects/:id | Update project (Admin) |
| DELETE | /api/projects/:id | Delete project (Admin) |

### Members

| Method | Endpoint                          | Description   |
| ------ | --------------------------------- | ------------- |
| GET    | /api/projects/:id/members         | List members  |
| POST   | /api/projects/:id/members         | Invite member |
| PATCH  | /api/projects/:id/members/:userId | Change role   |
| DELETE | /api/projects/:id/members/:userId | Remove member |

### Tasks

| Method | Endpoint                | Description  |
| ------ | ----------------------- | ------------ |
| GET    | /api/projects/:id/tasks | List tasks   |
| POST   | /api/projects/:id/tasks | Create task  |
| GET    | /api/tasks/:id          | Task details |
| PATCH  | /api/tasks/:id          | Update task  |
| DELETE | /api/tasks/:id          | Delete task  |

### Comments

| Method | Endpoint                | Description  |
| ------ | ----------------------- | ------------ |
| GET    | /api/tasks/:id/comments | Get comments |
| POST   | /api/tasks/:id/comments | Add comment  |

### Dashboard

| Method | Endpoint       | Description      |
| ------ | -------------- | ---------------- |
| GET    | /api/dashboard | Aggregated stats |

---

## 🔐 Role-Based Access Control (RBAC)

Roles are scoped per project.

| Action                  | Admin | Member |
| ----------------------- | ----- | ------ |
| Edit/Delete project     | ✅     | ❌      |
| Invite/remove members   | ✅     | ❌      |
| Create task             | ✅     | ✅      |
| Edit own/assigned tasks | ✅     | ✅      |
| Edit others' tasks      | ✅     | ❌      |
| Delete others' tasks    | ✅     | ❌      |
| Comment                 | ✅     | ✅      |

---

## 🚀 Deployment (Railway)

1. Create a Railway project
2. Add PostgreSQL database
3. Connect GitHub repository
4. Set environment variables:

   * `DATABASE_URL` (auto-provided)
   * `JWT_SECRET`
   * `NODE_ENV=production`
5. Build & Start commands:

```bash
Build: npx prisma generate && npx prisma migrate deploy && npm run build
Start: npm run start
```

6. Generate public domain

---

## 📁 Project Structure

```
prisma/
  schema.prisma
  seed.ts

src/
  app/
    (app)/
    login/
    signup/
    api/
  components/
  lib/
    auth.ts
    db.ts
    rbac.ts
    validators.ts
    activity.ts
    http.ts
  proxy.ts
  generated/prisma/

railway.json
.env.example
README.md
```

---

## ⚠️ Notes

* Next.js 16 uses `proxy.ts` instead of middleware
* Prisma 7 uses driver adapters (`@prisma/adapter-pg`)
* Route params are async and must be awaited

---

## 📦 Submission

* ✅ Live URL: https://team-task-manager-production-e13c.up.railway.app
* ✅ GitHub Repository: *(add your repo link here)*
* ✅ README: Included

---
