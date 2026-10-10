"""Supabase JWT Authentication for AgentBreak Backend.

Provides FastAPI dependencies to verify Supabase JWT tokens in Authorization headers.
Falls back to legacy API key auth if Supabase is not configured.
"""

import os
from typing import Optional
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

security = HTTPBearer(auto_error=False)


def _get_jwt_secret() -> Optional[str]:
    """Get JWT secret from env or derive from Supabase service role key."""
    if settings.JWT_SECRET:
        return settings.JWT_SECRET
    # Supabase stores the JWT secret in the database; we can also set it via env.
    # For verification, we need the same secret that Supabase uses to sign tokens.
    return os.environ.get("SUPABASE_JWT_SECRET")


def _verify_jwt_token(token: str) -> dict:
    """Verify a JWT token and return its payload.
    
    Uses the JWT secret from Supabase settings.
    """
    try:
        import jwt
        secret = _get_jwt_secret()
        if not secret:
            # If no JWT secret is configured, try to parse without verification
            # This is a fallback for development only
            try:
                payload = jwt.decode(token, options={"verify_signature": False})
                return payload
            except jwt.PyJWTError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token format"
                )
        
        payload = jwt.decode(
            token,
            secret,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_exp": True}
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """FastAPI dependency to get the current authenticated user.
    
    Returns the user payload dict with at least {'sub': user_id, 'email': ...}.
    Returns None if no auth is configured (open access mode).
    """
    # If no auth is configured at all, allow open access
    has_supabase = bool(settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY)
    has_api_key = bool(settings.API_KEY)
    
    if not has_supabase and not has_api_key:
        # No auth configured — open access mode (local dev)
        return None
    
    if credentials is None:
        if has_supabase or has_api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        return None
    
    cred_value = credentials.credentials
    
    # Try Bearer token (Supabase JWT) first
    if has_supabase:
        try:
            payload = _verify_jwt_token(cred_value)
            user_id = payload.get("sub")
            email = payload.get("email")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: missing sub claim"
                )
            return {
                "sub": user_id,
                "email": email,
                "role": payload.get("role", "authenticated"),
                "email_confirmed_at": payload.get("email_confirmed_at"),
            }
        except HTTPException:
            raise
        except Exception:
            pass
    
    # Fallback to API key auth
    if has_api_key and cred_value == settings.API_KEY:
        return {
            "sub": "api-key-user",
            "email": None,
            "role": "authenticated",
        }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials"
    )


async def get_current_user_required(
    user: dict = Depends(get_current_user),
) -> dict:
    """FastAPI dependency that requires an authenticated user.
    
    Use this for protected endpoints that must have a valid user.
    """
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    return user
