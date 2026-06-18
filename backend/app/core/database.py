from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings


def _get_db_url(url: str) -> str:
    """Convert postgresql:// to postgresql+psycopg:// for psycopg3 driver.
    Also append sslmode=require if not already present — required on Render/cloud."""
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    if "sslmode" not in url:
        separator = "&" if "?" in url else "?"
        url = f"{url}{separator}sslmode=require"
    return url


engine = create_engine(
    _get_db_url(settings.DATABASE_URL),
    pool_pre_ping=True,
    pool_size=3,
    max_overflow=5,
    connect_args={"options": "-c timezone=Asia/Kolkata"},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
