import uuid
from datetime import datetime, timezone

from fastapi import APIRouter

from app.models import CallLogRequest, CallLogResponse
from app.services.s3 import write_call_log

router = APIRouter(prefix="/api/calls", tags=["calls"])


@router.post("/log", response_model=CallLogResponse)
async def log_call(req: CallLogRequest):
    call_id = req.call_id or str(uuid.uuid4())
    timestamp = req.timestamp or datetime.now(timezone.utc).isoformat()

    log_data = req.model_dump()
    log_data["call_id"] = call_id
    log_data["timestamp"] = timestamp
    if log_data.get("extracted_data") is None:
        log_data["extracted_data"] = {}

    write_call_log(log_data)
    return CallLogResponse(call_id=call_id)
