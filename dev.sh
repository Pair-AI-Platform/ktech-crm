#!/bin/bash
# Auto-restarting dev server wrapper
# Restarts the Next.js dev server if it crashes unexpectedly

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  echo ""
  echo "[dev] Shutting down..."
  kill $DEV_PID 2>/dev/null
  wait $DEV_PID 2>/dev/null
  rm -f "$SCRIPT_DIR/.next/dev/lock"
  exit 0
}

trap cleanup INT TERM

while true; do
  # Remove stale lock file from previous crash
  rm -f "$SCRIPT_DIR/.next/dev/lock"

  echo "[dev] Starting Next.js dev server..."
  NODE_OPTIONS='--max-old-space-size=4096' npx next dev --turbopack "$@" &
  DEV_PID=$!
  wait $DEV_PID
  EXIT_CODE=$?

  # Exit code 0 or 130 (Ctrl+C) = intentional stop
  if [ $EXIT_CODE -eq 0 ] || [ $EXIT_CODE -eq 130 ]; then
    echo "[dev] Server stopped gracefully."
    rm -f "$SCRIPT_DIR/.next/dev/lock"
    exit 0
  fi

  echo ""
  echo "[dev] Server crashed with exit code $EXIT_CODE. Restarting in 2 seconds..."
  echo ""
  sleep 2
done
