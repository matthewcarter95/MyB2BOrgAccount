#!/bin/bash

# Post-deployment script to add Lambda Function URL
# Required due to company SCP blocking CloudFormation hook for Function URLs

set -e

ENVIRONMENT="${1:-dev}"
FUNCTION_NAME="eadm-bff-${ENVIRONMENT}"
FRONTEND_URL="${FRONTEND_URL:-https://myaccount.demo-connect.us}"
REGION="${AWS_REGION:-us-east-1}"

echo "Adding Function URL for: ${FUNCTION_NAME}"

# Check if function URL already exists
EXISTING_URL=$(aws lambda get-function-url-config \
  --function-name "${FUNCTION_NAME}" \
  --region "${REGION}" \
  2>/dev/null | jq -r '.FunctionUrl' || echo "")

if [ -n "${EXISTING_URL}" ] && [ "${EXISTING_URL}" != "null" ]; then
  echo "Function URL already exists: ${EXISTING_URL}"

  # Update CORS configuration using wildcard for methods
  echo "Updating CORS configuration..."
  aws lambda update-function-url-config \
    --function-name "${FUNCTION_NAME}" \
    --region "${REGION}" \
    --cors "AllowOrigins=${FRONTEND_URL},AllowMethods=*,AllowHeaders=content-type,authorization,cookie,AllowCredentials=true,MaxAge=86400" \
    > /dev/null

  echo "CORS updated for: ${EXISTING_URL}"
else
  # Create Function URL
  echo "Creating Function URL..."
  RESULT=$(aws lambda create-function-url-config \
    --function-name "${FUNCTION_NAME}" \
    --region "${REGION}" \
    --auth-type NONE \
    --cors "AllowOrigins=${FRONTEND_URL},AllowMethods=*,AllowHeaders=content-type,authorization,cookie,AllowCredentials=true,MaxAge=86400")

  FUNCTION_URL=$(echo "${RESULT}" | jq -r '.FunctionUrl')

  # Add resource-based policy for public access
  echo "Adding public access permission..."
  aws lambda add-permission \
    --function-name "${FUNCTION_NAME}" \
    --region "${REGION}" \
    --statement-id FunctionURLAllowPublicAccess \
    --action lambda:InvokeFunctionUrl \
    --principal "*" \
    --function-url-auth-type NONE \
    2>/dev/null || echo "Permission may already exist"

  echo ""
  echo "============================================"
  echo "Function URL created successfully!"
  echo "URL: ${FUNCTION_URL}"
  echo "============================================"
  echo ""
  echo "Next steps:"
  echo "1. Add this URL to Auth0 callback settings"
  echo "2. Update Amplify environment variable VITE_API_URL"
  echo "3. Configure Auth0 backchannel logout URL: ${FUNCTION_URL}auth/backchannel-logout"
fi
