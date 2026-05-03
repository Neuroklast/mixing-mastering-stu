#!/usr/bin/env bash
set -euo pipefail

echo "🚀 SONORATIVA — Payload CMS Init"
echo "=================================="

echo "⚙️  Running Payload migrations..."
npx payload migrate

echo "📝 Generating Payload types..."
npx payload generate:types

echo "✅ Payload CMS is ready."
echo "   Start the dev server: npm run dev"
echo "   Admin panel: http://localhost:3000/admin-cms"
