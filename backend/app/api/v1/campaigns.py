"""API Endpoints for Campaigns per PRD Section 12.4."""

import uuid
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.contracts import AttackResult
from app.redteam.runner import CampaignRunner

from fastapi import APIRouter, Header, HTTPException

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

class CampaignCreateRequest(BaseModel):
    attack_ids: Optional[List[str]] = None
    defense: str = "D0"
    adapter: str = "mock"
    trials: int = 1

_CAMPAIGN_STORE: Dict[str, dict] = {}

@router.post("")
def start_campaign(
    request: CampaignCreateRequest,
    x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key"),
):
    campaign_id = str(uuid.uuid4())
    runner = CampaignRunner(
        active_defense=request.defense,
        model_adapter_type=request.adapter,
        api_key=x_gemini_key,
    )
    results = runner.run_campaign(
        attack_ids=request.attack_ids,
        trials=request.trials,
    )
    
    total = len(results)
    successes = sum(1 for r in results if r.successes > 0)
    
    data = {
        "campaign_id": campaign_id,
        "status": "completed",
        "active_defense": request.defense,
        "model_adapter": request.adapter,
        "total_attacks": total,
        "successful_exploits": successes,
        "exploit_rate": (successes / total) if total > 0 else 0.0,
        "results": [r.model_dump() for r in results],
    }
    _CAMPAIGN_STORE[campaign_id] = data
    return data

@router.get("/{campaign_id}")
def get_campaign(campaign_id: str):
    if campaign_id not in _CAMPAIGN_STORE:
        raise HTTPException(status_code=404, detail="Campaign not found.")
    return _CAMPAIGN_STORE[campaign_id]
