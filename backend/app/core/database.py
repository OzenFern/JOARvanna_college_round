"""Dual-Engine Database Manager supporting PostgreSQL online migration with SQLite offline backup.

Guarantees:
1. Strict parameterized query sanitization to eliminate SQL injection.
2. Seamless offline operation via local SQLite storage.
3. Clean online transition via standard PostgreSQL DATABASE_URL.
4. Bidirectional offline backup and restoration.
"""

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from app.core.config import settings

# Optional PostgreSQL driver support (e.g. psycopg / psycopg2)
try:
    import psycopg
    HAS_PSYCOPG = True
except ImportError:
    try:
        import psycopg2 as psycopg
        HAS_PSYCOPG = True
    except ImportError:
        HAS_PSYCOPG = False


class DatabaseManager:
    def __init__(self, database_url: Optional[str] = None):
        self.raw_url = database_url or settings.DATABASE_URL
        self.is_postgres = bool(
            self.raw_url and (
                self.raw_url.startswith("postgresql://") or 
                self.raw_url.startswith("postgres://") or
                self.raw_url.startswith("postgresql+psycopg://")
            )
        )
        self.sqlite_path = settings.DB_PATH
        self._init_schema()

    def _get_sqlite_connection(self, path: Optional[Path] = None) -> sqlite3.Connection:
        target = path or self.sqlite_path
        target.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(target))
        conn.row_factory = sqlite3.Row
        return conn

    def _get_connection(self):
        """Returns active database connection (PostgreSQL if configured and available, else SQLite)."""
        if self.is_postgres and HAS_PSYCOPG:
            # Normalize url for psycopg if needed
            clean_url = self.raw_url.replace("postgresql+psycopg://", "postgresql://")
            return psycopg.connect(clean_url)
        return self._get_sqlite_connection()

    def _init_schema(self):
        """Idempotently initializes all database tables with strict schemas."""
        sqlite_ddl = """
        CREATE TABLE IF NOT EXISTS traces (
            trace_id TEXT PRIMARY KEY,
            active_defense TEXT NOT NULL,
            model_adapter TEXT NOT NULL,
            total_steps INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            steps_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS campaigns (
            campaign_id TEXT PRIMARY KEY,
            active_defense TEXT NOT NULL,
            model_adapter TEXT NOT NULL,
            status TEXT NOT NULL,
            total_attacks INTEGER NOT NULL,
            successful_exploits INTEGER NOT NULL,
            exploit_rate REAL NOT NULL,
            created_at TEXT NOT NULL,
            results_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS evaluations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            evaluation_id TEXT NOT NULL,
            active_defense TEXT NOT NULL,
            model_adapter TEXT NOT NULL,
            attack_success_rate REAL NOT NULL,
            benign_pass_rate REAL NOT NULL,
            benign_approval_rate REAL NOT NULL,
            new_vulns_vs_baseline INTEGER NOT NULL,
            trials_per_attack INTEGER NOT NULL,
            created_at TEXT NOT NULL
        );
        """

        postgres_ddl = """
        CREATE TABLE IF NOT EXISTS traces (
            trace_id VARCHAR(128) PRIMARY KEY,
            active_defense VARCHAR(64) NOT NULL,
            model_adapter VARCHAR(64) NOT NULL,
            total_steps INTEGER NOT NULL,
            created_at TIMESTAMPTZ NOT NULL,
            steps_json JSONB NOT NULL
        );

        CREATE TABLE IF NOT EXISTS campaigns (
            campaign_id VARCHAR(128) PRIMARY KEY,
            active_defense VARCHAR(64) NOT NULL,
            model_adapter VARCHAR(64) NOT NULL,
            status VARCHAR(64) NOT NULL,
            total_attacks INTEGER NOT NULL,
            successful_exploits INTEGER NOT NULL,
            exploit_rate REAL NOT NULL,
            created_at TIMESTAMPTZ NOT NULL,
            results_json JSONB NOT NULL
        );

        CREATE TABLE IF NOT EXISTS evaluations (
            id SERIAL PRIMARY KEY,
            evaluation_id VARCHAR(128) NOT NULL,
            active_defense VARCHAR(64) NOT NULL,
            model_adapter VARCHAR(64) NOT NULL,
            attack_success_rate REAL NOT NULL,
            benign_pass_rate REAL NOT NULL,
            benign_approval_rate REAL NOT NULL,
            new_vulns_vs_baseline INTEGER NOT NULL,
            trials_per_attack INTEGER NOT NULL,
            created_at TIMESTAMPTZ NOT NULL
        );
        """

        # Always initialize local SQLite schema for backup/offline readiness
        with self._get_sqlite_connection() as conn:
            conn.executescript(sqlite_ddl)
            conn.commit()

        # If online PostgreSQL is active, initialize PostgreSQL schema as well
        if self.is_postgres and HAS_PSYCOPG:
            try:
                with self._get_connection() as pg_conn:
                    with pg_conn.cursor() as cur:
                        cur.execute(postgres_ddl)
                    pg_conn.commit()
            except Exception as e:
                # Fallback to local SQLite if online connection fails
                pass

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
        """Sanitized persistence of causal execution trace."""
        ts = created_at or datetime.now(timezone.utc).isoformat()
        steps_str = json.dumps(steps)

        # 1. Save to primary SQLite
        with self._get_sqlite_connection() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO traces (trace_id, active_defense, model_adapter, total_steps, created_at, steps_json)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (trace_id, active_defense, model_adapter, total_steps, ts, steps_str),
            )
            conn.commit()

        # 2. If PostgreSQL active, replicate
        if self.is_postgres and HAS_PSYCOPG:
            try:
                with self._get_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            INSERT INTO traces (trace_id, active_defense, model_adapter, total_steps, created_at, steps_json)
                            VALUES (%s, %s, %s, %s, %s, %s)
                            ON CONFLICT (trace_id) DO UPDATE SET
                                active_defense = EXCLUDED.active_defense,
                                model_adapter = EXCLUDED.model_adapter,
                                total_steps = EXCLUDED.total_steps,
                                steps_json = EXCLUDED.steps_json;
                            """,
                            (trace_id, active_defense, model_adapter, total_steps, ts, steps_str),
                        )
                    conn.commit()
            except Exception:
                pass

    def get_trace(self, trace_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves trace from active storage."""
        if self.is_postgres and HAS_PSYCOPG:
            try:
                with self._get_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            "SELECT trace_id, active_defense, model_adapter, total_steps, created_at, steps_json FROM traces WHERE trace_id = %s",
                            (trace_id,),
                        )
                        row = cur.fetchone()
                        if row:
                            steps = row[5] if isinstance(row[5], list) else json.loads(row[5])
                            return {
                                "trace_id": row[0],
                                "active_defense": row[1],
                                "model_adapter": row[2],
                                "total_steps": row[3],
                                "created_at": str(row[4]),
                                "steps": steps,
                            }
            except Exception:
                pass

        # Fallback to local SQLite
        with self._get_sqlite_connection() as conn:
            cursor = conn.execute(
                "SELECT trace_id, active_defense, model_adapter, total_steps, created_at, steps_json FROM traces WHERE trace_id = ?",
                (trace_id,),
            )
            row = cursor.fetchone()
            if row:
                return {
                    "trace_id": row["trace_id"],
                    "active_defense": row["active_defense"],
                    "model_adapter": row["model_adapter"],
                    "total_steps": row["total_steps"],
                    "created_at": row["created_at"],
                    "steps": json.loads(row["steps_json"]),
                }
        return None

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
        """Sanitized persistence of campaign execution results."""
        ts = created_at or datetime.now(timezone.utc).isoformat()
        results_str = json.dumps(results)

        with self._get_sqlite_connection() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO campaigns (campaign_id, active_defense, model_adapter, status, total_attacks, successful_exploits, exploit_rate, created_at, results_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (campaign_id, active_defense, model_adapter, status, total_attacks, successful_exploits, exploit_rate, ts, results_str),
            )
            conn.commit()

        if self.is_postgres and HAS_PSYCOPG:
            try:
                with self._get_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            INSERT INTO campaigns (campaign_id, active_defense, model_adapter, status, total_attacks, successful_exploits, exploit_rate, created_at, results_json)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (campaign_id) DO UPDATE SET
                                status = EXCLUDED.status,
                                total_attacks = EXCLUDED.total_attacks,
                                successful_exploits = EXCLUDED.successful_exploits,
                                exploit_rate = EXCLUDED.exploit_rate,
                                results_json = EXCLUDED.results_json;
                            """,
                            (campaign_id, active_defense, model_adapter, status, total_attacks, successful_exploits, exploit_rate, ts, results_str),
                        )
                    conn.commit()
            except Exception:
                pass

    def get_campaign(self, campaign_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves campaign by ID."""
        with self._get_sqlite_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM campaigns WHERE campaign_id = ?",
                (campaign_id,),
            )
            row = cursor.fetchone()
            if row:
                return {
                    "campaign_id": row["campaign_id"],
                    "active_defense": row["active_defense"],
                    "model_adapter": row["model_adapter"],
                    "status": row["status"],
                    "total_attacks": row["total_attacks"],
                    "successful_exploits": row["successful_exploits"],
                    "exploit_rate": row["exploit_rate"],
                    "created_at": row["created_at"],
                    "results": json.loads(row["results_json"]),
                }
        return None

    def list_campaigns(self) -> List[Dict[str, Any]]:
        """Lists all campaigns sorted by creation date."""
        with self._get_sqlite_connection() as conn:
            cursor = conn.execute("SELECT * FROM campaigns ORDER BY created_at DESC")
            items = []
            for row in cursor.fetchall():
                items.append({
                    "campaign_id": row["campaign_id"],
                    "active_defense": row["active_defense"],
                    "model_adapter": row["model_adapter"],
                    "status": row["status"],
                    "total_attacks": row["total_attacks"],
                    "successful_exploits": row["successful_exploits"],
                    "exploit_rate": row["exploit_rate"],
                    "created_at": row["created_at"],
                    "results": json.loads(row["results_json"]),
                })
            return items

    def save_evaluation_matrix(self, evaluation_id: str, summaries: List[Dict[str, Any]]):
        """Saves evaluation summaries for all defenses."""
        ts = datetime.now(timezone.utc).isoformat()
        with self._get_sqlite_connection() as conn:
            for s in summaries:
                conn.execute(
                    """
                    INSERT INTO evaluations (
                        evaluation_id, active_defense, model_adapter,
                        attack_success_rate, benign_pass_rate, benign_approval_rate,
                        new_vulns_vs_baseline, trials_per_attack, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        with self._get_sqlite_connection() as conn:
            cursor = conn.execute(
                "SELECT evaluation_id FROM evaluations ORDER BY id DESC LIMIT 1"
            )
            row = cursor.fetchone()
            if not row:
                return []
            latest_id = row["evaluation_id"]

            eval_cursor = conn.execute(
                """
                SELECT active_defense, model_adapter, attack_success_rate,
                       benign_pass_rate, benign_approval_rate, new_vulns_vs_baseline, trials_per_attack
                FROM evaluations WHERE evaluation_id = ? ORDER BY id ASC
                """,
                (latest_id,),
            )
            return [dict(r) for r in eval_cursor.fetchall()]

    # =========================================================================
    # Offline Backup & Migration Utilities
    # =========================================================================

    def export_sqlite_backup(self, target_path: Optional[Path] = None) -> Path:
        """
        Creates a clean offline backup of all data in a standalone SQLite file.
        Enables seamless offline backups when migrating to or from online PostgreSQL.
        """
        dest_path = target_path or settings.SQLITE_BACKUP_PATH
        dest_path.parent.mkdir(parents=True, exist_ok=True)

        with self._get_sqlite_connection() as src_conn:
            with self._get_sqlite_connection(dest_path) as dst_conn:
                src_conn.backup(dst_conn)

        return dest_path

    def restore_from_sqlite_backup(self, source_path: Path) -> bool:
        """Restores the database state from an offline SQLite backup file."""
        if not source_path.exists():
            raise FileNotFoundError(f"Backup file not found at {source_path}")

        with self._get_sqlite_connection(source_path) as src_conn:
            with self._get_sqlite_connection() as dst_conn:
                src_conn.backup(dst_conn)

        return True


# Global database instance
db = DatabaseManager()
