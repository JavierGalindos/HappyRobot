#!/usr/bin/env bash
set -euo pipefail

BUCKET="happyrobot-dashboard-346133363539-us-east-1"
DISTRIBUTION_ID="E1KHUTDS8G3HFI"
DASHBOARD_DIR="$(cd "$(dirname "$0")/../dashboard" && pwd)"

echo "Building dashboard..."
cd "$DASHBOARD_DIR"
npm run build

echo "Uploading to S3..."
aws s3 sync dist "s3://$BUCKET" --delete

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" --output text

echo "Done! Dashboard deployed to https://d16gzu2xhnxo9q.cloudfront.net"