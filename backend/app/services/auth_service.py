from fastapi import HTTPException, Response, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.owner import Owner
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    OwnerResponse,
)


def register(db: Session, payload: RegisterRequest) -> OwnerResponse:
    """Register a new owner account."""
    existing = db.query(Owner).filter(Owner.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    owner = Owner(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)

    return _owner_to_response(owner)


def login(
    db: Session, payload: LoginRequest, response: Response
) -> TokenResponse:
    """Authenticate owner, return access token and set refresh cookie."""
    owner = db.query(Owner).filter(Owner.email == payload.email).first()
    if not owner or not verify_password(payload.password, owner.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(owner.id, role="OWNER")
    refresh_token = create_refresh_token(owner.id, role="OWNER")

    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/v1/auth/refresh",
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def refresh(request: Request, response: Response) -> TokenResponse:
    """Read httpOnly cookie, issue new access token."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
        )

    owner_id, _role = decode_token(refresh_token, expected_type="refresh")

    new_access_token = create_access_token(owner_id, role="OWNER")
    new_refresh_token = create_refresh_token(owner_id, role="OWNER")

    # Rotate refresh token
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/v1/auth/refresh",
    )

    return TokenResponse(
        access_token=new_access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def logout(response: Response) -> None:
    """Clear the refresh token cookie."""
    response.delete_cookie(
        key="refresh_token",
        path="/api/v1/auth/refresh",
    )


def get_me(owner: Owner) -> OwnerResponse:
    """Return the current owner's profile."""
    return _owner_to_response(owner)


def _owner_to_response(owner: Owner) -> OwnerResponse:
    return OwnerResponse(
        id=owner.id,
        email=owner.email,
        full_name=owner.full_name,
        phone=owner.phone,
        created_at=owner.created_at.isoformat() if owner.created_at else "",
    )
