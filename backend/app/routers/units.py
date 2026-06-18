from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_owner
from app.models.owner import Owner
from app.schemas.unit import UpdateUnitRequest
from app.services import unit_service

router = APIRouter()


@router.get("/{unit_id}", response_model=dict)
def get_unit(
    unit_id: str,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    unit = unit_service.get_unit(db, current_owner, unit_id)
    return {"data": unit, "message": "OK"}


@router.patch("/{unit_id}", response_model=dict)
def update_unit(
    unit_id: str,
    payload: UpdateUnitRequest,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    unit = unit_service.update_unit(db, current_owner, unit_id, payload)
    return {"data": unit, "message": "Unit updated"}


@router.delete("/{unit_id}", response_model=dict)
def delete_unit(
    unit_id: str,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    unit_service.delete_unit(db, current_owner, unit_id)
    return {"data": None, "message": "Unit deleted"}
