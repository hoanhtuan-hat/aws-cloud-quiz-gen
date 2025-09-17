import os
import json
import boto3
from botocore.exceptions import ClientError

# Helper function to format the HTTP response
def _resp(code: int, obj) -> dict:
    return {
        "statusCode": code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "body": json.dumps(obj, ensure_ascii=False),
    }

def lambda_handler(event, context):
    print(f"DEBUG: === LAMBDA STARTED ===")
    
    # 1. Get the jobId from the API Gateway path
    job_id = None
    if "pathParameters" in event and event["pathParameters"]:
        job_id = event["pathParameters"].get("jobId")
    
    if not job_id:
        return _resp(400, {"error": "Missing jobId in path."})
    
    print(f"DEBUG: Extracted jobId: {job_id}")

    # 2. Get the S3 bucket information from SSM Parameter Store
    try:
        ssm = boto3.client("ssm")
        out_uri = ssm.get_parameter(Name="/ai-quiz/gen-quiz/quiz-output-folder", WithDecryption=False)["Parameter"]["Value"]
        
        # Parse the S3 URI
        parts = out_uri.split("://")
        out_bucket = parts[1].split("/")[0]
        out_prefix = "/".join(parts[1].split("/")[1:])
        if out_prefix and not out_prefix.endswith("/"):
            out_prefix += "/"

    except Exception as e:
        print(f"ERROR: Failed to get S3 path from SSM: {str(e)}")
        return _resp(500, {"error": "Internal server error."})
        
    s3 = boto3.client("s3")
    s3_region = s3.meta.region_name
    
    # 3. Build the full path to the PDF file
    pdf_key = f"{out_prefix}{job_id}/quiz.pdf"
    pdf_url = f"https://{out_bucket}.s3.{s3_region}.amazonaws.com/{pdf_key}"
    
    # 4. Check if the file exists
    try:
        s3.head_object(Bucket=out_bucket, Key=pdf_key)
        
        # If the file exists, return the URL
        return _resp(200, {
            "status": "ready",
            "pdfUrl": pdf_url
        })
    
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            # File is not ready yet
            return _resp(202, {"status": "processing", "message": "PDF file not ready yet."})
        else:
            print(f"ERROR: S3 error: {str(e)}")
            return _resp(500, {"error": "Internal S3 error."})
    
    except Exception as e:
        print(f"ERROR: Unhandled exception: {str(e)}")
        return _resp(500, {"error": "An unexpected error occurred."})