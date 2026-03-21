from fastapi import APIRouter

from app.models import LoadSearchRequest, LoadSearchResponse, Load
from app.services.s3 import load_loads_data

router = APIRouter(prefix="/api/loads", tags=["loads"])


@router.post("/search", response_model=LoadSearchResponse)
async def search_loads(req: LoadSearchRequest):
    all_loads = load_loads_data()
    results = all_loads

    if req.origin:
        origin_lower = req.origin.lower()
        results = [l for l in results if origin_lower in l["origin"].lower()]

    if req.destination:
        dest_lower = req.destination.lower()
        results = [l for l in results if dest_lower in l["destination"].lower()]

    if req.equipment_type:
        equip_lower = req.equipment_type.lower()
        results = [l for l in results if equip_lower in l["equipment_type"].lower()]

    if req.pickup_date_start:
        results = [l for l in results if l["pickup_datetime"] >= req.pickup_date_start]

    if req.pickup_date_end:
        results = [l for l in results if l["pickup_datetime"] <= req.pickup_date_end]

    loads = [Load(**l) for l in results]
    return LoadSearchResponse(loads=loads, count=len(loads))
