from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.core.config import settings

# Routers
from app.routers import (
    auth,
    properties,
    units,
    tenants,
    leases,
    payments,
    dashboard,
    internal
)

limiter = Limiter(
    key_func=get_remote_address
)

def create_app():

    app = FastAPI(
        title="Property Rental Management API",
        version="1.0.0",
        docs_url="/docs"
        if settings.ENVIRONMENT == "development"
        else None,
        redoc_url=None
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            settings.FRONTEND_URL
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )

    app.state.limiter = limiter

    app.add_exception_handler(
        RateLimitExceeded,
        _rate_limit_exceeded_handler
    )

    prefix = "/api/v1"

    app.include_router(
        auth.router,
        prefix=f"{prefix}/auth"
    )

    app.include_router(
        properties.router,
        prefix=f"{prefix}/properties"
    )

    app.include_router(
        units.router,
        prefix=f"{prefix}/units"
    )

    app.include_router(
        tenants.router,
        prefix=f"{prefix}/tenants"
    )

    app.include_router(
        leases.router,
        prefix=f"{prefix}/leases"
    )

    app.include_router(
        payments.router,
        prefix=f"{prefix}/payments"
    )

    app.include_router(
        dashboard.router,
        prefix=f"{prefix}/dashboard"
    )

    app.include_router(
        internal.router,
        prefix=f"{prefix}/internal"
    )

    @app.get("/health")
    def health():
        return {
            "status": "ok"
        }

    return app

app = create_app()