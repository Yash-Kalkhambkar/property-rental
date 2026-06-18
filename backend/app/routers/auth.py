from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_owner
from app.models.owner import Owner
from app.schemas.auth import RegisterRequest, LoginRequest
from app.services import auth_service

router = APIRouter()


@router.post("/register", response_model=dict)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    owner = auth_service.register(db, payload)
    return {"data": owner, "message": "Account created successfully"}


@router.post("/login", response_model=dict)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    token = auth_service.login(db, payload, response)
    return {"data": token, "message": "Login successful"}


@router.post("/refresh", response_model=dict)
def refresh(request: Request, response: Response):
    token = auth_service.refresh(request, response)
    return {"data": token, "message": "Token refreshed"}


@router.post("/logout", response_model=dict)
def logout(response: Response):
    auth_service.logout(response)
    return {"data": None, "message": "Logged out"}


@router.get("/me", response_model=dict)
def me(current_owner: Owner = Depends(get_current_owner)):
    owner = auth_service.get_me(current_owner)
    return {"data": owner, "message": "OK"}
