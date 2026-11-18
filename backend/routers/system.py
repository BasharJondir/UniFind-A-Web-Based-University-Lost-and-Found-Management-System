"""
UniFind - System & Analytics Router
Provides system health status and dashboard metrics.
"""

from fastapi import APIRouter

try:
    from backend import crud
    from backend.models import StatsResponse
except ImportError:
    import crud
    from models import StatsResponse

router = APIRouter(tags=["System"])


@router.get("/api/health", summary="Health check endpoint")
def health() -> dict[str, str]:
    """Health check endpoint to verify backend service status."""
    return {"status": "ok", "service": "UniFind API"}


@router.get("/api/stats", response_model=StatsResponse, tags=["Dashboard"], summary="Get dashboard summary metrics")
def get_stats():
    """Get dashboard summary metrics (total, lost, found, returned counts)."""
    return crud.get_stats()
