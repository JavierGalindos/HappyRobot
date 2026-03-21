from fastapi import APIRouter

from app.models import MetricsResponse
from app.services.athena import get_metrics

router = APIRouter(prefix="/api", tags=["metrics"])


@router.get("/metrics", response_model=MetricsResponse)
async def metrics():
    data = get_metrics()
    return MetricsResponse(**data)
