from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_owner
from app.models.owner import Owner
from app.schemas.tenant import CreateTenantRequest, UpdateTenantRequest
from app.services import tenant_service

router = APIRouter()


@router.get("/", response_model=dict)
def list_tenants(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = None,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    result = tenant_service.list_tenants(db, current_owner, page, limit, search)
    return {"data": result, "message": "OK"}


@router.post("/", response_model=dict)
def create_tenant(
    payload: CreateTenantRequest,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    tenant = tenant_service.create_tenant(db, current_owner, payload)
    return {"data": tenant, "message": "Tenant created"}


@router.get("/{tenant_id}", response_model=dict)
def get_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    tenant = tenant_service.get_tenant(db, current_owner, tenant_id)
    return {"data": tenant, "message": "OK"}


@router.patch("/{tenant_id}", response_model=dict)
def update_tenant(
    tenant_id: str,
    payload: UpdateTenantRequest,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    tenant = tenant_service.update_tenant(db, current_owner, tenant_id, payload)
    return {"data": tenant, "message": "Tenant updated"}


@router.delete("/{tenant_id}", response_model=dict)
def delete_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    tenant_service.delete_tenant(db, current_owner, tenant_id)
    return {"data": None, "message": "Tenant deleted"}


@router.post("/{tenant_id}/documents", response_model=dict)
async def upload_document(
    tenant_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    result = await tenant_service.upload_document(
        db, current_owner, tenant_id, file
    )
    return {"data": result, "message": "Document uploaded"}
