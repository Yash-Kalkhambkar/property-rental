from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_tenant
from app.models.tenant import Tenant
from app.schemas.tenant_auth import TenantLoginRequest, TenantPasswordChangeRequest
from app.services import tenant_auth_service

router = APIRouter()


@router.post("/login", response_model=dict)
def tenant_login(
    payload: TenantLoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    token = tenant_auth_service.tenant_login(db, payload.email, payload.password, response)
    return {"data": token, "message": "Login successful"}


@router.post("/refresh", response_model=dict)
def tenant_refresh(request: Request, response: Response):
    token = tenant_auth_service.tenant_refresh(request, response)
    return {"data": token, "message": "Token refreshed"}


@router.post("/logout", response_model=dict)
def tenant_logout(response: Response):
    tenant_auth_service.tenant_logout(response)
    return {"data": None, "message": "Logged out"}


@router.get("/me", response_model=dict)
def tenant_me(current_tenant: Tenant = Depends(get_current_tenant)):
    profile = tenant_auth_service.get_tenant_profile(current_tenant)
    return {"data": profile, "message": "OK"}


@router.patch("/password", response_model=dict)
def tenant_change_password(
    payload: TenantPasswordChangeRequest,
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    tenant_auth_service.change_tenant_password(
        db, current_tenant, payload.current_password, payload.new_password
    )
    return {"data": None, "message": "Password updated"}
