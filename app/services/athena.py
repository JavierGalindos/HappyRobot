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
    sentiment_by_outcome: dict[str, dict[str, int]] = {}
    lane_counts: dict[str, int] = {}
    booked_route_counts: dict[tuple[str, str], int] = {}
    load_ids_booked: set[str] = set()
    neg_rounds: list[int] = []
    discounts: list[float] = []
    negotiation_details: list[dict] = []
    date_counts: dict[str, int] = {}
    date_outcome_counts: dict[str, dict[str, int]] = {}
    total_minutes = 0.0
    total_savings = 0.0
    cost_by_date: dict[str, float] = {}
    savings_by_date: dict[str, float] = {}

    today = datetime.now().date()
    week_start_str = (today - timedelta(days=today.weekday())).isoformat()

    cost_wtd = 0.0
    recent_bookings: list[dict] = []

    # Funnel counters
    funnel_authorized = 0
    funnel_matched = 0

    all_loads = load_loads_data()
    loads_by_id = {ld["load_id"]: ld for ld in all_loads}

    for log in logs:
        outcome = log.get("outcome", "unknown")
        outcome_counts[outcome] = outcome_counts.get(outcome, 0) + 1

        sentiment = log.get("carrier_sentiment", "unknown")
        sentiment_counts[sentiment] = sentiment_counts.get(sentiment, 0) + 1

        # Cross-tabulate sentiment × outcome
        if outcome not in sentiment_by_outcome:
            sentiment_by_outcome[outcome] = {}
        sentiment_by_outcome[outcome][sentiment] = sentiment_by_outcome[outcome].get(sentiment, 0) + 1

        # Funnel: anyone not "not_authorized" passed FMCSA check
        if outcome != "not_authorized":
            funnel_authorized += 1
        # Funnel: anyone not "not_authorized" and not "no_match" had a load matched
        if outcome not in ("not_authorized", "no_match"):
            funnel_matched += 1

        extracted = log.get("extracted_data", {}) or {}
        origin = extracted.get("origin", "")
        destination = extracted.get("destination", "")

        # Enrich from loads data if missing
        load_info = None
        if log.get("load_id"):
            load_info = loads_by_id.get(log["load_id"])
        if (not origin or not destination) and load_info:
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

        # Get loadboard_rate from extracted_data or from loads data
        loadboard = extracted.get("loadboard_rate")
        if not loadboard and load_info:
            loadboard = load_info.get("loadboard_rate")
        loadboard_f = float(loadboard) if loadboard else None

        if agreed_f is not None and loadboard_f and loadboard_f > 0:
            discount = (1 - agreed_f / loadboard_f) * 100
            discounts.append(discount)
            negotiation_details.append({
                "loadboard_rate": round(loadboard_f, 2),
                "agreed_price": round(agreed_f, 2),
            })

        duration = log.get("duration_minutes", 0) or 0
        total_minutes += float(duration)

        ts = log.get("timestamp", "")
        date_key = ts[:10] if len(ts) >= 10 else "unknown"
        date_counts[date_key] = date_counts.get(date_key, 0) + 1

        # Track outcome by date for stacked chart
        if date_key not in date_outcome_counts:
            date_outcome_counts[date_key] = {}
        date_outcome_counts[date_key][outcome] = date_outcome_counts[date_key].get(outcome, 0) + 1

        if outcome == "booked" and agreed_f is not None:
            cost_by_date[date_key] = cost_by_date.get(date_key, 0) + agreed_f
            if date_key >= week_start_str:
                cost_wtd += agreed_f

            # Savings = loadboard_rate - agreed_price (when we paid less)
            if loadboard_f and loadboard_f > agreed_f:
                saving = loadboard_f - agreed_f
                total_savings += saving
                savings_by_date[date_key] = savings_by_date.get(date_key, 0) + saving

    booked = outcome_counts.get("booked", 0)
    booking_rate = booked / total * 100

    # Build call funnel
    call_funnel = [
        {"stage": "Incoming", "count": total},
        {"stage": "Authorized", "count": funnel_authorized},
        {"stage": "Matched", "count": funnel_matched},
        {"stage": "Booked", "count": booked},
    ]

    top_lanes = sorted(lane_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    top_lanes_list = [{"lane": lane, "count": count} for lane, count in top_lanes]

    # Build stacked call volume (includes outcome breakdown per date)
    all_outcomes = sorted(outcome_counts.keys())
    call_volume_list = []
    for d in sorted(date_counts.keys()):
        entry: dict = {"date": d, "count": date_counts[d]}
        for oc in all_outcomes:
            entry[oc] = date_outcome_counts.get(d, {}).get(oc, 0)
        call_volume_list.append(entry)

    cost_over_time = sorted(cost_by_date.items())
    cost_over_time_list = [{"date": d, "cost": round(c, 2)} for d, c in cost_over_time]

    # Cumulative savings over time
    cumulative = 0.0
    savings_over_time_list = []
    for d in sorted(savings_by_date.keys()):
        cumulative += savings_by_date[d]
        savings_over_time_list.append({"date": d, "savings": round(cumulative, 2)})

    booked_routes_list = [
        {"origin": o, "destination": d, "count": c}
        for (o, d), c in sorted(booked_route_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    recent_bookings.sort(key=lambda x: x["timestamp"], reverse=True)
    recent_bookings_list = recent_bookings[:20]

    return {
        "total_calls": total,
        "total_bookings": booked,
        "total_minutes": round(total_minutes, 1),
        "total_savings": round(total_savings, 2),
        "cost_wtd": round(cost_wtd, 2),
        "calls_by_outcome": outcome_counts,
        "booking_rate": round(booking_rate, 1),
        "avg_negotiation_rounds": round(sum(neg_rounds) / len(neg_rounds), 1) if neg_rounds else 0.0,
        "avg_discount_pct": round(sum(discounts) / len(discounts), 1) if discounts else 0.0,
        "sentiment_distribution": sentiment_counts,
        "sentiment_by_outcome": sentiment_by_outcome,
        "call_funnel": call_funnel,
        "negotiation_details": negotiation_details,
        "top_lanes": top_lanes_list,
        "loads_utilization": {"total_loads": len(all_loads), "booked": len(load_ids_booked)},
        "call_volume_over_time": call_volume_list,
        "savings_over_time": savings_over_time_list,
        "cost_over_time": cost_over_time_list,
        "booked_routes": booked_routes_list,
        "recent_bookings": recent_bookings_list,
    }
