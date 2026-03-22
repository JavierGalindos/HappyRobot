import json
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

from app.config import settings

_s3_client = None
_loads_cache: list[dict] | None = None


def get_s3_client():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client("s3")
    return _s3_client


def load_loads_data() -> list[dict]:
    global _loads_cache
    if _loads_cache is not None:
        return _loads_cache

    s3 = get_s3_client()
    resp = s3.get_object(Bucket=settings.s3_bucket, Key=settings.loads_s3_key)
    _loads_cache = json.loads(resp["Body"].read())
    return _loads_cache


def write_call_log(call_log: dict) -> str:
    now = datetime.now(timezone.utc)
    date_partition = now.strftime("year=%Y/month=%m/day=%d")
    call_id = call_log.get("call_id", now.strftime("%Y%m%d%H%M%S"))
    key = f"{settings.call_logs_prefix}{date_partition}/{call_id}.json"

    s3 = get_s3_client()
    s3.put_object(
        Bucket=settings.s3_bucket,
        Key=key,
        Body=json.dumps(call_log),
        ContentType="application/json",
    )
    return call_id


def book_load(load_id: str, call_id: str, agreed_price: float) -> bool:
    """Atomically book a load. Returns True if successful, False if already booked."""
    booking = {
        "load_id": load_id,
        "call_id": call_id,
        "agreed_price": agreed_price,
        "booked_at": datetime.now(timezone.utc).isoformat(),
    }
    key = f"{settings.booked_loads_prefix}{load_id}.json"

    s3 = get_s3_client()
    try:
        s3.put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=json.dumps(booking),
            ContentType="application/json",
            IfNoneMatch="*",
        )
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] == "PreconditionFailed":
            return False
        raise


def get_booked_load_ids() -> set[str]:
    """Return set of load IDs that have been booked."""
    s3 = get_s3_client()
    booked = set()
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=settings.s3_bucket, Prefix=settings.booked_loads_prefix):
        for obj in page.get("Contents", []):
            load_id = obj["Key"].removeprefix(settings.booked_loads_prefix).removesuffix(".json")
            booked.add(load_id)
    return booked
