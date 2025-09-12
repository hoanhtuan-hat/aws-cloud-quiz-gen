# test_local.py
import os

# Set dummy AWS credentials FIRST, before any boto3 imports
os.environ['AWS_ACCESS_KEY_ID'] = 'testing'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'testing'
os.environ['AWS_SECURITY_TOKEN'] = 'testing'
os.environ['AWS_SESSION_TOKEN'] = 'testing'
os.environ['AWS_DEFAULT_REGION'] = 'us-east-2'

# Clear any AWS profile that might interfere
os.environ.pop('AWS_PROFILE', None)

# Now import boto3 and other modules
import boto3
from moto import mock_aws
import json

# Import handler từ function chính của bạn
from gemini_quiz import lambda_handler




# Sử dụng decorator để mock nhiều services
@mock_aws
def test_lambda_handler():
    # --- 1. Thiết lập môi trường giả lập ---
    print("Đang thiết lập môi trường giả lập...")

    # Tạo client cho các services đã được mock
    s3_client = boto3.client('s3', region_name='us-east-2')
    ssm_client = boto3.client('ssm', region_name='us-east-2')

    # Tạo bucket giả lập và upload dữ liệu test giống hệt trên S3 thật
    s3_client.create_bucket(
        Bucket='quiz-ai-bucket',
        CreateBucketConfiguration={'LocationConstraint': 'us-east-2'}
    )
    # Upload file data.txt giả lập vào bucket
    s3_client.put_object(
        Bucket='quiz-ai-bucket',
        Key='ai-quiz/text-output/fb6a176456e09d37e983e1b7e0bb174bcf1578000ceb71229efe3761809698f5/data.txt', # Đường dẫn giống thật
        Body="""When completing your LinkedIn Profile, reference the requirements below to ensure you pass the JRA and are 
ready to apply for roles when instructed to do so. """
    )

    # Tạo các parameters giả lập trong SSM Parameter Store
    ssm_client.put_parameter(
        Name='/ai-quiz/pdf-extract/text-output-folder',
        Value='s3://quiz-ai-bucket/ai-quiz/text-output/',
        Type='String'
    )
    ssm_client.put_parameter(
        Name='/ai-quiz/gen_quiz/output_folder',
        Value='s3://quiz-ai-bucket/ai-quiz/gen-quiz-output/',
        Type='String'
    )
    ssm_client.put_parameter(
        Name='/ai-quiz/gen_quiz/gemini_api_key',
        Value='AIzaSyDYgt80Vya5k72Qm-KIe3q4ha6GDZT95SE', # Dùng key giả để test
        Type='SecureString'
    )
    ssm_client.put_parameter(
        Name='/ai-quiz/gen_quiz/gemini_model',
        Value='gemini-2.5-flash-preview-05-20',
        Type='String'
    )

    # --- 2. Tạo event giả lập từ EventBridge ---
    # Dựa trên event thật bạn đã có trong log
    mock_eventbridge_event = {
        "version": "0",
        "id": "9d3db109-23bd-b5eb-3932-34e5ad83ebc4",
        "detail-type": "pdf-extract-finished",
        "source": "ai-quiz.pdf-extract",
        "account": "606635532364",
        "time": "2025-09-08T21:37:31Z",
        "region": "us-east-2",
        "resources": [],
        "detail": {
            "jobId": "fb6a176456e09d37e983e1b7e0bb174bcf1578000ceb71229efe3761809698f5",
            "bucket": "quiz-ai-bucket",
            "key": "ai-quiz/pdf-extract/input-folder/LinkedIn_2025.pdf",
            "status": "EXTRACTED",
            "ts": "2025-09-08T21:37:31.751981+00:00"
        }
    }

    # --- 3. Gọi Lambda handler của bạn trong môi trường giả lập ---
    print("Đang gọi lambda_handler...")
    result = lambda_handler(mock_eventbridge_event, None) # Context có thể là None
    print("Kết quả trả về:")
    print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    test_lambda_handler()