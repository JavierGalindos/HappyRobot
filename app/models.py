from pydantic import BaseModel


# --- Carrier Verification ---

class CarrierVerifyRequest(BaseModel):
    mc_number: str


class CarrierVerifyResponse(BaseModel):
    mc_number: str
    legal_name: str | None = None
    operating_status: str | None = None
    is_authorized: bool = False
    safety_rating: str | None = None
    insurance_status: str | None = None
    message: str = ""


# --- Load Search ---

class LoadSearchRequest(BaseModel):
    origin: str | None = None
    destination: str | None = None
    equipment_type: str | None = None
    pickup_date_start: str | None = None
    pickup_date_end: str | None = None


class Load(BaseModel):
    load_id: str
    origin: str
    destination: str
    pickup_datetime: str
    delivery_datetime: str
    equipment_type: str
    loadboard_rate: float
    weight: int
    commodity_type: str
    num_of_pieces: int
    miles: int
    dimensions: str
    notes: str


class LoadSearchResponse(BaseModel):
    loads: list[Load]
    count: int


# --- Negotiation ---

class NegotiateRequest(BaseModel):
    load_id: str
    carrier_offer: float
    round: int = 1


class NegotiateResponse(BaseModel):
    load_id: str
    round: int
    carrier_offer: float
    decision: str  # "accept", "counter", "reject"
    counter_offer: float | None = None
    message: str = ""


# --- Call Logging ---

class CallLogRequest(BaseModel):
    call_id: str | None = None
    mc_number: str
    carrier_name: str | None = None
    load_id: str | None = None
    outcome: str  # "booked", "rejected", "no_match", "no_agreement", "not_authorized"
    agreed_price: float | None = None
    carrier_sentiment: str | None = None  # "positive", "neutral", "negative"
    negotiation_rounds: int = 0
    duration_minutes: float | None = None
    extracted_data: dict | None = None
    timestamp: str | None = None


class CallLogResponse(BaseModel):
    call_id: str
    message: str = "Call logged successfully"


# --- Metrics ---

class MetricsResponse(BaseModel):
    total_calls: int = 0
    total_minutes: float = 0.0
    cost_wtd: float = 0.0
    calls_by_outcome: dict = {}
    booking_rate: float = 0.0
    avg_negotiation_rounds: float = 0.0
    avg_discount_pct: float = 0.0
    sentiment_distribution: dict = {}
    top_lanes: list[dict] = []
    loads_utilization: dict = {}
    call_volume_over_time: list[dict] = []
    cost_over_time: list[dict] = []
    booked_routes: list[dict] = []
    recent_bookings: list[dict] = []
