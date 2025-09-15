@echo off
setlocal enabledelayedexpansion

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
echo Getting AWS account ID...
for /f "tokens=*" %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
if errorlevel 1 (
    echo ERROR: Failed to get account ID
    pause
    exit /b 1
)


REM Read PDF_TEST_FILE from aws_config.txt
set "PDF_TEST_FILE="
for /f "tokens=1,* delims==" %%A in ('findstr /b /i "PDF_TEST_FILE=" aws_config.txt') do (
  set "PDF_TEST_FILE=%%B"
)

if defined PDF_TEST_FILE set "PDF_TEST_FILE=%PDF_TEST_FILE:"=%"

REM Print result
if not defined PDF_TEST_FILE (
  echo [ERROR] PDF_TEST_FILE not found in aws_config.txt
) else (
  echo PDF_TEST_FILE: %PDF_TEST_FILE%
)

REM ---- Delete same filename on S3 before uploading ----
REM Get file name (name + extension) from local path
for %%F in ("%PDF_TEST_FILE%") do set "BASENAME=%%~nxF"

REM Compose full S3 object key (same folder you are uploading to)
set "DEST_S3=s3://quiz-ai-bucket/ai-quiz/pdf-extract/input-folder/%BASENAME%"

echo Deleting old object if exists: %DEST_S3%
aws s3 rm "%DEST_S3%" --region %REGION% >nul 2>nul
REM (No error if object not found; we ignore output)
REM ------------------------------------------------------
 
 
if errorlevel 1 (
    echo ERROR: Failed to delete file to S3
    pause
    exit /b 1
)
echo SUCCESS: File deleted

pause