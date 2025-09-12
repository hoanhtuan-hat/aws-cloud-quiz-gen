@echo off
setlocal enabledelayedexpansion

set AWS_PAGER=

REM Read all configuration from aws_config.txt
for /f "tokens=1,* delims==" %%a in (aws_config.txt) do (
    if "%%a"=="REGION" set REGION=%%b
    if "%%a"=="IMAGE_NAME" set IMAGE_NAME=%%b
    if "%%a"=="LOGIN_NAME" set LOGIN_NAME=%%b
    if "%%a"=="LAMBDA_FUNCTION_NAME" set LAMBDA_FUNCTION_NAME=%%b
    if "%%a"=="LAMBDA_FUNCTION_NAME_2" set LAMBDA_FUNCTION_NAME_2=%%b
)

rem Read config file and set variables
for /f "tokens=1,* delims==" %%a in (secret_key_file.txt) do (
    if "%%a"=="ACCESS_KEY" set ACCESS_KEY=%%b
    if "%%a"=="SECRET_KEY" set SECRET_KEY=%%b
    if "%%a"=="GEMINI_API_KEY" set GEMINI_API_KEY=%%b
)

REM Trim spaces from values
set IMAGE_NAME=%IMAGE_NAME: =%
set REGION=%REGION: =%
set LAMBDA_FUNCTION_NAME=%LAMBDA_FUNCTION_NAME: =%
set LAMBDA_FUNCTION_NAME_2=%LAMBDA_FUNCTION_NAME_2: =%

REM Set AWS credentials
set "AWS_ACCESS_KEY_ID=%ACCESS_KEY%"
set "AWS_SECRET_ACCESS_KEY=%SECRET_KEY%"
set "AWS_DEFAULT_REGION=%REGION%"

REM Get account ID from AWS
echo [1/8] Getting AWS account ID...
for /f "tokens=*" %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
if errorlevel 1 (
    echo ERROR: Failed to get account ID
    pause
    exit /b 1
)

REM Set ECR repository name (from template)
set REPO_NAME=quiz-ai
set ECR_URI=%ACCOUNT_ID%.dkr.ecr.%REGION%.amazonaws.com

REM [2/8] Build Docker image
echo [2/8] Building Docker image "%IMAGE_NAME%:latest"...
docker buildx build --provenance=false -t %IMAGE_NAME%:latest .
if errorlevel 1 (
    echo ERROR: Docker build failed
    pause
    exit /b 1
)

REM [3/8] Verify ECR repo existence - exit if not found
echo [3/8] Verifying ECR repository "%REPO_NAME%" exists in %REGION%...
aws ecr describe-repositories --repository-names "%REPO_NAME%" --region "%REGION%" >nul 2>nul
if errorlevel 1 (
    echo ERROR: ECR repository "%REPO_NAME%" not found in region %REGION%
    echo Please ensure the CloudFormation stack has been created first
    pause
    exit /b 1
)

REM [4/8] Clean up ALL old images before pushing new one
echo [4/8] Cleaning up old images...
for /f "tokens=*" %%i in ('aws ecr list-images --repository-name "%REPO_NAME%" --region "%REGION%" --query "imageIds[*].imageDigest" --output text') do (
    for %%d in (%%i) do (
        echo Deleting image: %%d
        aws ecr batch-delete-image --repository-name "%REPO_NAME%" --image-ids imageDigest=%%d --region "%REGION%"
    )
)

REM [5/8] Docker login to ECR
echo [5/8] Docker login to ECR...
aws ecr get-login-password --region "%REGION%" | docker login --username AWS --password-stdin "%ECR_URI%"
if errorlevel 1 (
    echo ERROR: Docker login to ECR failed
    pause
    exit /b 1
)

REM [6/8] Tag image for ECR
echo [6/8] Tagging image for ECR...
docker tag "%IMAGE_NAME%:latest" "%ECR_URI%/%REPO_NAME%:latest"
if errorlevel 1 (
    echo ERROR: Docker tag failed
    pause
    exit /b 1
)

