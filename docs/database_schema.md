# AgentBreak — PostgreSQL Database Architecture & Schema Reference

AgentBreak uses a production-ready PostgreSQL persistence layer managed by `app.core.database.DatabaseManager`. The database stores causal execution traces, red-team attack campaign outcomes, and comparative defense evaluations.

---

## 1. Quick Setup & Execution

### Option A: Automatic Initialization
When starting the FastAPI backend with a configured `DATABASE_URL`, `DatabaseManager` runs idempotent `CREATE TABLE IF NOT EXISTS` and index creation commands automatically on startup.

```bash
# In backend/.env or root .env
DATABASE_URL=postgresql://user:password@localhost:5432/agentbreak_db
```

### Option B: Manual Execution via `psql` / CLI
Run either the root or backend schema file directly against your PostgreSQL instance:

```bash
# Local or remote PostgreSQL instance
psql "$DATABASE_URL" -f schema.sql

# Or from the backend directory:
psql "$DATABASE_URL" -f backend/schema.sql
```

### Option C: Cloud Providers (Supabase, Neon, Render, AWS RDS)
Copy and paste the contents of [`schema.sql`](file:///c:/Users/jonat/OneDrive/Desktop/bnb_college_round/JOARvanna_college_round/schema.sql) into your database console's SQL Editor (e.g. Supabase SQL Editor, Neon Console, Render Database Dashboard) and click **Run**.

---

## 2. Entity-Relationship Overview

```mermaid
erDiagram
    TRACES {
        varchar trace_id PK
        varchar active_defense
        varchar model_adapter
        integer total_steps
        timestamptz created_at
        jsonb steps_json
    }

    CAMPAIGNS {
        varchar campaign_id PK
        varchar active_defense
        varchar model_adapter
        varchar status
        integer total_attacks
        integer successful_exploits
        real exploit_rate
        timestamptz created_at
        jsonb results_json
    }

    EVALUATIONS {
        serial id PK
        varchar evaluation_id
        varchar active_defense
        varchar model_adapter
        real attack_success_rate
        real benign_pass_rate
        real benign_approval_rate
        integer new_vulns_vs_baseline
        integer trials_per_attack
        timestamptz created_at
    }
```

---

## 3. Schema Definitions

### Table: `traces`
Stores causal execution traces for individual red-team and benign runs. Each row represents a full multi-step agent interaction with taint tracking and policy gate evaluations.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `trace_id` | `VARCHAR(128)` | `PRIMARY KEY` | Unique identifier (e.g., UUID4) for the execution trace. |
| `active_defense` | `VARCHAR(64)` | `NOT NULL` | Defense configuration in effect: `D0`, `D1`, `D2`, `D3`, or `D1+D2+D3`. |
| `model_adapter` | `VARCHAR(64)` | `NOT NULL` | Adapter used: `mock` or `gemini`. |
| `total_steps` | `INTEGER` | `NOT NULL` | Number of execution steps recorded in the trace. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Timestamp of trace generation in UTC. |
| `steps_json` | `JSONB` | `NOT NULL DEFAULT '[]'` | Complete chronological step array including tool proposals, policy decisions, and taint records. |

#### Indexes:
- `idx_traces_active_defense` on `traces (active_defense)`
- `idx_traces_created_at` on `traces (created_at DESC)`

---

### Table: `campaigns`
Stores aggregate outcomes for multi-vector red-team campaigns executed against target agents.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `campaign_id` | `VARCHAR(128)` | `PRIMARY KEY` | Unique campaign execution identifier (UUID4). |
| `active_defense` | `VARCHAR(64)` | `NOT NULL` | Active defense configuration under test. |
| `model_adapter` | `VARCHAR(64)` | `NOT NULL` | Target model adapter (`mock` / `gemini`). |
| `status` | `VARCHAR(64)` | `NOT NULL DEFAULT 'completed'` | Campaign status (`running`, `completed`, `failed`). |
| `total_attacks` | `INTEGER` | `NOT NULL DEFAULT 0` | Total number of attack vector attempts executed. |
| `successful_exploits` | `INTEGER` | `NOT NULL DEFAULT 0` | Number of attacks where the red team successfully breached security invariants. |
| `exploit_rate` | `REAL` | `NOT NULL DEFAULT 0.0` | Calculated fraction: `successful_exploits / total_attacks`. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Timestamp when campaign completed. |
| `results_json` | `JSONB` | `NOT NULL DEFAULT '[]'` | Detailed per-attack result breakdown with invariant violation details. |

#### Indexes:
- `idx_campaigns_active_defense` on `campaigns (active_defense)`
- `idx_campaigns_created_at` on `campaigns (created_at DESC)`
- `idx_campaigns_status` on `campaigns (status)`

---

### Table: `evaluations`
Stores comparative matrix evaluation runs across all defense levels (`D0` through `D1+D2+D3`), evaluating both adversarial exploit resistance and benign task utility.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Auto-incrementing internal surrogate primary key. |
| `evaluation_id` | `VARCHAR(128)` | `NOT NULL` | Unique ID grouping all defense rows belonging to the same evaluation run. |
| `active_defense` | `VARCHAR(64)` | `NOT NULL` | Defense tier: `D0`, `D1`, `D2`, `D3`, `D1+D2+D3`. |
| `model_adapter` | `VARCHAR(64)` | `NOT NULL` | Model adapter (`mock` or `gemini`). |
| `attack_success_rate` | `REAL` | `NOT NULL DEFAULT 0.0` | Exploit success rate (0.0 to 1.0; 0.0 is ideal). |
| `benign_pass_rate` | `REAL` | `NOT NULL DEFAULT 0.0` | Percentage of legitimate tasks completed successfully (1.0 is ideal). |
| `benign_approval_rate`| `REAL` | `NOT NULL DEFAULT 0.0` | Percentage of tasks executed without unnecessary human approval gates. |
| `new_vulns_vs_baseline` | `INTEGER` | `NOT NULL DEFAULT 0` | Net new vulnerabilities introduced relative to unhardened baseline `D0`. |
| `trials_per_attack` | `INTEGER` | `NOT NULL DEFAULT 1` | Repetitions executed per vector to ensure statistical significance. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Timestamp of evaluation run. |

#### Indexes:
- `idx_evaluations_evaluation_id` on `evaluations (evaluation_id)`
- `idx_evaluations_active_defense` on `evaluations (active_defense)`
- `idx_evaluations_created_at` on `evaluations (created_at DESC)`

---

## 4. SQL DDL Script

```sql
-- Causal execution traces
CREATE TABLE IF NOT EXISTS traces (
    trace_id       VARCHAR(128) PRIMARY KEY,
    active_defense VARCHAR(64)  NOT NULL,
    model_adapter  VARCHAR(64)  NOT NULL,
    total_steps    INTEGER      NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    steps_json     JSONB        NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_traces_active_defense ON traces (active_defense);
CREATE INDEX IF NOT EXISTS idx_traces_created_at     ON traces (created_at DESC);

-- Red-team campaign results
CREATE TABLE IF NOT EXISTS campaigns (
    campaign_id         VARCHAR(128) PRIMARY KEY,
    active_defense      VARCHAR(64)  NOT NULL,
    model_adapter       VARCHAR(64)  NOT NULL,
    status              VARCHAR(64)  NOT NULL DEFAULT 'completed',
    total_attacks       INTEGER      NOT NULL DEFAULT 0,
    successful_exploits INTEGER      NOT NULL DEFAULT 0,
    exploit_rate        REAL         NOT NULL DEFAULT 0.0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    results_json        JSONB        NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_campaigns_active_defense ON campaigns (active_defense);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at     ON campaigns (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_status         ON campaigns (status);

-- Defense evaluation matrix
CREATE TABLE IF NOT EXISTS evaluations (
    id                   SERIAL       PRIMARY KEY,
    evaluation_id        VARCHAR(128) NOT NULL,
    active_defense       VARCHAR(64)  NOT NULL,
    model_adapter        VARCHAR(64)  NOT NULL,
    attack_success_rate  REAL         NOT NULL DEFAULT 0.0,
    benign_pass_rate     REAL         NOT NULL DEFAULT 0.0,
    benign_approval_rate REAL         NOT NULL DEFAULT 0.0,
    new_vulns_vs_baseline INTEGER     NOT NULL DEFAULT 0,
    trials_per_attack    INTEGER      NOT NULL DEFAULT 1,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_evaluation_id  ON evaluations (evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_active_defense ON evaluations (active_defense);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at     ON evaluations (created_at DESC);
```

---

## 5. Security & Query Sanitization Guarantees

All interactions with PostgreSQL in AgentBreak adhere to strict security best practices:
1. **100% Parameterized Queries**: Every database access in [`backend/app/core/database.py`](file:///c:/Users/jonat/OneDrive/Desktop/bnb_college_round/JOARvanna_college_round/backend/app/core/database.py) uses standard parameterized `%s` query bindings via `psycopg` (v3). String formatting or manual concatenation is strictly disallowed.
2. **Upsert Protection**: Operations use `ON CONFLICT (...) DO UPDATE` for idempotent trace and campaign ingestion.
3. **Graceful Fallback**: If `DATABASE_URL` is unset, the system boots in degraded/no-DB mode so health checks and in-memory evaluation runs continue to work seamlessly without crashing.
