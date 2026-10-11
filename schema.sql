-- =============================================================================
-- AgentBreak PostgreSQL Schema
-- =============================================================================
-- Run this against your PostgreSQL database to initialize all tables.
-- The backend also runs this automatically on startup via DatabaseManager._init_schema().
--
-- Usage:
--   psql $DATABASE_URL -f schema.sql
--   or paste directly into Supabase SQL Editor / Neon Console / Render PostgreSQL / psql
-- =============================================================================

-- Causal execution traces — one row per agent run
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

-- Red-team campaign results — one row per campaign run
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

-- Defense evaluation matrix — one row per (evaluation_id, defense) pair
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
