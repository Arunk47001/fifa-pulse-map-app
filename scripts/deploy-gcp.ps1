# Deploy the PulseMap frontend to Firebase Hosting (Spark plan -- 100% free,
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
#   .\scripts\deploy-gcp.ps1
#
# Backend URL defaults to the already-deployed Render service; override with
# $env:BACKEND_URL if you redeploy the backend elsewhere.

$ErrorActionPreference = "Stop"

$BackendUrl = if ($env:BACKEND_URL) { $env:BACKEND_URL } else { "https://pulsemap-backend.onrender.com" }

Write-Host "==> Building frontend against backend: $BackendUrl"
Push-Location frontend
npm install
$env:VITE_API_URL = "$BackendUrl/api"
npm run build
Remove-Item Env:\VITE_API_URL
Pop-Location

Write-Host "==> Deploying to Firebase Hosting"
firebase deploy --only hosting

Write-Host "==> Done. Firebase printed your Hosting URL above."
