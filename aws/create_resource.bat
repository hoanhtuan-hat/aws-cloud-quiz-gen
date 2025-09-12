@echo off
setlocal enabledelayedexpansion

rem Clear any existing SSO sessions and cache
echo Cleaning up any existing SSO sessions...
aws sso logout 2>nul
if exist "%USERPROFILE%\.aws\sso\cache" (
    rmdir /s /q "%USERPROFILE%\.aws\sso\cache" 2>nul
    echo Cleared SSO cache
)

rem Read config file and set variables
for /f "tokens=1,* delims==" %%a in (aws_config.txt) do (
    if "%%a"=="REGION" set REGION=%%b
    if "%%a"=="LOGIN_NAME" set LOGIN_NAME=%%b
    if "%%a"=="GEMINI_MODEL" set GEMINI_MODEL=%%b
)

rem Read config file and set variables
for /f "tokens=1,* delims==" %%a in (secret_key_file.txt) do (
    if "%%a"=="ACCESS_KEY" set ACCESS_KEY=%%b
    if "%%a"=="SECRET_KEY" set SECRET_KEY=%%b
    if "%%a"=="GEMINI_API_KEY" set GEMINI_API_KEY=%%b
)

rem Configure AWS CLI with explicit profile to avoid SSO conflicts
aws configure set aws_access_key_id %ACCESS_KEY% --profile direct-access
aws configure set aws_secret_access_key %SECRET_KEY% --profile direct-access
aws configure set region %REGION% --profile direct-access
aws configure set output json --profile direct-access

rem Verify login credentials with explicit profile
echo Verifying AWS login credentials...
aws sts get-caller-identity --profile direct-access > nul 2>&1
if errorlevel 1 (
    echo ERROR: Login failed. Please check your credentials in aws_config.txt
    echo.
    echo Troubleshooting steps:
    echo 1. Verify ACCESS_KEY and SECRET_KEY are correct and active
    echo 2. Check if the IAM user has necessary permissions
    echo 3. Ensure no SSO configuration in .aws/config file
    pause
    exit /b 1
) else (
    echo Login successful for user: %LOGIN_NAME%
)

rem Create CloudFormation stack with explicit profile and API key parameter
echo Creating CloudFormation stack...
aws cloudformation create-stack ^
    --stack-name quiz-ai-stack ^
    --template-body file://AWS_template.yaml ^
    --parameters ParameterKey=GeminiApiKey,ParameterValue="!GEMINI_API_KEY!" ^
    --capabilities CAPABILITY_NAMED_IAM ^
    --profile direct-access

rem Wait for completion
echo Waiting for stack creation to complete...
aws cloudformation wait stack-create-complete ^
    --stack-name quiz-ai-stack ^
    --profile direct-access

echo Stack created successfully

REM Extract bucket name from YAML file
echo Extracting bucket name from AWS_template.yaml...
set BUCKET_NAME=
for /f "tokens=2 delims=: " %%i in ('findstr /C:"BucketName:" AWS_template.yaml') do (
    set BUCKET_NAME=%%i
)

if "!BUCKET_NAME!"=="" (
    echo ERROR: Could not extract bucket name from AWS_template.yaml
    pause
    exit /b 1
)

echo Using bucket name: !BUCKET_NAME!

REM After stack creation, create S3 folders
echo Creating S3 folders...

rem Verify if bucket exists before creating folders
aws s3api head-bucket --bucket !BUCKET_NAME! --profile direct-access
if errorlevel 1 (
    echo ERROR: Bucket !BUCKET_NAME! does not exist or is inaccessible.
    exit /b 1
)

aws s3api put-object --bucket !BUCKET_NAME! --key "ai-quiz/pdf-extract/input-folder/" --content-length 0 --profile direct-access
aws s3api put-object --bucket !BUCKET_NAME! --key "ai-quiz/pdf-extract/text-output-folder/" --content-length 0 --profile direct-access
aws s3api put-object --bucket !BUCKET_NAME! --key "ai-quiz/gen-quiz/quiz-output-folder/" --content-length 0 --profile direct-access

echo S3 folders created successfully

pause