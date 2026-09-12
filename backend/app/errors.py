from typing import Any

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class ApiError(HTTPException):
    def __init__(self, status_code: int, error: str, message: str, extra: dict[str, Any] | None = None):
        payload = {"error": error, "message": message}
        if extra:
            payload.update(extra)
        super().__init__(status_code=status_code, detail=payload)


def not_found(message: str, work_id: int) -> ApiError:
    return ApiError(404, "not_found", message, {"work_id": work_id})


async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "http_error", "message": str(exc.detail)},
    )


async def validation_exception_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    messages = []
    for err in exc.errors():
        loc = ".".join(str(part) for part in err.get("loc", []) if part != "query")
        messages.append(f"{loc}: {err.get('msg')}")
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "message": "; ".join(messages) or "Invalid query parameters",
            "details": exc.errors(),
        },
    )


async def unhandled_exception_handler(_request: Request, _exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"error": "internal_error", "message": "An unexpected error occurred"},
    )
