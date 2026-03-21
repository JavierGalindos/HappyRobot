from fastapi import APIRouter

from app.models import CarrierVerifyRequest, CarrierVerifyResponse
from app.services.fmcsa import verify_carrier

router = APIRouter(prefix="/api/carrier", tags=["carrier"])


@router.post("/verify", response_model=CarrierVerifyResponse)
async def verify(req: CarrierVerifyRequest):
    result = await verify_carrier(req.mc_number)
    return CarrierVerifyResponse(mc_number=req.mc_number, **result)
