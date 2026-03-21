import json
import os
from glob import glob as file_glob

from app.config import settings
from app.services.s3 import _get_s3_client, load_loads_data


def _load_s3_call_logs() -> list[dict]:
    s3 = _get_s3_client()
    logs = []
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=settings.s3_bucket, Prefix=settings.call_logs_prefix):
        for obj in page.get("Contents", []):
            if obj["Key"].endswith(".json"):
                resp = s3.get_object(Bucket=settings.s3_bucket, Key=obj["Key"])
                logs.append(json.loads(resp["Body"].read()))
    return logs


def _load_local_call_logs() -> list[dict]:
    logs_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "call_logs")
    if not os.path.exists(logs_dir):
        return []
    logs = []
    for path in file_glob(os.path.join(logs_dir, "**", "*.json"), recursive=True):
        with open(path) as f:
            logs.append(json.load(f))
    return logs


def get_metrics() -> dict:
    if settings.environment == "local":
        logs = _load_local_call_logs()
    else:
        logs = _load_s3_call_logs()
    return _compute_metrics_from_logs(logs)


def _compute_metrics_from_logs(logs: list[dict]) -> dict:
    total = len(logs)
    if total == 0:
        return {
            "total_calls": 0,
            "calls_by_outcome": {},
            "booking_rate": 0.0,
            "avg_negotiation_rounds": 0.0,
            "avg_discount_pct": 0.0,
            "sentiment_distribution": {},
            "top_lanes": [],
            "loads_utilization": {},
            "call_volume_over_time": [],
        }

    outcome_counts: dict[str, int] = {}
    sentiment_counts: dict[str, int] = {}
    lane_counts: dict[str, int] = {}
    load_ids_booked: set[str] = set()
    neg_rounds: list[int] = []
    discounts: list[float] = []
    date_counts: dict[str, int] = {}

    for log in logs:
        outcome = log.get("outcome", "unknown")
        outcome_counts[outcome] = outcome_counts.get(outcome, 0) + 1

        sentiment = log.get("carrier_sentiment", "unknown")
        sentiment_counts[sentiment] = sentiment_counts.get(sentiment, 0) + 1

        extracted = log.get("extracted_data", {}) or {}
        origin = extracted.get("origin", "")
        destination = extracted.get("destination", "")
        if origin and destination:
            lane = f"{origin} → {destination}"
            lane_counts[lane] = lane_counts.get(lane, 0) + 1

        if outcome == "booked":
            load_id = log.get("load_id")
            if load_id:
                load_ids_booked.add(load_id)

        rounds = log.get("negotiation_rounds", 0)
        if rounds > 0:
            neg_rounds.append(rounds)

        agreed = log.get("agreed_price")
        loadboard = extracted.get("loadboard_rate")
        if agreed and loadboard and float(loadboard) > 0:
            discount = (1 - float(agreed) / float(loadboard)) * 100
            discounts.append(discount)

        ts = log.get("timestamp", "")
        date_key = ts[:10] if len(ts) >= 10 else "unknown"
        date_counts[date_key] = date_counts.get(date_key, 0) + 1

    booked = outcome_counts.get("booked", 0)
    booking_rate = booked / total * 100

    top_lanes = sorted(lane_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    top_lanes_list = [{"lane": lane, "count": count} for lane, count in top_lanes]

    call_volume = sorted(date_counts.items())
    call_volume_list = [{"date": d, "count": c} for d, c in call_volume]

    return {
        "total_calls": total,
        "calls_by_outcome": outcome_counts,
        "booking_rate": round(booking_rate, 1),
        "avg_negotiation_rounds": round(sum(neg_rounds) / len(neg_rounds), 1) if neg_rounds else 0.0,
        "avg_discount_pct": round(sum(discounts) / len(discounts), 1) if discounts else 0.0,
        "sentiment_distribution": sentiment_counts,
        "top_lanes": top_lanes_list,
        "loads_utilization": {"total_loads": len(load_loads_data()), "booked": len(load_ids_booked)},
        "call_volume_over_time": call_volume_list,
    }