REM [7/8] Push image to ECR
echo [7/8] Pushing image to ECR...
docker push "%ECR_URI%/%REPO_NAME%:latest"
if errorlevel 1 (
    echo ERROR: Docker push failed
    pause
    exit /b 1
)

REM [8/8] Update Lambda function with new image
echo [8/8] Updating Lambda function with new image...
for /f "tokens=*" %%i in ('aws ecr describe-images --repository-name "%REPO_NAME%" --region "%REGION%" --query "imageDetails[0].imageDigest" --output text') do set IMAGE_DIGEST=%%i

REM Use the exact role ARN that you confirmed works manually
set ROLE_ARN=arn:aws:iam::606635532364:role/lambda_execution_role

REM Check if Lambda function exists and update or create accordingly
aws lambda get-function --no-cli-pager --function-name "%LAMBDA_FUNCTION_NAME%" --region "%REGION%" >nul 2>nul
if errorlevel 1 (
    echo Lambda function does not exist, creating new function...
    aws lambda create-function --no-cli-pager --function-name "%LAMBDA_FUNCTION_NAME%" --package-type Image --code ImageUri="%ECR_URI%/%REPO_NAME%@%IMAGE_DIGEST%" --role "%ROLE_ARN%" --memory-size 128 --timeout 30 --region "%REGION%" >nul 2>nul
) else (
    echo Lambda function exists, updating with new image...
    aws lambda update-function-code --no-cli-pager --function-name "%LAMBDA_FUNCTION_NAME%" --image-uri "%ECR_URI%/%REPO_NAME%@%IMAGE_DIGEST%" --region "%REGION%" >nul 2>nul
)

REM Check if Lambda function exists and update or create accordingly
aws lambda get-function  --no-cli-pager --function-name "%LAMBDA_FUNCTION_NAME_2%" --region "%REGION%" >nul 2>nul
if errorlevel 1 (
    echo Lambda function does not exist, creating new function...
    aws lambda create-function  --no-cli-pager --function-name "%LAMBDA_FUNCTION_NAME_2%" --package-type Image --code ImageUri="%ECR_URI%/%REPO_NAME%@%IMAGE_DIGEST%" --role "%ROLE_ARN%" --memory-size 128 --timeout 30 --region "%REGION%"
) else (
    echo Lambda function exists, updating with new image...
    aws lambda update-function-code --no-cli-pager --function-name "%LAMBDA_FUNCTION_NAME_2%" --image-uri "%ECR_URI%/%REPO_NAME%@%IMAGE_DIGEST%" --region "%REGION%"
)

if errorlevel 1 (
    echo ERROR: Failed to update Lambda function
    pause
    exit /b 1
)

echo SUCCESS: Built, pushed and updated Lambda function with new image
echo New image URI: %ECR_URI%/%REPO_NAME%@%IMAGE_DIGEST%

 

REM Read PDF_TEST_FILE from aws_config.txt
set "PDF_TEST_FILE="
for /f "tokens=1,* delims==" %%A in ('findstr /b /i "PDF_TEST_FILE=" aws_config.txt') do (
  set "PDF_TEST_FILE=%%B"
)

REM Strip quotes if any (do this OUTSIDE the FOR block)
if defined PDF_TEST_FILE set "PDF_TEST_FILE=%PDF_TEST_FILE:"=%"

REM Print result
if not defined PDF_TEST_FILE (
  echo [ERROR] PDF_TEST_FILE not found in aws_config.txt
) else (
  echo PDF_TEST_FILE: %PDF_TEST_FILE%
)


REM Upload PDF test file to S3 input folder (keep original filename)
echo Uploading %PDF_TEST_FILE% to S3 input folder...
aws s3 cp "%PDF_TEST_FILE%" "s3://quiz-ai-bucket/ai-quiz/pdf-extract/input-folder/"
if errorlevel 1 (
    echo ERROR: Failed to upload file to S3
    pause
    exit /b 1
)
echo SUCCESS: File uploaded to S3



pause