# Deployment Guide

This guide walks you through deploying AgentBreak to **Vercel** (frontend), **Render** (FastAPI backend), and **Supabase** (PostgreSQL + Auth).

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Vercel    │────▶│    Render    │────▶│   Supabase  │
│  (Frontend) │     │   (Backend)  │     │ (DB + Auth) │
└─────────────┘     └──────────────┘     └─────────────┘
   Next.js 14          FastAPI + uvicorn   PostgreSQL
   Supabase JS        JWT verification    Auth Users
```

---

## Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once the project is ready, go to **Project Settings > API**.
3. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key**
   - **service_role key** (keep this secret!)
   - **JWT Secret**

4. Go to **Project Settings > Database** and copy the **connection string** (URI method).

5. Go to **Authentication > Providers** and make sure **Email** is enabled.
   - Configure the site URL to your Vercel deployment URL for email confirmation redirects.

---

## Step 2: Deploy Backend to Render

1. Push your code to a Git repository (GitHub, GitLab, etc.).

2. Go to [render.com](https://render.com) and create a **New Web Service**.

3. Connect your repository and configure:
   - **Name**: `agentbreak-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. Add the following **Environment Variables**:

   ```
   DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws.<region>.supabase.co:5432/postgres
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   SUPABASE_JWT_SECRET=<your-jwt-secret>
   CORS_ORIGINS=["https://your-frontend.vercel.app","http://localhost:3000"]
   GEMINI_API_KEY=<optional-gemini-key>
   ```

5. Click **Create Web Service**. Once deployed, note your backend URL (e.g., `https://agentbreak-backend.onrender.com`).

---

## Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and import your repository.

2. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`

3. Add the following **Environment Variables**:

   ```
   NEXT_PUBLIC_API_URL=https://agentbreak-backend.onrender.com/api/v1
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

4. Click **Deploy**.

---

## Step 4: Configure Supabase Email Redirects

1. In your Supabase project, go to **Authentication > URL Configuration**.
2. Set the **Site URL** to your Vercel frontend URL (e.g., `https://your-app.vercel.app`).
3. Add `https://your-app.vercel.app` to **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/
   ```

---

## Environment Variables Summary

### Backend (Render)
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | ✅ |
| `SUPABASE_URL` | Supabase project URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret | ✅ |
| `CORS_ORIGINS` | Allowed frontend origins | ✅ |
| `GEMINI_API_KEY` | Google Gemini API key | ❌ |

### Frontend (Vercel)
| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Render backend URL + `/api/v1` | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | ✅ |

---

## Local Development

1. Copy the environment templates:
   ```bash
   # Root .env (backend)
   cp .env.example .env

   # Frontend .env
   cp frontend/.env.example frontend/.env.local
   ```

2. Fill in the values in both `.env` files.

3. Start the backend:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

4. Start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. Open `http://localhost:3000` in your browser.

---

## Auth Flow

1. User visits the frontend and clicks **Sign up**
2. Account is created via Supabase Auth
3. User receives a confirmation email
4. After confirming, user signs in with email/password
5. Supabase JWT token is stored and sent as `Authorization: Bearer <token>` to the backend
6. Backend verifies the JWT token using the Supabase JWT secret
7. Authenticated user can access all API endpoints

---

## Troubleshooting

### CORS Errors
Make sure your `CORS_ORIGINS` in the backend includes your Vercel frontend URL.

### Auth Not Working
- Verify `SUPABASE_JWT_SECRET` is set correctly in the backend
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in the frontend
- Ensure the Supabase email provider is enabled

### Database Connection Failed
- Verify the `DATABASE_URL` connection string is correct
- Check that the Supabase project is active
- Make sure the Render service can reach the Supabase database (no firewall blocking)
