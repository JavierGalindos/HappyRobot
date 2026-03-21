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

    log_data = {
        "call_id": call_id,
        "mc_number": req.mc_number,
        "carrier_name": req.carrier_name,
        "load_id": req.load_id,
        "outcome": req.outcome,
        "agreed_price": req.agreed_price,
        "carrier_sentiment": req.carrier_sentiment,
        "negotiation_rounds": req.negotiation_rounds,
        "extracted_data": req.extracted_data or {},
        "timestamp": timestamp,
    }

    write_call_log(log_data)
    return CallLogResponse(call_id=call_id)
