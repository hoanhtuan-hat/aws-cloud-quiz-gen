@echo off
setlocal enabledelayedexpansion

echo Starting cleanup process...

rem Clear any existing SSO sessions and cache
echo Cleaning up any existing SSO sessions...
aws sso logout 2>nul
if exist "%USERPROFILE%\.aws\sso\cache" (
    rmdir /s /q "%USERPROFILE%\.aws\sso\cache" 2>nul
    echo Cleared SSO cache
)

rem Read config file and set variables
for /f "tokens=1,* delims==" %%a in (aws_config.txt) do (
    if "%%a"=="ACCESS_KEY" set ACCESS_KEY=%%b
    if "%%a"=="SECRET_KEY" set SECRET_KEY=%%b
    if "%%a"=="REGION" set REGION=%%b
    if "%%a"=="LOGIN_NAME" set LOGIN_NAME=%%b
)

rem Configure AWS CLI with explicit profile
aws configure set aws_access_key_id %ACCESS_KEY% --profile cleanup-profile
aws configure set aws_secret_access_key %SECRET_KEY% --profile cleanup-profile
aws configure set region %REGION% --profile cleanup-profile
aws configure set output json --profile cleanup-profile

rem Verify login credentials
echo Verifying AWS login credentials...
aws sts get-caller-identity --profile cleanup-profile > nul 2>&1
if errorlevel 1 (
    echo ERROR: Login failed. Please check your credentials in aws_config.txt
    pause
    exit /b 1
) else (
    echo Login successful for user: %LOGIN_NAME%
)

rem Delete CloudFormation stack if exists
echo Checking for CloudFormation stack...
aws cloudformation describe-stacks --stack-name quiz-ai-stack --profile cleanup-profile > nul 2>nul
if not errorlevel 1 (
    echo Deleting CloudFormation stack...
    aws cloudformation delete-stack --stack-name quiz-ai-stack --profile cleanup-profile
    echo Waiting for stack deletion to complete...
    aws cloudformation wait stack-delete-complete --stack-name quiz-ai-stack --profile cleanup-profile
    echo CloudFormation stack deleted successfully
) else (
    echo No CloudFormation stack found
)

rem Delete SSM parameters
echo Deleting SSM parameters...
for /f "tokens=*" %%p in ('aws ssm get-parameters-by-path --path "/ai-quiz/" --profile cleanup-profile --query "Parameters[].Name" --output text 2^>nul') do (
    echo Deleting parameter: %%p
    aws ssm delete-parameter --name %%p --profile cleanup-profile
)

rem S3 bucket deletion with force option
echo.
set /p "deleteOption=Do you want to delete only related S3 buckets? (Y/N): "
if /i "!deleteOption!"=="Y" (
    echo Deleting only related S3 buckets...
    for /f "tokens=*" %%b in ('aws s3api list-buckets --profile cleanup-profile --query "Buckets[?contains(Name, 'quiz-ai')].Name" --output text 2^>nul') do (
        echo Force deleting bucket: %%b
        call :ForceDeleteBucket "%%b"
    )
) else if /i "!deleteOption!"=="N" (
    rem set /p "confirmDelete=WARNING: This will delete ALL S3 buckets. Are you sure? (Y/N): "
    rem if /i "!confirmDelete!"=="Y" (
        echo Force deleting ALL S3 buckets...
        for /f "tokens=*" %%b in ('aws s3api list-buckets --profile cleanup-profile --query "Buckets[].Name" --output text 2^>nul') do (
            echo Force deleting bucket: %%b
            call :ForceDeleteBucket "%%b"
        )
    rem) else (
    rem    echo Skipping S3 bucket deletion.
    rem )
) else (
    echo Invalid option. Skipping S3 bucket deletion.
)

rem Delete ECR repository
echo Checking for ECR repositories...
for /f "tokens=*" %%r in ('aws ecr describe-repositories --profile cleanup-profile --query "repositories[?contains(repositoryName, 'quiz-ai')].repositoryName" --output text 2^>nul') do (
    echo Deleting ECR repository: %%r
    aws ecr delete-repository --repository-name %%r --force --profile cleanup-profile
)

rem Additional cleanup suggestions:
echo.
echo Additional cleanup suggestions:
echo 1. Check CloudWatch logs for any remaining log groups
echo 2. Check IAM roles/policies created by the stack
echo 3. Check Lambda functions if any were created
echo 4. Check API Gateway resources if any were created

echo Cleanup process completed
pause
exit /b 0

:ForceDeleteBucket
set BUCKET_NAME=%~1
echo Emptying bucket: !BUCKET_NAME!

rem Delete all objects and versions in the bucket
aws s3api list-object-versions --bucket !BUCKET_NAME! --profile cleanup-profile --query "{Objects: Versions[].{Key:Key, VersionId:VersionId}}" > objects.json 2>nul
if exist objects.json (
    aws s3api delete-objects --bucket !BUCKET_NAME! --delete file://objects.json --profile cleanup-profile >nul 2>nul
    del objects.json
)

rem Delete all delete markers in the bucket
aws s3api list-object-versions --bucket !BUCKET_NAME! --profile cleanup-profile --query "{Objects: DeleteMarkers[].{Key:Key, VersionId:VersionId}}" > delete_markers.json 2>nul
if exist delete_markers.json (
    aws s3api delete-objects --bucket !BUCKET_NAME! --delete file://delete_markers.json --profile cleanup-profile >nul 2>nul
    del delete_markers.json
)

rem Delete the bucket
aws s3api delete-bucket --bucket !BUCKET_NAME! --profile cleanup-profile
if errorlevel 1 (
    echo WARNING: Could not delete bucket !BUCKET_NAME! - it may still have objects or be in another region
) else (
    echo Successfully deleted bucket: !BUCKET_NAME!
)
exit /b 0