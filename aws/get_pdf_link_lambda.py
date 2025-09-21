import os
import json
import boto3
from botocore.exceptions import ClientError
import base64

# Helper function to format the HTTP response
def _resp(code: int, obj, is_base64=False, content_type="application/json") -> dict:
    resp = {
        "statusCode": code,
        "headers": {
            "Content-Type": content_type,
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "isBase64Encoded": is_base64,
        "body": obj,
    }
    return resp

def lambda_handler(event, context):
    print(f"DEBUG: === LAMBDA STARTED ===")
    
    # 1. Get the jobId from the API Gateway path
    job_id = None
    if "pathParameters" in event and event["pathParameters"]:
        job_id = event["pathParameters"].get("jobId")
    
    if not job_id:
        return _resp(400, json.dumps({"error": "Missing jobId in path."}))
    
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
        return _resp(500, json.dumps({"error": "Internal server error."}))
        
    s3 = boto3.client("s3")
    
    # 3. Build the full path to the PDF file
    pdf_key = f"{out_prefix}{job_id}/quiz.pdf"
    
    # 4. Try to get the PDF file from S3
    try:
        s3_object = s3.get_object(Bucket=out_bucket, Key=pdf_key)
        pdf_content = s3_object['Body'].read()
        
        # 5. Base64 encode the content and return it
        encoded_content = base64.b64encode(pdf_content).decode('utf-8')
        
        return _resp(200, encoded_content, is_base64=True, content_type="application/pdf")
    
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            # File is not ready yet
            return _resp(202, json.dumps({"status": "processing", "message": "PDF file not ready yet."}))
        else:
            print(f"ERROR: S3 error: {str(e)}")
            return _resp(500, json.dumps({"error": "Internal S3 error."}))
    
    except Exception as e:
        print(f"ERROR: Unhandled exception: {str(e)}")
        return _resp(500, json.dumps({"error": "An unexpected error occurred."}))