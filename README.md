# AgentBreak — The Autonomous AI Red Team

Autonomous security testing platform for AI agents that use tools. It attacks a sandboxed target agent, records reproducible causal traces of every attack, enforces a deterministic policy gate in front of the agent's tools, and proves with numbers that a defense stops the attack without breaking legitimate use.

---

## Architecture Overview

* **Frontend:** Next.js (App Router, Tailwind CSS, Lucide) deployed on **Vercel** (`frontend/`)
* **Backend:** Python 3.12+ FastAPI service managed with `uv` deployed on **Render** (`backend/`)
* **Storage:** SQLite file + trace JSON files in `backend/data/`
* **Target Agent:** Customer-support assistant with sandboxed mock tools and canary tracking
* **Policy Engine:** Deterministic pre-execution tool gateway enforcing security rules in application code

---

## Local Development Quickstart

### 1. Backend (FastAPI)
```bash
cd backend
uv sync --extra dev
uv run uvicorn app.main:app --reload --port 8000
```
API Health Check: `http://localhost:8000/health`  
Interactive Docs: `http://localhost:8000/docs`

Run Backend Tests:
```bash
cd backend
uv run pytest
```

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Documentation

Full specification available in [docs/agentbreak_prd.md](docs/agentbreak_prd.md).
