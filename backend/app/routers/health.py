from fastapi import APIRouter

from app.db import ping_database

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    connected = ping_database()
    return {
        "status": "ok" if connected else "degraded",
        "service": "praja-suraksha-api",
        "api_version": "v1",
        "database": "connected" if connected else "disconnected",
    }
