"""Aggregation of all API v1 routers per PRD Section 12.4."""

from fastapi import APIRouter
from app.api.v1.attacks import router as attacks_router
from app.api.v1.campaigns import router as campaigns_router
from app.api.v1.evaluations import router as evaluations_router
from app.api.v1.traces import router as traces_router
from app.core.config import settings

api_router = APIRouter()

api_router.include_router(evaluations_router)
api_router.include_router(attacks_router)
api_router.include_router(campaigns_router)
api_router.include_router(traces_router)

@api_router.get("/findings")
def get_findings():
    """Returns recent findings across campaigns or runs default demo attacks if none exist."""
    from app.api.v1.campaigns import _CAMPAIGN_STORE
    all_findings = []
    for campaign in _CAMPAIGN_STORE.values():
        all_findings.extend(campaign.get("results", []))
    if not all_findings:
        # Pre-seed with mock campaign if empty so UI has data on cold start
        from app.redteam.runner import CampaignRunner
        runner = CampaignRunner(active_defense="D0", model_adapter_type="mock")
        results = runner.run_campaign(attack_ids=["ATK-01", "ATK-02", "ATK-03", "ATK-04", "ATK-05"])
        all_findings = [r.model_dump() for r in results]
    return all_findings

@api_router.get("/policy")
def get_current_policy():
    """Returns current active policy configuration (read-only in MVP per PRD Section 11.1)."""
    return {
        "policy_id": "pol_default_v1",
        "name": "Standard Customer Support Guardrail Policy",
        "description": "Enforces thresholds, canary filtering, internal routing, and taint handling.",
        "refund_approval_threshold": settings.REFUND_APPROVAL_THRESHOLD,
        "refund_hard_limit": settings.REFUND_HARD_LIMIT,
        "tool_allowlist": [
            "lookup_order",
            "read_document",
            "memory_read",
            "memory_write",
            "send_email",
            "process_refund",
            "http_request",
        ],
        "canary_tokens": [
            "SSN-CANARY-9182",
            "API_KEY_CANARY_X9",
        ],
        "blocked_domains": [
            "evil.com",
            "malicious-exfil.org",
            "attacker-c2.net",
            "bad-actor.xyz",
        ],
    }

from app.agent.target_agent import DEFAULT_TOOLS
from app.evaluator.permission_audit import PermissionAuditor

@api_router.get("/audit/permissions")
def get_permission_audit():
    """Permission audit comparing declared vs used vs reachable permissions."""
    auditor = PermissionAuditor(declared_tools=DEFAULT_TOOLS)
    return [item.model_dump() for item in auditor.audit()]

@api_router.get("/backup/status")
def get_backup_status():
    """Returns database configuration and offline backup status."""
    from app.core.database import db
    backup_file = settings.SQLITE_BACKUP_PATH
    db_file = settings.DB_PATH
    return {
        "engine": "postgresql" if db.is_postgres else "sqlite",
        "is_postgres": db.is_postgres,
        "sqlite_db_exists": db_file.exists(),
        "sqlite_db_size_bytes": db_file.stat().st_size if db_file.exists() else 0,
        "backup_exists": backup_file.exists(),
        "backup_size_bytes": backup_file.stat().st_size if backup_file.exists() else 0,
        "backup_path": str(backup_file),
    }

@api_router.post("/backup/export")
def create_offline_backup():
    """Triggers an offline SQLite backup export for safe persistence."""
    from app.core.database import db
    backup_path = db.export_sqlite_backup()
    return {
        "status": "success",
        "backup_path": str(backup_path),
        "size_bytes": backup_path.stat().st_size if backup_path.exists() else 0,
    }
