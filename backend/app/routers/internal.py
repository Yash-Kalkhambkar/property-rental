from fastapi import APIRouter, Header, HTTPException

from app.core.config import settings
from app.tasks.scheduler import run_daily_job

router = APIRouter(include_in_schema=False)


@router.post("/daily-job")
def trigger_daily_job(x_internal_secret: str = Header(...)):
    """Triggered by external cron. Protected by shared secret."""
    if x_internal_secret != settings.INTERNAL_JOB_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    result = run_daily_job()
    return {"message": "Daily job completed", "result": result}
