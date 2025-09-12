import os
import json
import tempfile
import hashlib
import urllib.parse
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError
import fitz  # PyMuPDF

# ---------- small helpers ----------
def _resp(code: int, obj) -> dict:
    return {
        "statusCode": code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(obj, ensure_ascii=False),
    }

def _bad(msg: str):
    print(f"ERROR: {msg}")
    return _resp(400, {"error": msg})

def _err(msg: str):
    print(f"ERROR: {msg}")
    return _resp(500, {"error": msg})

def _ok(msg: str):
    print(msg)
    return _resp(200, {"result": msg})

def _normalize_prefix(p: str) -> str:
    return p if p.endswith("/") else p + "/"

def _get_ssm_param(ssm, name: str) -> str:
    v = ssm.get_parameter(Name=name)["Parameter"]["Value"].strip()
    if not v:
        raise ValueError(f"SSM parameter empty: {name}")
    return v

def _parse_s3_location(value: str, fallback_bucket: str):
    if value.startswith("s3://"):
        body = value[5:]
        parts = body.split("/", 1)
        bkt = parts[0]
        pref = parts[1] if len(parts) > 1 else ""
        return bkt, _normalize_prefix(pref)
    if value.startswith("arn:aws:s3:::"):
        body = value[len("arn:aws:s3:::"):]
        parts = body.split("/", 1)
        bkt = parts[0]
        pref = parts[1] if len(parts) > 1 else ""
        return bkt, _normalize_prefix(pref)
    return fallback_bucket, _normalize_prefix(value)

def _extract_text_from_pdf(path: str) -> str:
    doc = fitz.open(path)
    parts = [page.get_text() for page in doc]
    doc.close()
    return ("\n".join(parts)).strip()

def _sanitize_text(s: str) -> str:
    s = s.replace("\r\n", "\n").replace("\r", "\n").replace("\x00", "")
    return "".join(ch for ch in s if ch == "\n" or ord(ch) >= 32)

def _compute_job_id(bucket: str, key: str, size: int) -> str:
    raw = f"{bucket}{key}{size}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()

def _set_job_tag(s3, bucket: str, key: str, job_id: str) -> str:
    # Always overwrite tag jobID
    s3.put_object_tagging(
        Bucket=bucket,
        Key=key,
        Tagging={"TagSet": [{"Key": "jobID", "Value": job_id}]}
    )
    print(f"Set/overwrite jobID tag = {job_id}")
    return job_id

def _publish_eventbridge(job_id: str, bucket: str, key: str, status: str = "EXTRACTED"):
    events = boto3.client("events")
    bus_name = os.getenv("event_bus_name", "default")
    detail = {
        "jobId": job_id,
        "bucket": bucket,
        "key": key,
        "status": status,
        "ts": datetime.now(timezone.utc).isoformat()
    }
    entry = {
        "Source": "ai-quiz.pdf-extract",
        "DetailType": "pdf-extract-finished",
        "Detail": json.dumps(detail),
        "EventBusName": bus_name
    }
    resp = events.put_events(Entries=[entry])
    if resp.get("FailedEntryCount"):
        print("eventbridge_put_failed:", resp)
    else:
        print("eventbridge_put_ok:", resp.get("Entries"))

# ---------- lambda entry ----------
def lambda_handler(event, context):
    try:
        if not (isinstance(event, dict) and "Records" in event and event["Records"]):
            return _bad("Invalid event: not an S3 trigger")
        rec = event["Records"][0]
        if rec.get("eventSource") != "aws:s3":
            return _bad("Invalid eventSource: expecting aws:s3")

        event_bucket = rec["s3"]["bucket"]["name"]
        event_key = urllib.parse.unquote_plus(rec["s3"]["object"]["key"], encoding="utf-8")

        s3 = boto3.client("s3")
        ssm = boto3.client("ssm")

        in_param = "/ai-quiz/pdf-extract/input-folder"
        out_param = "/ai-quiz/pdf-extract/text-output-folder"
        in_value = _get_ssm_param(ssm, in_param)
        out_value = _get_ssm_param(ssm, out_param)
        in_bucket, in_prefix = _parse_s3_location(in_value, event_bucket)
        out_bucket, out_prefix = _parse_s3_location(out_value, event_bucket)

        if event_bucket != in_bucket or not event_key.startswith(in_prefix):
            print(f"Object outside input folder, skipping: s3://{event_bucket}/{event_key}")
            return _ok("skip")

        # compute + always overwrite jobId tag
        ho = s3.head_object(Bucket=event_bucket, Key=event_key)
        size = ho.get("ContentLength", 0)
        computed_job = _compute_job_id(event_bucket, event_key, size)
        job_id = _set_job_tag(s3, event_bucket, event_key, computed_job)
        print(f"jobId={job_id} for s3://{event_bucket}/{event_key}")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            s3.download_file(event_bucket, event_key, tmp.name)
            tmp_path = tmp.name
        try:
            text = _extract_text_from_pdf(tmp_path)
            text = _sanitize_text(text)
        finally:
            try: os.remove(tmp_path)
            except: pass

        job_prefix = f"{out_prefix}{job_id}/"
        out_key = f"{job_prefix}data.txt"
        s3.put_object(Bucket=out_bucket, Key=job_prefix, Body=b"")
        s3.put_object(
            Bucket=out_bucket,
            Key=out_key,
            Body=text.encode("utf-8"),
            ContentType="text/plain; charset=utf-8",
        )

        print(f"Wrote data to: s3://{out_bucket}/{out_key}")

        # always publish to EventBridge
        _publish_eventbridge(job_id, event_bucket, event_key, "EXTRACTED")

        return _resp(200, {"jobId": job_id, "output": f"s3://{out_bucket}/{out_key}"})
    except ValueError as ve:
        return _bad(str(ve))
    except Exception as e:
        return _err(f"Unhandled error: {e}")
