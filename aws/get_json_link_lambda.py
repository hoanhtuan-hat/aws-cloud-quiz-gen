import os
import json
import boto3
from botocore.exceptions import ClientError

# Helper function to format the HTTP response
def _resp(code: int, body_obj) -> dict:
    return {
        "statusCode": code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "body": json.dumps(body_obj, ensure_ascii=False),
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
    
    # 3. Build the full path to the JSON file
    json_key = f"{out_prefix}{job_id}/quiz.json"
    
    # 4. Attempt to get the file content from S3
    try:
        response = s3.get_object(Bucket=out_bucket, Key=json_key)
        
        # Read the file content
        file_content = response['Body'].read().decode('utf-8')
        
        # Parse the JSON content
        quiz_data = json.loads(file_content)
        
        # Return the JSON content directly
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            "body": json.dumps(quiz_data, ensure_ascii=False)
        }
    
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            # File not found
            return _resp(404, {"error": "File not found."})
        else:
            print(f"ERROR: S3 error: {str(e)}")
            return _resp(500, {"error": "Internal S3 error."})
    
    except Exception as e:
        print(f"ERROR: Unhandled exception: {str(e)}")
        return _resp(500, {"error": "An unexpected error occurred."})