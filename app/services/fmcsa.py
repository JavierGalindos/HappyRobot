import httpx
from app.config import settings


FMCSA_BASE_URL = "https://mobile.fmcsa.dot.gov/qc/services/carriers"


async def _mock_verify(mc_number: str) -> dict:
    clean_mc = mc_number.strip().replace("MC", "").replace("-", "").replace(" ", "")
    if clean_mc.isdigit() and len(clean_mc) == 6:
        return {
            "legal_name": f"Mock Carrier {clean_mc}",
            "operating_status": "AUTHORIZED",
            "is_authorized": True,
            "safety_rating": "Satisfactory",
            "insurance_status": "Active",
            "message": "Carrier is authorized to operate. (mock)",
        }
    return {
        "legal_name": None,
        "operating_status": "NOT AUTHORIZED",
        "is_authorized": False,
        "safety_rating": None,
        "insurance_status": None,
        "message": "Invalid MC number. Must be 6 digits.",
    }


async def verify_carrier(mc_number: str) -> dict:
    clean_mc = mc_number.strip().upper().replace("MC", "").replace("-", "").strip()

    if not settings.fmcsa_api_key:
        return await _mock_verify(mc_number)

    url = f"{FMCSA_BASE_URL}/{clean_mc}"
    params = {"webKey": settings.fmcsa_api_key}

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, params=params)

    if resp.status_code != 200:
        return {
            "legal_name": None,
            "operating_status": None,
            "is_authorized": False,
            "safety_rating": None,
            "insurance_status": None,
            "message": f"FMCSA lookup failed (HTTP {resp.status_code})",
        }

    data = resp.json()
    content = data.get("content", [{}])
    carrier = content[0].get("carrier", {}) if content else {}

    operating_status = carrier.get("allowedToOperate", "N")
    is_authorized = operating_status == "Y"
    safety_rating = carrier.get("safetyRating", "Not Rated")
    legal_name = carrier.get("legalName", "Unknown")

    bipd_insurance = carrier.get("bipdInsuranceOnFile", 0)
    insurance_status = "Active" if bipd_insurance and int(bipd_insurance) > 0 else "None on file"

    message = "Carrier is authorized to operate." if is_authorized else "Carrier is NOT authorized to operate."

    return {
        "legal_name": legal_name,
        "operating_status": "AUTHORIZED" if is_authorized else "NOT AUTHORIZED",
        "is_authorized": is_authorized,
        "safety_rating": safety_rating,
        "insurance_status": insurance_status,
        "message": message,
    }
