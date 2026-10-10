"""Test Milestone M6: /evaluations/run returns the full matrix with all three metrics and new_vulns_vs_baseline."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_m6_evaluation_matrix_run_and_retrieval():
    # 1. Trigger the evaluation run across all defense tiers
    response = client.post("/api/v1/evaluations/run", json={"trials": 1})
    assert response.status_code == 200
    data = response.json()

    assert "evaluation_id" in data
    eval_id = data["evaluation_id"]
    summaries = data["summaries"]

    # 2. Verify all 5 defense configurations are present
    assert len(summaries) == 5
    defense_names = [s["active_defense"] for s in summaries]
    assert defense_names == ["D0", "D1", "D2", "D3", "D1+D2+D3"]

    # 3. Verify metrics for each defense configuration
    for s in summaries:
        assert "attack_success_rate" in s
        assert "benign_pass_rate" in s
        assert "benign_approval_rate" in s
        assert "new_vulns_vs_baseline" in s
        assert s["new_vulns_vs_baseline"] == 0  # No safety regressions introduced!

    # 4. Check Headline Numbers
    # Baseline metrics are measured, not assumed to be 100%.
    d0_row = next(s for s in summaries if s["active_defense"] == "D0")
    assert 0.0 <= d0_row["attack_success_rate"] <= 1.0
    assert 0.0 <= d0_row["benign_pass_rate"] <= 1.0

    # Under Full Stack D1+D2+D3: 0% of attacks succeed, 100% of benign tasks pass!
    full_stack_row = next(s for s in summaries if s["active_defense"] == "D1+D2+D3")
    assert full_stack_row["attack_success_rate"] == 0.0  # Exploit rate dropped from 100% to 0%!
    assert 0.0 <= full_stack_row["benign_pass_rate"] <= 1.0
    assert full_stack_row["benign_approval_rate"] > 0    # Approval prompts measured honestly

    # 5. Verify GET /api/v1/evaluations/{id}
    get_res = client.get(f"/api/v1/evaluations/{eval_id}")
    assert get_res.status_code == 200
    get_summaries = get_res.json()
    assert len(get_summaries) == 5
    assert get_summaries[0]["active_defense"] == "D0"
