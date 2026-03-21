#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
INFRA_DIR="$PROJECT_DIR/infra"

echo "=== Refreshing AWS credentials ==="
ada credentials update --account=346133363539 --provider=conduit --role=IibsAdminAccess-DO-NOT-DELETE --once
export AWS_PROFILE=default
unset AWS_DEFAULT_PROFILE
export CDK_DOCKER=finch

# Ensure finch VM is running
if ! finch vm status 2>/dev/null | grep -q "Running"; then
  echo "Starting finch VM..."
  finch vm init 2>/dev/null || true
  finch vm start 2>/dev/null || true
fi

echo "=== Building Docker image & deploying CDK stack ==="

cd "$INFRA_DIR"

# Bootstrap CDK (idempotent — safe to run every time)
echo "Bootstrapping CDK..."
cdk bootstrap

# Deploy
echo "Deploying stack..."
cdk deploy --require-approval never --outputs-file "$PROJECT_DIR/cdk-outputs.json"

echo ""
echo "=== Deployment complete ==="
echo "Outputs saved to cdk-outputs.json"
cat "$PROJECT_DIR/cdk-outputs.json"
