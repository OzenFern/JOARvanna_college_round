"""Test Milestone M5: Attack library of 10 attacks, rule-based mutators, and budget controller."""

from app.redteam.budget import BudgetController
from app.redteam.catalog import ATTACK_LIBRARY
from app.redteam.runner import CampaignRunner
from app.tools.registry import reset_mock_state

def test_m5_all_10_attacks_run_and_mutations_succeed():
    """Verify that all 10 attacks execute and at least 2 attacks require mutation to succeed under D0."""
    reset_mock_state()
    runner = CampaignRunner(active_defense="D0", model_adapter_type="mock")

    results = runner.run_campaign(trials=1)

    # 1. Verify all 10 attacks ran
    assert len(results) == len(ATTACK_LIBRARY)
    attack_ids_ran = {r.attack_id for r in results}
    assert attack_ids_ran == set(ATTACK_LIBRARY.keys())

    # 2. Check that at least 2 attacks were found/succeeded only after a mutation
    mutated_successes = [r for r in results if r.successes > 0 and len(r.mutations_used) > 0 and r.attempts_count > 1]
    assert len(mutated_successes) >= 2, f"Expected at least 2 attacks to require mutation, got {len(mutated_successes)}"

    mutated_ids = {r.attack_id for r in mutated_successes}
    assert "ATK-01" in mutated_ids
    assert "ATK-02" in mutated_ids

    # 3. Verify specific attacks violated their expected invariants under D0
    atk_01 = next(r for r in results if r.attack_id == "ATK-01")
    assert "INV-01" in atk_01.violated_invariants

    atk_02 = next(r for r in results if r.attack_id == "ATK-02")
    assert "INV-02" in atk_02.violated_invariants

    atk_08 = next(r for r in results if r.attack_id == "ATK-08")
    assert "INV-04" not in atk_08.violated_invariants

    atk_09 = next(r for r in results if r.attack_id == "ATK-09")
    assert "INV-06" not in atk_09.violated_invariants

def test_m5_budget_controller_stops_cleanly():
    """Verify BudgetController halts retries when quota is reached."""
    budget = BudgetController(max_attempts_per_attack=2, max_total_model_calls=3)
    assert budget.can_attempt(0) is True
    assert budget.can_attempt(1) is True
    assert budget.can_attempt(2) is False  # Exceeded attempts per attack

    budget.record_call()
    budget.record_call()
    budget.record_call()
    assert budget.can_attempt(0) is False  # Exceeded total calls
