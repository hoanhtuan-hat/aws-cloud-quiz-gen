# PerX — Gamified Learning & Mentorship on AWS

PerX is a serverless learning platform with gamified engagement and mentorship workflows.

The repository has two top-level folders:

aws/ — Backend (infrastructure as code, configuration, and Lambda services deployed on AWS)

website/ — Frontend (static web app, API integration)

# Objectives

Deliver a production-ready MVP for a learning platform with XP/badges/leaderboards and mentor–mentee flows.

Use a fully serverless and event-driven architecture for scale and cost efficiency.

Provide automated quiz generation/refresh using the Gemini API from input PDFs, and publish quiz JSON + generated PDFs to S3.

Keep services modular with versioned CI/CD and automation shell scripting (Bash) for repeatable releases.

# Architecture Overview

Frontend hosting: Amplify Hosting + CloudFront (global CDN)

API layer: Amazon API Gateway (REST)

Compute: AWS Lambda (Python 3.12) with idempotent handlers

Events: Amazon EventBridge for asynchronous orchestration

Storage: Amazon S3 for PDFs, quiz JSON, and generated PDFs

Config/Secrets: AWS Systems Manager Parameter Store

Packaging: Amazon ECR + Docker (optional, for container image Lambdas)

Observability: Amazon CloudWatch (logs, metrics, alarms)

Access Control: AWS IAM with least-privilege policies

IaC: AWS CloudFormation / SAM for repeatable environments

Quiz Pipeline (Gemini)


# Process:
The browser creates a JobID (hash of the PDF content) and calls an API Gateway to store it in S3.

S3 triggers a Lambda function to read the PDF from S3 (using the JobID) and extract its text.

The Lambda function then emits an EventBridge event.

A worker Lambda function consumes the event, calls the Gemini API to generate questions/answers, writes the quiz in JSON, and then generates a PDF back to S3.

The client polls for the job status (using the JobID) from the gateway API and updates the UI when it receives the JSON response."


# Prerequisites

AWS account with permissions to create CloudFormation stacks (including IAM roles/policies)
AWS CLI v2 installed and configured
Python 3.12
Docker Desktop (optional; for container builds)
Git (optional)
 
Getting Started
# 1) Clone
git clone https://hoanhtuan-hat/aws-cloud-quiz-gen

cd aws

# 2) Configure secret
Once downloaded, rename the file secret_key_file-readme.txt to secret_key.txt. You will need to provide your Access ID, Secret Key, and Gemini API key within this file.

# 3)Deploy resources
Using AWS CloudFormation to deploy 'AWS_template.yaml'

Run create resource.bat to create resource

Start docker desktop

Run update_image.bat to build image and push to ECR
 
