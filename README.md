# ⬡ TaskFlow – Team Task Manager

A full-stack collaborative task management app built with React, Node.js, Express, and PostgreSQL.

---

## 🗂 Project Structure

```
team-task-manager/
├── backend/          # Node.js + Express API
│   ├── server.js
│   ├── db.js
│   ├── schema.sql    ← Run this in Railway PostgreSQL
│   ├── middleware/auth.js
│   └── routes/       auth | projects | tasks | dashboard
└── frontend/         # React + Vite
    └── src/
        ├── pages/    Login | Signup | Projects | ProjectDetail | Dashboard
        ├── components/ Navbar | ProtectedRoute
        ├── context/  AuthContext
        └── api/      axios.js
```

---

## ✅ Features

- JWT-based authentication (signup / login)
- Project creation — creator becomes Admin
- Role-based access: Admin vs Member
- Task management: title, description, priority, due date, status, assignment
- Dashboard with charts (status pie, priority bar, per-member progress)
- Overdue task detection
- Admin: full CRUD on tasks and members
- Member: view & update only their assigned tasks

---

## 🚀 Deploying to Railway (Step-by-Step)

### Step 1 — Create Railway Account
Go to https://railway.app and sign up (free tier works).

---

### Step 2 — Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
# Create a repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/team-task-manager.git
git push -u origin main
```

---

### Step 3 — Create PostgreSQL Database on Railway

1. On Railway Dashboard → **New Project** → **Add a Service** → **Database** → **PostgreSQL**
2. Click on the database → **Connect** tab → copy the **DATABASE_URL**
3. Click **Query** tab → paste and run the entire contents of `backend/schema.sql`

---

### Step 4 — Deploy the Backend

1. In the same Railway project → **Add Service** → **GitHub Repo**
2. Select your repo → Set **Root Directory** to `backend`
3. Railway auto-detects Node.js and runs `npm start`
4. Go to **Variables** tab → add:
   ```
   DATABASE_URL    = (paste from Step 3)
   JWT_SECRET      = any_long_random_string_here_at_least_32_chars
   NODE_ENV        = production
   FRONTEND_URL    = https://YOUR-FRONTEND.railway.app   (set after Step 5)
   PORT            = 5000
   ```
5. Go to **Settings** → **Networking** → **Generate Domain** → copy the URL

---

### Step 5 — Deploy the Frontend

1. In Railway → **Add Service** → **GitHub Repo** → same repo
2. Set **Root Directory** to `frontend`
3. Set **Build Command**: `npm run build`
4. Set **Start Command**: `npx serve -s dist -l $PORT`
5. Go to **Variables** tab → add:
   ```
   VITE_API_URL = https://YOUR-BACKEND.railway.app/api
   ```
   (Use the backend URL from Step 4, Step 5)
6. **Generate Domain** for the frontend

---

### Step 6 — Update FRONTEND_URL in Backend

Go back to the backend service → **Variables** → update:
```
FRONTEND_URL = https://YOUR-FRONTEND.railway.app
```

Redeploy the backend by clicking **Redeploy**.

---

### Step 7 — Verify

- Visit your frontend URL
- Sign up, create a project, add tasks
- Check `/health` on your backend URL: should return `{"status":"OK"}`

---

## 💻 Local Development

### Backend
```bash
cd backend
npm install
# Create .env from .env.example and fill in values
cp .env.example .env
# Start a local PostgreSQL instance, run schema.sql
node server.js        # or: npm run dev (with nodemon)
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env → set VITE_API_URL=http://localhost:5000/api
npm run dev
```

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/signup | ❌ | Register |
| POST | /api/auth/login | ❌ | Login |
| GET | /api/auth/me | ✅ | Current user |
| GET | /api/projects | ✅ | List my projects |
| POST | /api/projects | ✅ | Create project |
| GET | /api/projects/:id | ✅ | Project detail + members |
| DELETE | /api/projects/:id | Admin | Delete project |
| POST | /api/projects/:id/members | Admin | Add member |
| DELETE | /api/projects/:id/members/:uid | Admin | Remove member |
| GET | /api/tasks?project_id=X | ✅ | List tasks |
| POST | /api/tasks | Admin | Create task |
| PUT | /api/tasks/:id | ✅ | Update task |
| DELETE | /api/tasks/:id | Admin | Delete task |
| GET | /api/dashboard?project_id=X | ✅ | Dashboard stats |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6, Recharts |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Deployment | Railway |

---

## 📝 Environment Variables

### Backend
| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Secret key for JWT signing |
| PORT | Server port (default: 5000) |
| NODE_ENV | Set to `production` on Railway |
| FRONTEND_URL | Frontend URL for CORS |

### Frontend
| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API base URL |

---

## 🎥 Demo Video Checklist

Cover these in your 2–5 min video:
1. Sign up + login
2. Create a project
3. Add team members (by email)
4. Create tasks (with priority, due date, assignment)
5. Update task status (admin + member view)
6. Dashboard charts and stats
7. Role difference demo (admin vs member)
