import json
from datetime import datetime, timedelta

from app.config import settings
from app.models import MetricsResponse
from app.services.s3 import get_s3_client, load_loads_data


def _load_s3_call_logs() -> list[dict]:
    s3 = get_s3_client()
    logs = []
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=settings.s3_bucket, Prefix=settings.call_logs_prefix):
        for obj in page.get("Contents", []):
            if obj["Key"].endswith(".json"):
                resp = s3.get_object(Bucket=settings.s3_bucket, Key=obj["Key"])
                logs.append(json.loads(resp["Body"].read()))
    return logs


def get_metrics() -> dict:
    return _compute_metrics_from_logs(_load_s3_call_logs())


def _compute_metrics_from_logs(logs: list[dict]) -> dict:
    total = len(logs)
    if total == 0:
        return MetricsResponse().model_dump()

    outcome_counts: dict[str, int] = {}
    sentiment_counts: dict[str, int] = {}
    lane_counts: dict[str, int] = {}
    booked_route_counts: dict[tuple[str, str], int] = {}
    load_ids_booked: set[str] = set()
    neg_rounds: list[int] = []
    discounts: list[float] = []
    date_counts: dict[str, int] = {}
    total_minutes = 0.0
    cost_by_date: dict[str, float] = {}

    today = datetime.now().date()
    week_start_str = (today - timedelta(days=today.weekday())).isoformat()

    cost_wtd = 0.0
    recent_bookings: list[dict] = []

    all_loads = load_loads_data()
    loads_by_id = {ld["load_id"]: ld for ld in all_loads}

    for log in logs:
        outcome = log.get("outcome", "unknown")
        outcome_counts[outcome] = outcome_counts.get(outcome, 0) + 1

        sentiment = log.get("carrier_sentiment", "unknown")
        sentiment_counts[sentiment] = sentiment_counts.get(sentiment, 0) + 1

        extracted = log.get("extracted_data", {}) or {}
        origin = extracted.get("origin", "")
        destination = extracted.get("destination", "")

        # Enrich from loads data if missing
        if (not origin or not destination) and log.get("load_id"):
            load_info = loads_by_id.get(log["load_id"])
            if load_info:
                origin = origin or load_info.get("origin", "")
                destination = destination or load_info.get("destination", "")
        if origin and destination:
            lane = f"{origin} → {destination}"
            lane_counts[lane] = lane_counts.get(lane, 0) + 1

        if outcome == "booked":
            load_id = log.get("load_id")
            if load_id:
                load_ids_booked.add(load_id)
            if origin and destination:
                route_key = (origin, destination)
                booked_route_counts[route_key] = booked_route_counts.get(route_key, 0) + 1
            recent_bookings.append({
                "timestamp": log.get("timestamp", ""),
                "carrier_name": log.get("carrier_name", "Unknown"),
                "load_id": log.get("load_id", ""),
                "origin": origin,
                "destination": destination,
                "agreed_price": log.get("agreed_price"),
                "negotiation_rounds": log.get("negotiation_rounds", 0),
            })

        rounds = log.get("negotiation_rounds", 0)
        if rounds > 0:
            neg_rounds.append(rounds)

        agreed = log.get("agreed_price")
        agreed_f = float(agreed) if agreed else None
        loadboard = extracted.get("loadboard_rate")
        if agreed_f is not None and loadboard and float(loadboard) > 0:
            discount = (1 - agreed_f / float(loadboard)) * 100
            discounts.append(discount)

        duration = log.get("duration_minutes", 0) or 0
        total_minutes += float(duration)

        ts = log.get("timestamp", "")
        date_key = ts[:10] if len(ts) >= 10 else "unknown"
        date_counts[date_key] = date_counts.get(date_key, 0) + 1

        if outcome == "booked" and agreed_f is not None:
            cost_by_date[date_key] = cost_by_date.get(date_key, 0) + agreed_f
            if date_key >= week_start_str:
                cost_wtd += agreed_f

    booked = outcome_counts.get("booked", 0)
    booking_rate = booked / total * 100

    top_lanes = sorted(lane_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    top_lanes_list = [{"lane": lane, "count": count} for lane, count in top_lanes]

    call_volume = sorted(date_counts.items())
    call_volume_list = [{"date": d, "count": c} for d, c in call_volume]

    cost_over_time = sorted(cost_by_date.items())
    cost_over_time_list = [{"date": d, "cost": round(c, 2)} for d, c in cost_over_time]

    booked_routes_list = [
        {"origin": o, "destination": d, "count": c}
        for (o, d), c in sorted(booked_route_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    recent_bookings.sort(key=lambda x: x["timestamp"], reverse=True)
    recent_bookings_list = recent_bookings[:20]

    return {
        "total_calls": total,
        "total_minutes": round(total_minutes, 1),
        "cost_wtd": round(cost_wtd, 2),
        "calls_by_outcome": outcome_counts,
        "booking_rate": round(booking_rate, 1),
        "avg_negotiation_rounds": round(sum(neg_rounds) / len(neg_rounds), 1) if neg_rounds else 0.0,
        "avg_discount_pct": round(sum(discounts) / len(discounts), 1) if discounts else 0.0,
        "sentiment_distribution": sentiment_counts,
        "top_lanes": top_lanes_list,
        "loads_utilization": {"total_loads": len(all_loads), "booked": len(load_ids_booked)},
        "call_volume_over_time": call_volume_list,
        "cost_over_time": cost_over_time_list,
        "booked_routes": booked_routes_list,
        "recent_bookings": recent_bookings_list,
    }
