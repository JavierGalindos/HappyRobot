#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/../dashboard"

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting dashboard on http://localhost:5173"
npm run dev