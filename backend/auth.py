"""
Clerk JWT verification dependency for FastAPI.
Uses Clerk's JWKS endpoint to verify RS256 tokens.
"""
import os
import time
import httpx
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "")

# Derive the issuer from the secret key's "instance" portion.
# sk_test_<base64(instance_id)>  →  https://<instance_id>.clerk.accounts.dev
# For production (sk_live_...) Clerk uses a custom domain — we skip strict
# issuer validation in dev and just verify the signature + expiry.
_JWKS_URL = "https://api.clerk.com/v1/jwks"

_bearer = HTTPBearer(auto_error=False)

# Cache the JWK client so we're not fetching JWKS on every request
_jwks_client: PyJWKClient | None = None
_jwks_fetched_at: float = 0.0
_JWKS_TTL = 3600  # re-fetch JWKS after 1 hour


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client, _jwks_fetched_at
    now = time.time()
    if _jwks_client is None or (now - _jwks_fetched_at) > _JWKS_TTL:
        _jwks_client = PyJWKClient(_JWKS_URL)
        _jwks_fetched_at = now
    return _jwks_client


# ---------------------------------------------------------------------------
# Dependency
# ---------------------------------------------------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    """
    Validates the Clerk JWT in the Authorization header.
    Returns the Clerk user ID (sub claim) on success.
    Raises HTTP 401 on missing or invalid token.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    token = credentials.credentials

    try:
        client = _get_jwks_client()
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},  # Clerk doesn't always set "aud"
        )
        user_id: str = payload.get("sub", "")
        if not user_id:
            raise ValueError("Empty sub claim")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )
