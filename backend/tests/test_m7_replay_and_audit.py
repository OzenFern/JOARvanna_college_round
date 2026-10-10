"""Test Milestone M7: Exact replay with zero model calls and permission audit."""

from fastapi.testclient import TestClient
from app.agent.target_agent import DEFAULT_TOOLS
from app.evaluator.permission_audit import PermissionAuditor
from app.evaluator.replay import ExactReplayEngine
from app.evaluator.tracer import TraceRecorder
from app.main import app
from app.redteam.catalog import ATTACK_LIBRARY
from app.redteam.runner import CampaignRunner
from app.tools.registry import reset_mock_state

client = TestClient(app)

def test_m7_exact_replay_zero_model_calls():
    """Verify that a saved attack trace replays with zero model calls and identical results."""
    reset_mock_state()

    # 1. Run ATK-02 under D0 baseline
    runner = CampaignRunner(active_defense="D0", model_adapter_type="mock")
    atk_02 = ATTACK_LIBRARY["ATK-02"]
    attack_res = runner.run_single_attack(atk_02, trials=1)

    assert attack_res.successes == 1
    orig_trace_id = attack_res.trace_ids[0]

    # 2. Replay the saved trace under D0 using ExactReplayEngine
    replay_res = ExactReplayEngine.replay_trace(orig_trace_id)

    assert replay_res["status"] == "success"
    assert replay_res["model_calls_made"] == 0  # Zero model calls!
    assert replay_res["verdict"]["success"] is True  # Identical exploit outcome reproduced!
    assert "INV-02" in replay_res["verdict"]["violated_invariants"]

    # 3. Test API Endpoint POST /api/v1/traces/{trace_id}/replay
    api_res = client.post(f"/api/v1/traces/{orig_trace_id}/replay")
    assert api_res.status_code == 200
    api_data = api_res.json()
    assert api_data["model_calls_made"] == 0
    assert api_data["verdict"]["success"] is True

def test_m7_replay_against_defense_blocks_exploit():
    """Replaying the same trace against D1+D2+D3 blocks the exploit with zero model calls."""
    reset_mock_state()

    # 1. Run ATK-03 (canary leak) under D0
    runner = CampaignRunner(active_defense="D0", model_adapter_type="mock")
    atk_03 = ATTACK_LIBRARY["ATK-03"]
    attack_res = runner.run_single_attack(atk_03, trials=1)
    orig_trace_id = attack_res.trace_ids[0]

    # 2. Replay against D1+D2+D3
    replay_defended = ExactReplayEngine.replay_trace(
        original_trace_id=orig_trace_id,
        target_defense="D1+D2+D3",
    )

    assert replay_defended["status"] == "success"
    assert replay_defended["model_calls_made"] == 0
    # The exploit is now blocked!
    assert replay_defended["verdict"]["success"] is False
    assert len(replay_defended["verdict"]["violated_invariants"]) == 0

def test_m7_permission_audit_flags_over_permissioned():
    """Verify that PermissionAuditor correctly identifies over-permissioned tools."""
    auditor = PermissionAuditor(declared_tools=DEFAULT_TOOLS)
    report = auditor.audit()

    # Convert to lookup by tool name
    by_tool = {item.tool_name: item for item in report}

    # http_request: declared, but zero benign tasks need raw outbound HTTP -> over-permissioned!
    assert by_tool["http_request"].over_permissioned is True

    # Undeclared registry tools are not reachable from this agent context.
    assert "execute_shell" not in by_tool

    # lookup_order, process_refund, send_email: needed by benign tasks -> NOT over-permissioned
    assert by_tool["lookup_order"].over_permissioned is False
    assert by_tool["process_refund"].over_permissioned is False
    assert by_tool["send_email"].over_permissioned is False

    # Check API endpoint GET /api/v1/audit/permissions
    res = client.get("/api/v1/audit/permissions")
    assert res.status_code == 200
    api_items = res.json()
    api_by_tool = {i["tool_name"]: i for i in api_items}
    assert api_by_tool["http_request"]["over_permissioned"] is True
    assert "execute_shell" not in api_by_tool
