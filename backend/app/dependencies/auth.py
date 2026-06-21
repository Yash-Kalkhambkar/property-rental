from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.owner import Owner
from app.models.tenant import Tenant

bearer_scheme = HTTPBearer()


def get_current_owner(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Owner:
    token = credentials.credentials
    user_id, role = decode_token(token, expected_type="access")

    if role != "OWNER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner access required",
        )

    owner = db.query(Owner).filter(Owner.id == user_id).first()
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Owner not found",
        )
    return owner


def get_current_tenant(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Tenant:
    token = credentials.credentials
    user_id, role = decode_token(token, expected_type="access")

    if role != "TENANT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant access required",
        )

    tenant = db.query(Tenant).filter(Tenant.id == user_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tenant not found",
        )
    return tenant
