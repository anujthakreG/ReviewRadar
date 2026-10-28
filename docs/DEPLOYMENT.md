# ReviewRadar Production Deployment Guide

This guide walks you through deploying the complete full-stack **ReviewRadar** application:
- **Frontend:** Vercel (`https://review-radar-sepia.vercel.app/`)
- **Backend:** Render (FastAPI + Python 3.11/3.13)
- **Database:** SQLite (persisted on disk) or Managed PostgreSQL (Neon / Supabase / Render Postgres)

---

## 1. Why `500 FUNCTION_INVOCATION_FAILED` Occurred

When deploying a Python FastAPI application directly on Vercel Serverless Functions:
1. **Read-Only Filesystem:** Vercel lambda containers run on a read-only filesystem (`/var/task`). SQLite attempts to create `./reviewradar.db` during application startup (`Base.metadata.create_all()`), which immediately throws a fatal `OperationalError: unable to open database file`, triggering Vercel's `500 FUNCTION_INVOCATION_FAILED`.
2. **Ephemeral Storage:** Even if SQLite writes to `/tmp`, serverless functions discard `/tmp` on cold-starts. Any uploaded reviews or products disappear across requests.
3. **CORS Restrictions:** The backend was restricted to `localhost:5173`.
4. **Vite API URL Configuration:** The frontend requires `VITE_API_BASE_URL` to point to the live backend URL at build time; otherwise, it defaults to `http://localhost:8000`.

---

## 2. Recommended Production Architecture

| Component | Platform | URL | Configuration |
|---|---|---|---|
| **Frontend** | **Vercel** | `https://review-radar-sepia.vercel.app/` | Vite + React SPA with `frontend/vercel.json` rewrite |
| **Backend** | **Render** | `https://reviewradar-backend.onrender.com` | Uvicorn ASGI Web Service (from `render.yaml`) |
| **Database** | **Render / Neon Postgres** | Persistent connection string | `DATABASE_URL=postgresql://...` |

---

## 3. Step 1: Deploy Backend to Render (2 Minutes)

Render provides free persistent hosting for Python web applications.

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and sign in with your GitHub account.
2. Click **New +** $\rightarrow$ **Web Service**.
3. Select **Build and deploy from a Git repository** and connect:
   `https://github.com/anujthakreG/ReviewRadar`
4. Fill in the deployment settings:
   - **Name:** `reviewradar-backend` (or your preferred name)
   - **Region:** Any (e.g., *Oregon (US West)* or *Frankfurt (EU)*)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
5. Click **Advanced** $\rightarrow$ **Add Environment Variable**:
   - `CORS_ORIGINS`: `https://review-radar-sepia.vercel.app,http://localhost:5173`
   - `PYTHON_VERSION`: `3.11.9`
6. Click **Create Web Service**.
7. Render will build and deploy your backend. Once deployed, note down your live backend URL (e.g., `https://reviewradar-backend.onrender.com`).

> **Tip:** You can also use Render's **Blueprints** feature: Click **New +** $\rightarrow$ **Blueprint**, connect your repo, and Render will automatically configure the service using the included `render.yaml`!

---

## 4. Step 2: Configure Database Persistence

### Option A: Managed PostgreSQL (Recommended for Zero-Maintenance Production)
1. Get a free, instant serverless PostgreSQL database from [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Copy your connection string (e.g., `postgresql://username:password@ep-xyz.neon.tech/reviewradar?sslmode=require`).
3. In your Render Web Service dashboard, go to **Environment** $\rightarrow$ Add:
   - `DATABASE_URL`: `<your-postgres-connection-string>`
4. Render will automatically redeploy. The backend will create all tables (`products`, `reviews`, `import_jobs`) automatically on startup.

### Option B: Local SQLite with Render Persistent Disk
If you prefer SQLite without external databases:
1. In Render Web Service settings, go to **Disks** $\rightarrow$ **Add Disk**.
2. Mount path: `/var/data` (Size: 1 GB).
3. Set Environment Variable: `DATABASE_URL=sqlite:////var/data/reviewradar.db`.

---

## 5. Step 3: Connect Frontend on Vercel to Live Backend

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Select your `review-radar-sepia` project.
3. Click **Settings** $\rightarrow$ **Environment Variables**.
4. Add the following variable:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://reviewradar-backend.onrender.com` *(replace with your actual Render URL)*
   - **Environments:** Select *Production*, *Preview*, and *Development*.
5. Click **Save**.
6. Go to the **Deployments** tab $\rightarrow$ Click the **three dots (...)** on your latest deployment $\rightarrow$ Click **Redeploy**.
   *(Vite requires a redeployment to bake the new environment variable into the client bundle).*

---

## 6. Step 4: Verification & Smoke Test

Once redeployed:
1. Open your live frontend: [https://review-radar-sepia.vercel.app/](https://review-radar-sepia.vercel.app/)
2. Check the top navigation bar:
   - The status badge should display either active reviews or *"No Dataset Active"*.
3. Click **"Load Sample"** in the top navigation bar.
   - It will import 31 clean records and flag 4 flawed records.
4. Verify the **Dashboard**, **Review Explorer**, **Analytics**, and **Data Quality** tabs update with real metrics.
5. Check backend interactive Swagger documentation at:
   `https://<your-backend-url>/docs`
