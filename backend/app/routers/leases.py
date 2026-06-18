from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_owner
from app.models.owner import Owner
from app.schemas.lease import (
    CreateLeaseRequest,
    UpdateLeaseRequest,
    TerminateLeaseRequest,
)
from app.services import lease_service

router = APIRouter()


@router.get("/", response_model=dict)
def list_leases(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: str | None = None,
    expiring_in_days: int | None = None,
    unit_id: str | None = None,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    result = lease_service.list_leases(
        db, current_owner, page, limit, status, expiring_in_days, unit_id
    )
    return {"data": result, "message": "OK"}


@router.post("/", response_model=dict)
def create_lease(
    payload: CreateLeaseRequest,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    lease = lease_service.create_lease(db, current_owner, payload)
    return {"data": lease, "message": "Lease created"}


@router.get("/{lease_id}", response_model=dict)
def get_lease(
    lease_id: str,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    lease = lease_service.get_lease(db, current_owner, lease_id)
    return {"data": lease, "message": "OK"}


@router.patch("/{lease_id}", response_model=dict)
def update_lease(
    lease_id: str,
    payload: UpdateLeaseRequest,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    lease = lease_service.update_lease(db, current_owner, lease_id, payload)
    return {"data": lease, "message": "Lease updated"}


@router.patch("/{lease_id}/terminate", response_model=dict)
def terminate_lease(
    lease_id: str,
    payload: TerminateLeaseRequest,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    lease = lease_service.terminate_lease(db, current_owner, lease_id, payload)
    return {"data": lease, "message": "Lease terminated"}


@router.post("/{lease_id}/documents", response_model=dict)
async def upload_agreement(
    lease_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    result = await lease_service.upload_agreement(
        db, current_owner, lease_id, file
    )
    return {"data": result, "message": "Agreement uploaded"}


@router.get("/{lease_id}/documents", response_model=dict)
def get_document_url(
    lease_id: str,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    result = lease_service.get_document_url(db, current_owner, lease_id)
    return {"data": result, "message": "OK"}
