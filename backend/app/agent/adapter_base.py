"""Model Adapter Interface for pluggable LLM integrations."""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class ToolProposal(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]

class ModelResponse(BaseModel):
    raw_output: str
    thought: Optional[str] = None
    tool_proposal: Optional[ToolProposal] = None
    final_answer: Optional[str] = None

class ModelAdapter(ABC):
    @abstractmethod
    def generate_response(
        self,
        system_prompt: str,
        messages: List[Dict[str, str]],
        available_tools: List[str],
    ) -> ModelResponse:
        """Generates a structured model response or tool proposal."""
        pass
