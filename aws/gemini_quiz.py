import os
import json
import time
import inspect
from typing import Tuple
import base64

import boto3
from botocore.exceptions import ClientError


def _compute_job_id_from_content(file_path: str) -> str:
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while True:
            chunk = f.read(4096)
            if not chunk:
                break
            hasher.update(chunk)
    hash_bytes = hasher.digest()
    return base64.b64encode(hash_bytes).decode('utf-8')

def get_current_line():
    return inspect.currentframe().f_back.f_lineno

# Optional Gemini SDK / PDF
try:
    import google.generativeai as genai
    _HAS_GENAI = True
    print(f"DEBUG - Line {get_current_line()}: Successfully imported google.generativeai")
except Exception as e:
    _HAS_GENAI = False
    print(f"DEBUG - Line {get_current_line()}: Failed to import google.generativeai: {str(e)}")

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import cm
    _HAS_PDF = True
    print(f"DEBUG - Line {get_current_line()}: Successfully imported reportlab")
except Exception as e:
    _HAS_PDF = False
    print(f"DEBUG - Line {get_current_line()}: Failed to import reportlab: {str(e)}")

# --------- Helper Functions ----------
def _resp(code: int, obj) -> dict:
    print(f"DEBUG - Line {get_current_line()}: Creating response with code {code}")
    return {"statusCode": code, "headers": {"Content-Type": "application/json"}, "body": json.dumps(obj, ensure_ascii=False)}

def _ok(obj) -> dict:
    print(f"DEBUG - Line {get_current_line()}: Returning OK response")
    return _resp(200, obj)

def _bad(msg: str) -> dict:
    print(f"DEBUG - Line {get_current_line()}: Returning BAD response: {msg}")
    return _resp(400, {"error": msg})

def _err(msg: str) -> dict:
    print(f"DEBUG - Line {get_current_line()}: Returning ERROR response: {msg}")
    return _resp(500, {"error": msg})

def _normalize_prefix(p: str) -> str:
    result = p if p.endswith("/") else p + "/"
    print(f"DEBUG - Line {get_current_line()}: Normalized prefix '{p}' to '{result}'")
    return result

def _get_ssm_param(ssm_client, name: str, decrypt: bool = True) -> str:
    print(f"DEBUG - Line {get_current_line()}: Getting SSM parameter: {name}")
    try:
        r = ssm_client.get_parameter(Name=name, WithDecryption=decrypt)
        v = (r.get("Parameter") or {}).get("Value", "").strip()
        if not v:
            raise ValueError(f"empty ssm value: {name}")
        print(f"DEBUG - Line {get_current_line()}: Successfully got SSM parameter: {name}")
        return v
    except Exception as e:
        print(f"DEBUG - Line {get_current_line()}: ERROR getting SSM parameter {name}: {str(e)}")
        raise

def _get_secret(secrets_client, secret_name: str) -> str:
    print(f"DEBUG - Line {get_current_line()}: Getting secret: {secret_name}")
    try:
        response = secrets_client.get_secret_value(SecretId=secret_name)
        secret_value = json.loads(response['SecretString'])
        api_key = secret_value.get('apiKey', '').strip()
        if not api_key:
            raise ValueError(f"empty api key in secret: {secret_name}")
        print(f"DEBUG - Line {get_current_line()}: Successfully got secret: {secret_name}")
        return api_key
    except Exception as e:
        print(f"DEBUG - Line {get_current_line()}: ERROR getting secret {secret_name}: {str(e)}")
        raise

def _parse_s3_location(value: str) -> Tuple[str, str]:
    print(f"DEBUG - Line {get_current_line()}: Parsing S3 location: {value}")
    try:
        if value.startswith("s3://"):
            rest = value[5:]
            if "/" in rest:
                b, pref = rest.split("/", 1)
            else:
                b, pref = rest, ""
            result = b, _normalize_prefix(pref)
            print(f"DEBUG - Line {get_current_line()}: Parsed S3 location: bucket={b}, prefix={pref}")
            return result
        if value.startswith("arn:aws:s3:::"):
            rest = value[len("arn:aws:s3:::"):]
            if "/" in rest:
                b, pref = rest.split("/", 1)
            else:
                b, pref = rest, ""
            result = b, _normalize_prefix(pref)
            print(f"DEBUG - Line {get_current_line()}: Parsed S3 location: bucket={b}, prefix={pref}")
            return result
        raise ValueError(f"invalid s3 location: {value}")
    except Exception as e:
        print(f"DEBUG - Line {get_current_line()}: ERROR parsing S3 location: {str(e)}")
        raise

