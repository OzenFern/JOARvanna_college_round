"""API Endpoints for Campaigns"""

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
    from app.core.database import db
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
    exploit_rate = (successes / total) if total > 0 else 0.0
    results_dump = [r.model_dump() for r in results]
    
    data = {
        "campaign_id": campaign_id,
        "status": "completed",
        "active_defense": request.defense,
        "model_adapter": request.adapter,
        "total_attacks": total,
        "successful_exploits": successes,
        "exploit_rate": exploit_rate,
        "results": results_dump,
    }
    _CAMPAIGN_STORE[campaign_id] = data

    try:
        db.save_campaign(
            campaign_id=campaign_id,
            active_defense=request.defense,
            model_adapter=request.adapter,
            status="completed",
            total_attacks=total,
            successful_exploits=successes,
            exploit_rate=exploit_rate,
            results=results_dump,
        )
    except Exception:
        pass

    return data

@router.get("/{campaign_id}")
def get_campaign(campaign_id: str):
    from app.core.database import db
    if campaign_id in _CAMPAIGN_STORE:
        return _CAMPAIGN_STORE[campaign_id]

    try:
        record = db.get_campaign(campaign_id)
        if record:
            _CAMPAIGN_STORE[campaign_id] = record
            return record
    except Exception:
        pass

    raise HTTPException(status_code=404, detail="Campaign not found.")
