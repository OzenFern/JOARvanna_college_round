"""API Endpoints for Red Team Attack Catalog."""

from typing import List
from fastapi import APIRouter
from app.redteam.catalog import ATTACK_LIBRARY, AttackDefinition

router = APIRouter(prefix="/attacks", tags=["attacks"])

@router.get("", response_model=List[AttackDefinition])
def list_attacks():
    """Lists the 10 pre-configured red-team attacks in the catalog."""
    return list(ATTACK_LIBRARY.values())
