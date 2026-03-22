from fastapi import APIRouter, HTTPException

from app.models import NegotiateRequest, NegotiateResponse
from app.services.negotiation import evaluate_offer
from app.services.s3 import load_loads_data, book_load

router = APIRouter(prefix="/api", tags=["negotiate"])


@router.post("/negotiate", response_model=NegotiateResponse)
async def negotiate(req: NegotiateRequest):
    if req.round < 1 or req.round > 3:
        raise HTTPException(status_code=400, detail="Round must be between 1 and 3")

    all_loads = load_loads_data()
    load = next((l for l in all_loads if l["load_id"] == req.load_id), None)
    if not load:
        raise HTTPException(status_code=404, detail=f"Load {req.load_id} not found")

    result = evaluate_offer(load["loadboard_rate"], req.carrier_offer, req.round)

    if result["decision"] == "accept":
        agreed_price = req.carrier_offer
        if not book_load(req.load_id, call_id=f"negotiate-{req.load_id}", agreed_price=agreed_price):
            result = {
                "decision": "reject",
                "counter_offer": None,
                "message": "Sorry, this load was just booked by another carrier. Let me find you another option.",
            }

    return NegotiateResponse(
        load_id=req.load_id,
        round=req.round,
        carrier_offer=req.carrier_offer,
        **result,
    )
