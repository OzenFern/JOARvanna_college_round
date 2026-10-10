"""Unit & Integration tests for GeminiModelAdapter and Key Handling per Milestone M9."""

import pytest
from app.agent.gemini_adapter import GeminiModelAdapter
from app.agent.target_agent import TargetAgent
from app.evaluator.tracer import TraceRecorder
from app.security.gateway import ToolGateway

def test_gemini_adapter_fallback_when_no_key():
    """Verify GeminiModelAdapter gracefully falls back to mock logic when key is omitted."""
    adapter = GeminiModelAdapter(api_key=None)
    messages = [{"role": "user", "content": "Please look up order ORD-1001"}]
    res = adapter.generate_response(
        system_prompt="Support assistant",
        messages=messages,
        available_tools=["lookup_order"],
    )
    assert res.tool_proposal is not None
    assert res.tool_proposal.tool_name == "lookup_order"
    assert res.tool_proposal.arguments == {"order_id": "ORD-1001"}

def test_gemini_adapter_fallback_on_invalid_key():
    """Verify GeminiModelAdapter gracefully catches errors and falls back rather than crashing."""
    adapter = GeminiModelAdapter(api_key="INVALID_TEST_KEY_FOR_MOCK_FALLBACK")
    messages = [{"role": "user", "content": "Please read document refund_policy.md"}]
    res = adapter.generate_response(
        system_prompt="Support assistant",
        messages=messages,
        available_tools=["read_document"],
    )
    # Even if google-genai fails with 400/403 or network issue, fallback returns safe response
    assert res.tool_proposal is not None
    assert res.tool_proposal.tool_name == "read_document"
    assert res.tool_proposal.arguments == {"doc_name": "refund_policy.md"}

def test_gemini_adapter_end_to_end_agent_run():
    """Verify TargetAgent runs safely end-to-end with GeminiModelAdapter in sandbox."""
    adapter = GeminiModelAdapter(api_key=None)
    agent = TargetAgent(model_adapter=adapter)
    tracer = TraceRecorder(active_defense="D0", model_adapter="gemini")
    gateway = ToolGateway(active_defense="D0")

    run_res = agent.run_task(
        task_prompt="Look up order ORD-1001",
        tracer=tracer,
        gateway=gateway,
    )
    assert run_res["status"] == "completed"
    assert len(tracer.steps) >= 3

def test_api_key_not_leaked_in_trace():
    """Verify PRD Rule 14.1.4: API key is never logged, stored, or echoed into trace steps."""
    secret_key = "AIzaSySecretFakeKey12345"
    adapter = GeminiModelAdapter(api_key=secret_key)
    agent = TargetAgent(model_adapter=adapter)
    tracer = TraceRecorder(active_defense="D0", model_adapter="gemini")
    gateway = ToolGateway(active_defense="D0")

    agent.run_task(
        task_prompt="Look up order ORD-1001",
        tracer=tracer,
        gateway=gateway,
    )
    saved_path = tracer.save()
    trace_json = saved_path.read_text(encoding="utf-8")
    assert secret_key not in trace_json
