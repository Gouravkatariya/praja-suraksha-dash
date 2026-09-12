from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.errors import http_exception_handler, unhandled_exception_handler, validation_exception_handler
from app.routers import health, risk_flags, works

settings = get_settings()

app = FastAPI(
    title="Praja Suraksha API",
    description="P0 FastAPI layer for SIH26102 MPLADS risk intelligence (frozen schema).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)

app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(health.router)
app.include_router(works.router)
app.include_router(risk_flags.router)
