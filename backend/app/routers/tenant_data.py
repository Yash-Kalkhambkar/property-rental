from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_tenant
from app.models.tenant import Tenant
from app.services.tenant_data_service import (
    get_tenant_dashboard,
    get_tenant_leases,
    get_tenant_payments,
    get_tenant_properties,
)

router = APIRouter()


@router.get("/leases", response_model=dict)
def list_tenant_leases(
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    data = get_tenant_leases(db, current_tenant.id)
    return {"data": data, "message": "OK"}


@router.get("/payments", response_model=dict)
def list_tenant_payments(
    status: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    data = get_tenant_payments(db, current_tenant.id, status_filter=status)
    return {"data": data, "message": "OK"}


@router.get("/properties", response_model=dict)
def list_tenant_properties(
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    data = get_tenant_properties(db, current_tenant.id)
    return {"data": data, "message": "OK"}


@router.get("/dashboard", response_model=dict)
def get_dashboard(
    db: Session = Depends(get_db),
    current_tenant: Tenant = Depends(get_current_tenant),
):
    data = get_tenant_dashboard(db, current_tenant.id)
    return {"data": data, "message": "OK"}
