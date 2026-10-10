"""PostgreSQL Database Manager for AgentBreak.

Guarantees:
1. Strict parameterized query sanitization to eliminate SQL injection.
2. Clean connection management via psycopg (v3) or psycopg2 fallback.
3. All operations use %s-style parameterized queries — no string interpolation.
"""

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.core.config import settings

# PostgreSQL driver — psycopg v3 preferred, psycopg2 as fallback
try:
    import psycopg
    HAS_PSYCOPG = True
    PSYCOPG_VERSION = 3
except ImportError:
    try:
        import psycopg2 as psycopg  # type: ignore
        HAS_PSYCOPG = True
        PSYCOPG_VERSION = 2
    except ImportError:
        HAS_PSYCOPG = False
        PSYCOPG_VERSION = 0


class DatabaseManager:
    def __init__(self, database_url: Optional[str] = None):
        self.raw_url = database_url or settings.DATABASE_URL
        self._dsn: Optional[str] = None
        self._ready = False

        if not self.raw_url or not HAS_PSYCOPG:
            # No DATABASE_URL or no driver — start in degraded/no-DB mode.
            # DB endpoints will return a clear error; health check still works.
            return

        self._dsn = self.raw_url.replace("postgres://", "postgresql://").replace(
            "postgresql+psycopg://", "postgresql://"
        )
        try:
            self._init_schema()
            self._ready = True
        except Exception as e:
            print(f"[AgentBreak] WARNING: DB init failed ({e}). Running in no-DB mode.")

    def _require_db(self):
        """Raises a clear error if DB is not configured or available."""
        if not self._ready:
            raise RuntimeError(
                "Database not available. Set DATABASE_URL to a PostgreSQL connection string in .env"
            )

    def _connect(self):
        """Opens a new parameterized PostgreSQL connection."""
        self._require_db()
        return psycopg.connect(self._dsn)

    def _init_schema(self):
        """Idempotently initializes all database tables."""
        ddl = """
        CREATE TABLE IF NOT EXISTS traces (
            trace_id    VARCHAR(128) PRIMARY KEY,
            active_defense VARCHAR(64) NOT NULL,
            model_adapter  VARCHAR(64) NOT NULL,
            total_steps    INTEGER     NOT NULL,
            created_at     TIMESTAMPTZ NOT NULL,
            steps_json     JSONB       NOT NULL
        );

        CREATE TABLE IF NOT EXISTS campaigns (
            campaign_id       VARCHAR(128) PRIMARY KEY,
            active_defense    VARCHAR(64)  NOT NULL,
            model_adapter     VARCHAR(64)  NOT NULL,
            status            VARCHAR(64)  NOT NULL,
            total_attacks     INTEGER      NOT NULL,
            successful_exploits INTEGER    NOT NULL,
            exploit_rate      REAL         NOT NULL,
            created_at        TIMESTAMPTZ  NOT NULL,
            results_json      JSONB        NOT NULL
        );

        CREATE TABLE IF NOT EXISTS evaluations (
            id                  SERIAL      PRIMARY KEY,
            evaluation_id       VARCHAR(128) NOT NULL,
            active_defense      VARCHAR(64)  NOT NULL,
            model_adapter       VARCHAR(64)  NOT NULL,
            attack_success_rate REAL         NOT NULL,
            benign_pass_rate    REAL         NOT NULL,
            benign_approval_rate REAL        NOT NULL,
            new_vulns_vs_baseline INTEGER    NOT NULL,
            trials_per_attack   INTEGER      NOT NULL,
            created_at          TIMESTAMPTZ  NOT NULL
        );
        """
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(ddl)
            conn.commit()

    # =========================================================================
    # Parameterized CRUD Operations
    # =========================================================================

    def save_trace(
        self,
        trace_id: str,
        active_defense: str,
        model_adapter: str,
        total_steps: int,
        steps: List[Dict[str, Any]],
        created_at: Optional[str] = None,
    ):
        """Parameterized upsert of a causal execution trace."""
        ts = created_at or datetime.now(timezone.utc).isoformat()
        steps_json = json.dumps(steps)

        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO traces
                        (trace_id, active_defense, model_adapter, total_steps, created_at, steps_json)
                    VALUES (%s, %s, %s, %s, %s, %s::jsonb)
                    ON CONFLICT (trace_id) DO UPDATE SET
                        active_defense = EXCLUDED.active_defense,
                        model_adapter  = EXCLUDED.model_adapter,
                        total_steps    = EXCLUDED.total_steps,
                        steps_json     = EXCLUDED.steps_json;
                    """,
                    (trace_id, active_defense, model_adapter, total_steps, ts, steps_json),
                )
            conn.commit()

    def get_trace(self, trace_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a trace by ID."""
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT trace_id, active_defense, model_adapter, total_steps, created_at, steps_json
                    FROM traces WHERE trace_id = %s
                    """,
                    (trace_id,),
                )
                row = cur.fetchone()
        if not row:
            return None
        steps = row[5] if isinstance(row[5], list) else json.loads(row[5])
        return {
            "trace_id": row[0],
            "active_defense": row[1],
            "model_adapter": row[2],
            "total_steps": row[3],
            "created_at": str(row[4]),
            "steps": steps,
        }

    def save_campaign(
        self,
        campaign_id: str,
        active_defense: str,
        model_adapter: str,
        status: str,
        total_attacks: int,
        successful_exploits: int,
        exploit_rate: float,
        results: List[Dict[str, Any]],
        created_at: Optional[str] = None,
    ):
        """Parameterized upsert of a campaign execution result."""
        ts = created_at or datetime.now(timezone.utc).isoformat()
        results_json = json.dumps(results)

        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO campaigns
                        (campaign_id, active_defense, model_adapter, status,
                         total_attacks, successful_exploits, exploit_rate, created_at, results_json)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb)
                    ON CONFLICT (campaign_id) DO UPDATE SET
                        status              = EXCLUDED.status,
                        total_attacks       = EXCLUDED.total_attacks,
                        successful_exploits = EXCLUDED.successful_exploits,
                        exploit_rate        = EXCLUDED.exploit_rate,
                        results_json        = EXCLUDED.results_json;
                    """,
                    (
                        campaign_id, active_defense, model_adapter, status,
                        total_attacks, successful_exploits, exploit_rate, ts, results_json,
                    ),
                )
            conn.commit()

    def get_campaign(self, campaign_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a campaign by ID."""
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT campaign_id, active_defense, model_adapter, status,
                           total_attacks, successful_exploits, exploit_rate, created_at, results_json
                    FROM campaigns WHERE campaign_id = %s
                    """,
                    (campaign_id,),
                )
                row = cur.fetchone()
        if not row:
            return None
        results = row[8] if isinstance(row[8], list) else json.loads(row[8])
        return {
            "campaign_id": row[0],
            "active_defense": row[1],
            "model_adapter": row[2],
            "status": row[3],
            "total_attacks": row[4],
            "successful_exploits": row[5],
            "exploit_rate": row[6],
            "created_at": str(row[7]),
            "results": results,
        }

    def list_campaigns(self) -> List[Dict[str, Any]]:
        """Lists all campaigns sorted by creation date descending."""
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT campaign_id, active_defense, model_adapter, status,
                           total_attacks, successful_exploits, exploit_rate, created_at, results_json
                    FROM campaigns ORDER BY created_at DESC
                    """
                )
                rows = cur.fetchall()
        items = []
        for row in rows:
            results = row[8] if isinstance(row[8], list) else json.loads(row[8])
            items.append({
                "campaign_id": row[0],
                "active_defense": row[1],
                "model_adapter": row[2],
                "status": row[3],
                "total_attacks": row[4],
                "successful_exploits": row[5],
                "exploit_rate": row[6],
                "created_at": str(row[7]),
                "results": results,
            })
        return items

    def save_evaluation_matrix(self, evaluation_id: str, summaries: List[Dict[str, Any]]):
        """Saves evaluation summaries for all defenses."""
        ts = datetime.now(timezone.utc).isoformat()
        with self._connect() as conn:
            with conn.cursor() as cur:
                for s in summaries:
                    cur.execute(
                        """
                        INSERT INTO evaluations (
                            evaluation_id, active_defense, model_adapter,
                            attack_success_rate, benign_pass_rate, benign_approval_rate,
                            new_vulns_vs_baseline, trials_per_attack, created_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            evaluation_id,
                            s.get("active_defense"),
                            s.get("model_adapter"),
                            s.get("attack_success_rate"),
                            s.get("benign_pass_rate"),
                            s.get("benign_approval_rate"),
                            s.get("new_vulns_vs_baseline"),
                            s.get("trials_per_attack"),
                            ts,
                        ),
                    )
            conn.commit()

    def get_latest_evaluations(self) -> List[Dict[str, Any]]:
        """Returns the most recent evaluation run summaries."""
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT evaluation_id FROM evaluations ORDER BY id DESC LIMIT 1"
                )
                row = cur.fetchone()
                if not row:
                    return []
                latest_id = row[0]

                cur.execute(
                    """
                    SELECT active_defense, model_adapter, attack_success_rate,
                           benign_pass_rate, benign_approval_rate,
                           new_vulns_vs_baseline, trials_per_attack
                    FROM evaluations WHERE evaluation_id = %s ORDER BY id ASC
                    """,
                    (latest_id,),
                )
                cols = [
                    "active_defense", "model_adapter", "attack_success_rate",
                    "benign_pass_rate", "benign_approval_rate",
                    "new_vulns_vs_baseline", "trials_per_attack",
                ]
                return [dict(zip(cols, r)) for r in cur.fetchall()]


# Global database instance — raises clearly if DATABASE_URL is missing
db = DatabaseManager()
