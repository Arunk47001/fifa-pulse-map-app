#!/usr/bin/env bash
# Deploy the PulseMap frontend to Firebase Hosting (Spark plan — 100% free,
# no credit card required). The frontend calls the existing Render backend
# directly (CORS is already open on the Express server), so no Cloud Run /
# Blaze plan is needed.
#
# Prereqs (one-time, not run by this script):
#   1. npm install -g firebase-tools
#   2. firebase login
# .firebaserc already points at the live "pulsemap-fifa2026" project.
#
# Usage:
#   ./scripts/deploy-gcp.sh
#
# Backend URL defaults to the already-deployed Render service; override with
# BACKEND_URL if you redeploy the backend elsewhere.

set -euo pipefail

BACKEND_URL="${BACKEND_URL:-https://pulsemap-backend.onrender.com}"

echo "==> Building frontend against backend: $BACKEND_URL"
( cd frontend && npm install && VITE_API_URL="$BACKEND_URL/api" npm run build )

echo "==> Deploying to Firebase Hosting"
firebase deploy --only hosting

echo "==> Done. Firebase printed your Hosting URL above."