def _s3_get_text(s3_client, bucket: str, key: str) -> str:
    print(f"DEBUG - Line {get_current_line()}: Getting S3 object: s3://{bucket}/{key}")
    try:
        obj = s3_client.get_object(Bucket=bucket, Key=key)
        text = obj["Body"].read().decode("utf-8", errors="ignore")
        print(f"DEBUG - Line {get_current_line()}: Successfully got S3 object, length: {len(text)}")
        return text
    except Exception as e:
        print(f"DEBUG - Line {get_current_line()}: ERROR getting S3 object: {str(e)}")
        raise

def _s3_put_text(s3_client, bucket: str, key: str, text: str):
    print(f"DEBUG - Line {get_current_line()}: Putting text to S3: s3://{bucket}/{key}")
    s3_client.put_object(Bucket=bucket, Key=key, Body=text.encode("utf-8"), ContentType="text/plain; charset=utf-8")
    print(f"DEBUG - Line {get_current_line()}: Successfully put text to S3")

def _s3_put_bytes(s3_client, bucket: str, key: str, body: bytes, content_type: str):
    print(f"DEBUG - Line {get_current_line()}: Putting bytes to S3: s3://{bucket}/{key}")
    s3_client.put_object(Bucket=bucket, Key=key, Body=body, ContentType=content_type)
    print(f"DEBUG - Line {get_current_line()}: Successfully put bytes to S3")

def _build_prompt(src_text: str, job_id: str) -> str:
    print(f"DEBUG - Line {get_current_line()}: Building prompt for job_id: {job_id}")
    prompt = (
        "You are a quiz generator. Your task is to generate a quiz from the source text. "
        "The quiz must have exactly 10 multiple-choice questions.\n"
        "Your response must be a single JSON object with the following structure:\n"
        "{\n"
        "  \"title\": \"Quiz from the document\",\n"
        "  \"questions\": [\n"
        "    {\n"
        "      \"question\": \"string\",\n"
        "      \"options\": [\"string\", \"string\", \"string\", \"string\"],\n"
        "      \"correctAnswer\": \"string\",\n"
        "      \"explanation\": \"string\"\n"
        "    }\n"
        "    // ... 9 more question objects\n"
        "  ]\n"
        "}\n\n"
        "Ensure the JSON is well-formed and does not contain any extra text or code blocks.\n\n"
        f"JOB_ID: {job_id}\n\n=== SOURCE TEXT START ===\n{src_text[:12000]}\n=== SOURCE TEXT END ===\n"
    )
    print(f"DEBUG - Line {get_current_line()}: Prompt built, length: {len(prompt)}")
    return prompt

def _build_prompt1(src_text: str, job_id: str) -> str:
    print(f"DEBUG - Line {get_current_line()}: Building prompt for job_id: {job_id}")
    prompt = (
        "You are a quiz generator.\n"
        "Write 10 multiple-choice questions (A-D) with exactly one correct answer.\n"
        "Output format (strict):\n"
        "Q1. <question>\nA) ...\nB) ...\nC) ...\nD) ...\nAnswer: <A|B|C|D>\n\n"
        f"JOB_ID: {job_id}\n\n=== SOURCE TEXT START ===\n{src_text[:12000]}\n=== SOURCE TEXT END ===\n"
    )
    print(f"DEBUG - Line {get_current_line()}: Prompt built, length: {len(prompt)}")
    return prompt

def _call_gemini(prompt: str, model: str, api_key: str, max_retries: int = 5, timeout_sec: int = 60) -> str:
    print(f"DEBUG - Line {get_current_line()}: Calling Gemini API, model: {model}")
    backoff = 1.5
    last_err = None
    for i in range(max_retries):
        print(f"DEBUG - Line {get_current_line()}: Gemini attempt {i+1}/{max_retries}")
        try:
            if _HAS_GENAI:
                genai.configure(api_key=api_key)
                mdl = genai.GenerativeModel(model)
                resp = mdl.generate_content(prompt, request_options={"timeout": timeout_sec})
                txt = (getattr(resp, "text", "") or "").strip()
            else:
                import json as _json
                from urllib.request import Request, urlopen
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                payload = _json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8")
                req = Request(url, data=payload, headers={"Content-Type": "application/json"})
                with urlopen(req, timeout=timeout_sec) as r:
                    data = _json.loads(r.read().decode("utf-8", errors="ignore"))
                txt = ""
                for c in data.get("candidates", []):
                    parts = c.get("content", {}).get("parts", [])
                    for p in parts:
                        if "text" in p:
                            txt += p["text"]
                txt = (txt or "").strip()
            if not txt:
                raise RuntimeError("empty response")
            print(f"DEBUG - Line {get_current_line()}: Gemini API call successful, response length: {len(txt)}")
            return txt
        except Exception as e:
            last_err = e
            print(f"DEBUG - Line {get_current_line()}: Gemini attempt {i+1} failed: {str(e)}")
            time.sleep(backoff)
            backoff *= 1.8
    raise RuntimeError(f"gemini failed: {last_err}")

def _make_pdf_bytes(text: str) -> bytes:
    print(f"DEBUG - Line {get_current_line()}: Creating PDF from text")
    if not _HAS_PDF:
        raise RuntimeError("reportlab not installed")
    from io import BytesIO
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    left = 2 * cm
    top = height - 2 * cm
    max_w = width - 4 * cm
    line_h = 0.6 * cm

    def wrap(s: str):
        words, line, lines = s.split(), "", []
        for w in words:
            t = (line + " " + w).strip()
            if c.stringWidth(t) <= max_w:
                line = t
            else:
                if line:
                    lines.append(line)
                line = w
        if line:
            lines.append(line)
        return lines

    c.setFont("Times-Roman", 11)
    y = top
    for para in text.splitlines():
        if not para.strip():
            y -= line_h
            continue
        for ln in wrap(para):
            if y < 2 * cm:
                c.showPage()
                c.setFont("Times-Roman", 11)
                y = top
            c.drawString(left, y, ln)
            y -= line_h
    c.showPage()
    c.save()
    buf.seek(0)
    print(f"DEBUG - Line {get_current_line()}: PDF created successfully")
    return buf.read()

# --------- Lambda Handler ----------
def lambda_handler(event, context):
    try:
        print(f"DEBUG - Line {get_current_line()}: === LAMBDA STARTED ===")
        
        # Create AWS clients
        print(f"DEBUG - Line {get_current_line()}: Creating AWS clients")
        s3 = boto3.client("s3")
        ssm = boto3.client("ssm")
        secrets = boto3.client("secretsmanager")
        print(f"DEBUG - Line {get_current_line()}: AWS clients created successfully")

        # Log raw event
        print(f"DEBUG - Line {get_current_line()}: === RAW EVENT ===")
        print(json.dumps(event, indent=2, ensure_ascii=False))

        # Extract job_id
        print(f"DEBUG - Line {get_current_line()}: Extracting job_id from event")
        job_id = None
        if "detail" in event and isinstance(event["detail"], dict):
            job_id = str(event["detail"].get("jobId", "")).strip()
        if not job_id:
            job_id = str(event.get("job_id", "")).strip()

        print(f"DEBUG - Line {get_current_line()}: Extracted job_id: {job_id}")

        if not job_id:
            print(f"DEBUG - Line {get_current_line()}: ERROR: Missing job_id")
            return _bad("missing job_id")

        # Get SSM parameters
        print(f"DEBUG - Line {get_current_line()}: Getting SSM parameters")
        try:
            in_uri = _get_ssm_param(ssm, "/ai-quiz/pdf-extract/text-output-folder")
            out_uri = _get_ssm_param(ssm, "/ai-quiz/gen-quiz/quiz-output-folder")
            print(f"DEBUG - Line {get_current_line()}: Got SSM parameters: in_uri={in_uri}, out_uri={out_uri}")
        except Exception as e:
            print(f"DEBUG - Line {get_current_line()}: ERROR getting SSM parameters: {str(e)}")
            raise

        in_bucket, in_prefix = _parse_s3_location(in_uri)
        out_bucket, out_prefix = _parse_s3_location(out_uri)
        print(f"DEBUG - Line {get_current_line()}: Parsed S3 locations: in_bucket={in_bucket}, out_bucket={out_bucket}")

        # Read source text
        data_key = f"{in_prefix}{job_id}/data.txt"
        print(f"DEBUG - Line {get_current_line()}: Checking S3 object: s3://{in_bucket}/{data_key}")
        
        try:
            s3.head_object(Bucket=in_bucket, Key=data_key)
            print(f"DEBUG - Line {get_current_line()}: S3 object exists")
        except ClientError as e:
            print(f"DEBUG - Line {get_current_line()}: ERROR: S3 object does not exist: {str(e)}")
            return _bad(f"missing data.txt at s3://{in_bucket}/{data_key}")

        source_text = _s3_get_text(s3, in_bucket, data_key)
        print(f"DEBUG - Line {get_current_line()}: Source text retrieved, length: {len(source_text)}")

        # Call Gemini API
        print(f"DEBUG - Line {get_current_line()}: Getting Gemini parameters")
        try:
            model = _get_ssm_param(ssm, "/ai-quiz/gen-quiz/gemini-model")
            api_key = _get_secret(secrets, "/ai-quiz/gen-quiz/gemini-api-key")
            print(f"DEBUG - Line {get_current_line()}: Got Gemini parameters: model={model}")
        except Exception as e:
            print(f"DEBUG - Line {get_current_line()}: ERROR getting Gemini parameters: {str(e)}")
            raise

        prompt = _build_prompt(source_text, job_id)
        print(f"DEBUG - Line {get_current_line()}: Calling Gemini API")
        quiz_json_string = _call_gemini(prompt, model=model, api_key=api_key)
        print(f"DEBUG - Line {get_current_line()}: Gemini API call successful")

        # Parse the JSON for processing and PDF generation
        try:
            # Gemini might add '```json' and '```', so remove them
            if quiz_json_string.strip().startswith("```json"):
                quiz_json_string = quiz_json_string.strip()[7:-3].strip()
            
            quiz_data = json.loads(quiz_json_string)
            print(f"DEBUG - Line {get_current_line()}: Successfully parsed Gemini response as JSON.")
            
            # Create text string for PDF from the JSON data
            quiz_text_for_pdf = f"{quiz_data['title']}\n\n"
            for i, q in enumerate(quiz_data['questions']):
                quiz_text_for_pdf += f"{i + 1}. {q['question']}\n"
                for j, option in enumerate(q['options']):
                    quiz_text_for_pdf += f"   {chr(65 + j)}. {option}\n"
                quiz_text_for_pdf += f"Answer: {q['correctAnswer']}\n"
                if q.get('explanation'):
                    quiz_text_for_pdf += f"Explanation: {q['explanation']}\n"
                quiz_text_for_pdf += "\n"

        except json.JSONDecodeError as e:
            print(f"DEBUG - Line {get_current_line()}: ERROR parsing JSON response from Gemini: {e}")
            return _err(f"failed to parse quiz JSON: {e}")
        except KeyError as e:
            print(f"DEBUG - Line {get_current_line()}: ERROR: Missing key in JSON response: {e}")
            return _err(f"malformed quiz JSON: {e}")


        # Save output
        print(f"DEBUG - Line {get_current_line()}: Saving output to S3")
        out_base = f"{out_prefix}{job_id}/"
        json_key = f"{out_base}quiz.json"
        pdf_key = f"{out_base}quiz.pdf"

        # Save JSON file
        _s3_put_text(s3, out_bucket, json_key, quiz_json_string)
        print(f"DEBUG - Line {get_current_line()}: JSON output saved to: s3://{out_bucket}/{json_key}")

        # Generate and save PDF file
        pdf_saved = False
        try:
            pdf_bytes = _make_pdf_bytes(quiz_text_for_pdf)
            _s3_put_bytes(s3, out_bucket, pdf_key, pdf_bytes, "application/pdf")
            pdf_saved = True
            print(f"DEBUG - Line {get_current_line()}: PDF output saved to: s3://{out_bucket}/{pdf_key}")
        except Exception as e:
            print(f"DEBUG - Line {get_current_line()}: [WARN] PDF generation failed: {e}")

        print(f"DEBUG - Line {get_current_line()}: === LAMBDA COMPLETED SUCCESSFULLY ===")
        return _ok({
            "job_id": job_id,
            "input": {"bucket": in_bucket, "key": data_key},
            "output": {
                "json": {"bucket": out_bucket, "key": json_key},
                "pdf": {"bucket": out_bucket, "key": pdf_key, "saved": pdf_saved},
            },
            "model": model
        })

    except Exception as e:
        print(f"DEBUG - Line {get_current_line()}: === UNHANDLED EXCEPTION ===")
        print(f"DEBUG - Line {get_current_line()}: Error type: {type(e).__name__}")
        print(f"DEBUG - Line {get_current_line()}: Error message: {str(e)}")
        import traceback
        traceback.print_exc()
        return _err(f"unhandled: {e}")