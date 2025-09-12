import os, json, tempfile
import fitz  # PyMuPDF
import urllib.parse
import boto3

def extract_text_from_pdf(path: str) -> str:
    doc = fitz.open(path)
    parts = [p.get_text() for p in doc]
    doc.close()
    return ("\n".join(parts)).strip()

def _to_plain_text(s: str) -> str:
    # Normalize to text-only: unify newlines, strip NULs, no control chars
    s = s.replace("\r\n", "\n").replace("\r", "\n").replace("\x00", "")
    return "".join(ch for ch in s if ch == "\n" or ord(ch) >= 32)

def _ok(txt: str):
    # Return API Gateway-style: statusCode + body(stringified JSON)
    payload = {"text_length": len(txt), "content": txt}
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(payload, ensure_ascii=False)
    }

def _bad_request(msg: str):
    return {
        "statusCode": 400,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"error": msg}, ensure_ascii=False)
    }

def _error(msg: str):
    return {
        "statusCode": 500,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"error": msg}, ensure_ascii=False)
    }

def lambda_handler(event, context):
    try:
        # check parameter env to decide send to EventBridge 
        write_to_eventbridge = get_parameter_value("extract_pdf_write_to_EventBridge")
        
        if "Records" in event and event["Records"][0]["eventSource"] == "aws:s3":
            s3 = boto3.client('s3')
            record = event['Records'][0]
            bucket = record['s3']['bucket']['name']
            key = urllib.parse.unquote_plus(record['s3']['object']['key'], encoding='utf-8')
            
            if not key.startswith("pdf_extractor_input/"):
                return _ok("File is not in the specified S3 folder, skipping.")

            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                s3.download_file(bucket, key, tmp.name)
                tmp_path = tmp.name

            try:
                txt = _to_plain_text(extract_text_from_pdf(tmp_path))

                # ---  logic EventBridge  ---
                if write_to_eventbridge.lower() == 'true':
                    event_detail = {
                        "source": "pdf-extractor.lambda",
                        "detail-type": "PDF Text Extracted",
                        "detail": json.dumps({
                            "bucket": bucket,
                            "key": key,
                            "text": txt,
                            "text_length": len(txt)
                        })
                    }
                    response = eventbridge_client.put_events(
                        Entries=[event_detail]
                    )
                    print(f"Published event to EventBridge: {response}")
                else:
                    print("Parameter 'extract_pdf_write_to_EventBridge' is not 'true'. Skipping EventBridge.")


                print(f"Extracted text from {key}: {txt[:100]}...")
                return _ok(txt)
            finally:
                try: os.remove(tmp_path)
                except: pass

        return _bad_request("Not a valid S3 event")
    except Exception as e:
        return _error(str(e))