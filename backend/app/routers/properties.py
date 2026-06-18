from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_owner
from app.models.owner import Owner
from app.schemas.property import CreatePropertyRequest, UpdatePropertyRequest
from app.schemas.unit import CreateUnitRequest
from app.services import property_service, unit_service

router = APIRouter()


@router.get("/", response_model=dict)
def list_properties(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    city: str | None = None,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    result = property_service.list_properties(db, current_owner, page, limit, city)
    return {"data": result, "message": "OK"}


@router.post("/", response_model=dict)
def create_property(
    payload: CreatePropertyRequest,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    prop = property_service.create_property(db, current_owner, payload)
    return {"data": prop, "message": "Property created"}


@router.get("/{property_id}", response_model=dict)
def get_property(
    property_id: str,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    prop = property_service.get_property(db, current_owner, property_id)
    return {"data": prop, "message": "OK"}


@router.patch("/{property_id}", response_model=dict)
def update_property(
    property_id: str,
    payload: UpdatePropertyRequest,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    prop = property_service.update_property(db, current_owner, property_id, payload)
    return {"data": prop, "message": "Property updated"}


@router.delete("/{property_id}", response_model=dict)
def delete_property(
    property_id: str,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    property_service.delete_property(db, current_owner, property_id)
    return {"data": None, "message": "Property deleted"}


# ── Units nested under properties ──


@router.get("/{property_id}/units", response_model=dict)
def list_units(
    property_id: str,
    status: str | None = None,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    units = unit_service.list_units(db, current_owner, property_id, status)
    return {"data": units, "message": "OK"}


@router.post("/{property_id}/units", response_model=dict)
def create_unit(
    property_id: str,
    payload: CreateUnitRequest,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    unit = unit_service.create_unit(db, current_owner, property_id, payload)
    return {"data": unit, "message": "Unit created"}
