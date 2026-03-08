"""
Clerk JWT verification dependency for FastAPI.
Derives the JWKS URL from the Clerk Publishable Key automatically.
"""
import os
import base64
import time
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# ---------------------------------------------------------------------------
# Derive JWKS URL from the Clerk Publishable Key
# Format:  pk_test_<base64(frontend_api_domain$)>
#          pk_live_<base64(frontend_api_domain$)>
# ---------------------------------------------------------------------------
def _jwks_url_from_publishable_key(pub_key: str) -> str:
    try:
        # Strip prefix: pk_test_ or pk_live_
        b64 = pub_key.split("_", 2)[-1]
        # Add padding to make it valid base64
        b64 += "=" * (-len(b64) % 4)
        frontend_api = base64.b64decode(b64).decode("utf-8").rstrip("$")
        return f"https://{frontend_api}/.well-known/jwks.json"
    except Exception:
        return "https://clerk.com/.well-known/jwks.json"  # safe fallback


_PUB_KEY = os.getenv("CLERK_PUBLISHABLE_KEY", "")
_JWKS_URL = _jwks_url_from_publishable_key(_PUB_KEY) if _PUB_KEY else os.getenv("CLERK_JWKS_URL", "")

print(f"INFO:     Clerk JWKS URL: {_JWKS_URL}")

_bearer = HTTPBearer(auto_error=False)

# Cache the JWKS client (re-fetch after 1 hour)
_jwks_client: PyJWKClient | None = None
_jwks_fetched_at: float = 0.0
_JWKS_TTL = 3600


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client, _jwks_fetched_at
    now = time.time()
    if _jwks_client is None or (now - _jwks_fetched_at) > _JWKS_TTL:
        _jwks_client = PyJWKClient(_JWKS_URL)
        _jwks_fetched_at = now
    return _jwks_client


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------
def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    """
    Validates the Clerk JWT in the Authorization header.
    Returns the Clerk user ID (sub claim) on success, raises HTTP 401 otherwise.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
        )

    token = credentials.credentials

    try:
        client = _get_jwks_client()
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        user_id: str = payload.get("sub", "")
        if not user_id:
            raise ValueError("Empty sub claim in token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )
