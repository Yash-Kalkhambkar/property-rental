from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from fastapi import HTTPException, status

from app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: str, role: str) -> str:
    """Generate JWT access token with role claim.
    
    Args:
        user_id: The user's unique identifier (owner_id or tenant_id)
        role: The user's role ('OWNER' or 'TENANT')
    
    Returns:
        Encoded JWT access token string
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode(
        {"sub": user_id, "role": role, "exp": expire, "type": "access"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def create_refresh_token(user_id: str, role: str) -> str:
    """Generate JWT refresh token with role claim.
    
    Args:
        user_id: The user's unique identifier (owner_id or tenant_id)
        role: The user's role ('OWNER' or 'TENANT')
    
    Returns:
        Encoded JWT refresh token string
    """
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    return jwt.encode(
        {"sub": user_id, "role": role, "exp": expire, "type": "refresh"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_token(token: str, expected_type: str = "access") -> tuple[str, str]:
    """Decode JWT and return (user_id, role).
    
    Args:
        token: The JWT token string to decode
        expected_type: Expected token type ('access' or 'refresh')
    
    Returns:
        Tuple of (user_id, role) where role is 'OWNER' or 'TENANT'
    
    Raises:
        HTTPException: 401 if token is invalid, expired, or missing required claims
    """
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != expected_type:
            raise exc
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if not user_id or not role:
            raise exc
        return (user_id, role)
    except JWTError:
        raise exc
