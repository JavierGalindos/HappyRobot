import httpx
from app.config import settings


FMCSA_BASE_URL = "https://mobile.fmcsa.dot.gov/qc/services/carriers"


def _clean_mc_number(mc_number: str) -> str:
    return mc_number.strip().upper().replace("MC", "").replace("#", "").replace("-", "").replace(" ", "")


async def verify_carrier(mc_number: str) -> dict:
    clean_mc = _clean_mc_number(mc_number)

    url = f"{FMCSA_BASE_URL}/docket-number/{clean_mc}"
    params = {"webKey": settings.fmcsa_api_key}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
    except httpx.RequestError as e:
        return {
            "legal_name": None,
            "operating_status": None,
            "is_authorized": False,
            "safety_rating": None,
            "insurance_status": None,
            "message": f"FMCSA API unreachable: {e}",
        }

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
    content = data.get("content", [])

    if not content:
        return {
            "legal_name": None,
            "operating_status": "NOT FOUND",
            "is_authorized": False,
            "safety_rating": None,
            "insurance_status": None,
            "message": f"No carrier found for MC#{clean_mc}.",
        }

    carrier = content[0].get("carrier", {})

    allowed = carrier.get("allowedToOperate", "N")
    status_code = carrier.get("statusCode", "")
    is_authorized = allowed == "Y" and status_code == "A"

    safety_map = {"S": "Satisfactory", "C": "Conditional", "U": "Unsatisfactory"}
    safety_rating = safety_map.get(carrier.get("safetyRating"), "Not Rated")

    legal_name = carrier.get("legalName", "Unknown")

    bipd = carrier.get("bipdInsuranceOnFile")
    cargo = carrier.get("cargoInsuranceOnFile")
    has_insurance = (bipd and str(bipd) not in ("0", "None")) or (cargo and str(cargo) not in ("0", "None"))
    insurance_status = "Active" if has_insurance else "None on file"

    if is_authorized:
        message = f"Carrier '{legal_name}' is authorized to operate."
    elif allowed == "Y" and status_code != "A":
        message = f"Carrier '{legal_name}' has authority but status is inactive."
    else:
        message = f"Carrier '{legal_name}' is NOT authorized to operate."

    return {
        "legal_name": legal_name,
        "operating_status": "AUTHORIZED" if is_authorized else "NOT AUTHORIZED",
        "is_authorized": is_authorized,
        "safety_rating": safety_rating,
        "insurance_status": insurance_status,
        "message": message,
    }