import json
import os
from datetime import datetime, timezone

import boto3

from app.config import settings

_s3_client = None
_loads_cache: list[dict] | None = None


def _get_s3_client():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client("s3")
    return _s3_client


def load_loads_data() -> list[dict]:
    global _loads_cache
    if _loads_cache is not None:
        return _loads_cache

    if settings.environment == "local":
        local_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "loads.json")
        with open(local_path) as f:
            _loads_cache = json.load(f)
    else:
        s3 = _get_s3_client()
        resp = s3.get_object(Bucket=settings.s3_bucket, Key=settings.loads_s3_key)
        _loads_cache = json.loads(resp["Body"].read())

    return _loads_cache


def write_call_log(call_log: dict) -> str:
    now = datetime.now(timezone.utc)
    date_partition = now.strftime("year=%Y/month=%m/day=%d")
    call_id = call_log.get("call_id", now.strftime("%Y%m%d%H%M%S"))
    key = f"{settings.call_logs_prefix}{date_partition}/{call_id}.json"

    if settings.environment == "local":
        local_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "call_logs", date_partition)
        os.makedirs(local_dir, exist_ok=True)
        local_path = os.path.join(local_dir, f"{call_id}.json")
        with open(local_path, "w") as f:
            json.dump(call_log, f, indent=2)
    else:
        s3 = _get_s3_client()
        s3.put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=json.dumps(call_log),
            ContentType="application/json",
        )

    return call_id
