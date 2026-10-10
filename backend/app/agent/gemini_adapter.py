"""Gemini Model Adapter for live model testing with sandboxed tools.

Features:
- Uses google-genai Client with Interactions API (gemini-3.8-flash)
- Accepts in-memory API key (per-request or environment)
- Translates declared sandbox tools into function definitions
- Returns ModelResponse with ToolProposal or final_answer
- Falls back safely to MockModelAdapter if no API key is provided or on network/API failure
- Zero key logging or persistence
"""

import json
import logging
from typing import Any, Dict, List, Optional
from app.agent.adapter_base import ModelAdapter, ModelResponse, ToolProposal
from app.agent.mock_adapter import MockModelAdapter
from app.tools.registry import TOOL_REGISTRY

logger = logging.getLogger(__name__)

class GeminiModelAdapter(ModelAdapter):
    """
    Adapter interfacing real Gemini models (gemini-3.8-flash) via google-genai SDK.
    Strictly keeps API keys in memory only.
    """

    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-3.8-flash"):
        self.api_key = api_key.strip() if api_key and api_key.strip() else None
        self.model = model
        self._fallback_adapter = MockModelAdapter()

    def generate_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        available_tools: List[str],
    ) -> ModelResponse:
        # If no key provided, seamlessly fall back to deterministic mock model
        if not self.api_key:
            return self._fallback_adapter.generate_response(
                system_prompt=system_prompt,
                messages=messages,
                available_tools=available_tools,
            )

        try:
            from google import genai

            client = genai.Client(api_key=self.api_key)

            # Build formatted dialogue prompt
            formatted_prompt = f"System Instructions:\n{system_prompt}\n\nAvailable Tools:\n"
            for t_name in available_tools:
                tool_func = TOOL_REGISTRY.get(t_name)
                desc = tool_func.__doc__ if tool_func and tool_func.__doc__ else ""
                formatted_prompt += f"- {t_name}: {desc.strip()}\n"

            formatted_prompt += (
                "\nINSTRUCTIONS FOR TOOL CALLING:\n"
                "If you wish to execute a tool, respond with a single JSON block:\n"
                '{"tool_name": "<name>", "arguments": {<args>}, "thought": "<reasoning>"}\n'
                "Otherwise, answer normally in plain text.\n\n"
                "Conversation History:\n"
            )

            for m in messages:
                role = m.get("role", "user")
                content = m.get("content", "")
                formatted_prompt += f"{role.upper()}: {content}\n"

            formatted_prompt += "\nASSISTANT:"

            interaction = client.interactions.create(
                model=self.model,
                input=formatted_prompt,
                store=False,  # Do not store interaction remotely
            )

            raw_text = interaction.output_text or ""

            # Check if Gemini output is a JSON tool call
            parsed_tool = self._extract_json_tool(raw_text)
            if parsed_tool and parsed_tool.get("tool_name") in available_tools:
                return ModelResponse(
                    raw_output=raw_text,
                    thought=parsed_tool.get("thought", "Gemini proposed tool call."),
                    tool_proposal=ToolProposal(
                        tool_name=parsed_tool["tool_name"],
                        arguments=parsed_tool.get("arguments", {}),
                    ),
                )

            return ModelResponse(
                raw_output=raw_text,
                thought="Gemini generated direct response.",
                final_answer=raw_text,
            )

        except Exception as e:
            logger.warning(f"Gemini API call failed or rate-limited: {e}. Falling back to mock adapter.")
            return self._fallback_adapter.generate_response(
                system_prompt=system_prompt,
                messages=messages,
                available_tools=available_tools,
            )

    def _extract_json_tool(self, text: str) -> Optional[Dict[str, Any]]:
        """Extracts JSON tool proposal from model generation if present."""
        clean = text.strip()
        if "```json" in clean:
            clean = clean.split("```json")[1].split("```")[0].strip()
        elif "```" in clean:
            clean = clean.split("```")[1].split("```")[0].strip()

        try:
            data = json.loads(clean)
            if isinstance(data, dict) and "tool_name" in data:
                return data
        except Exception:
            pass

        # Try regex search if enclosed in { ... }
        import re
        match = re.search(r"\{[\s\S]*\"tool_name\"[\s\S]*\}", text)
        if match:
            try:
                data = json.loads(match.group(0))
                if isinstance(data, dict) and "tool_name" in data:
                    return data
            except Exception:
                pass

        return None
