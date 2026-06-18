from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_owner
from app.models.owner import Owner
from app.services import dashboard_service

router = APIRouter()


@router.get("/", response_model=dict)
def get_dashboard(
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner),
):
    dashboard = dashboard_service.get_dashboard(db, current_owner)
    return {"data": dashboard, "message": "OK"}
