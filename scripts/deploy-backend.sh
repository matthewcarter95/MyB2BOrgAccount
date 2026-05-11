#!/bin/bash

# Full backend deployment script

set -e

ENVIRONMENT="${1:-dev}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "${SCRIPT_DIR}")"
REGION="${AWS_REGION:-us-east-1}"

echo "Deploying e-ADM Backend (${ENVIRONMENT})"
echo "=========================================="

# Check for required environment variables
if [ -z "${AUTH0_CLIENT_SECRET}" ]; then
  echo "Error: AUTH0_CLIENT_SECRET environment variable is required"
  exit 1
fi

if [ -z "${SESSION_ENCRYPTION_KEY}" ]; then
  echo "Error: SESSION_ENCRYPTION_KEY environment variable is required"
  echo "Generate one with: openssl rand -base64 32"
  exit 1
fi

# Build backend
echo ""
echo "1. Building backend..."
cd "${ROOT_DIR}/backend"
"${ROOT_DIR}/node_modules/esbuild/bin/esbuild" src/handler.ts \
  --bundle --platform=node --target=node20 \
  --outfile=dist/handler.js --format=cjs --external:@aws-sdk/*

# Package Lambda code
echo ""
echo "2. Packaging Lambda code..."
cd "${ROOT_DIR}/backend/dist"
zip -r "${ROOT_DIR}/backend/lambda.zip" handler.js

# Upload to S3 (optional, for larger deployments)
# aws s3 cp lambda.zip s3://your-deployment-bucket/eadm/lambda.zip

# Deploy CloudFormation stack
echo ""
echo "3. Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file "${ROOT_DIR}/infra/template.yaml" \
  --stack-name "eadm-backend-${ENVIRONMENT}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "${REGION}" \
  --parameter-overrides \
    Environment="${ENVIRONMENT}" \
    Auth0ClientSecret="${AUTH0_CLIENT_SECRET}" \
    SessionEncryptionKey="${SESSION_ENCRYPTION_KEY}" \
    FrontendUrl="${FRONTEND_URL:-https://myaccount.demo-connect.us}" \
    Auth0Domain="${AUTH0_DOMAIN:-violet-hookworm-18506.cic-demo-platform.auth0app.com}" \
    BackendUrl="${BACKEND_URL:-}"

# Update Lambda code
echo ""
echo "4. Updating Lambda code..."
FUNCTION_NAME="eadm-bff-${ENVIRONMENT}"
aws lambda update-function-code \
  --function-name "${FUNCTION_NAME}" \
  --zip-file "fileb://${ROOT_DIR}/backend/lambda.zip" \
  --region "${REGION}" > /dev/null

# Wait for update to complete
echo "Waiting for Lambda update..."
aws lambda wait function-updated \
  --function-name "${FUNCTION_NAME}" \
  --region "${REGION}"

# Add/update Function URL
echo ""
echo "5. Configuring Function URL..."
"${SCRIPT_DIR}/add-function-url.sh" "${ENVIRONMENT}"

echo ""
echo "Deployment complete!"
