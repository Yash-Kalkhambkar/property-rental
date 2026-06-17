from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def units_home():
    return {"message": "Units Router Working"}