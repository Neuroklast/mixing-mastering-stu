#!/usr/bin/env bash
set -euo pipefail

echo "🗄  SONORATIVA — Database Setup"
echo "================================"

if [ -z "${POSTGRES_URL_NON_POOLING:-}" ]; then
  if [ -f ".env.local" ]; then
    set -a
    # shellcheck source=/dev/null
    source .env.local
    set +a
  fi
fi

if [ -z "${POSTGRES_URL_NON_POOLING:-}" ]; then
  echo "❌ POSTGRES_URL_NON_POOLING is not set."
  echo "   Set it in .env.local or export it before running this script."
  exit 1
fi

echo "📊 Applying Supabase schema..."
psql "$POSTGRES_URL_NON_POOLING" < supabase/schema.sql
echo "✅ Schema applied."

echo ""
echo "Now run: npm run migrate"
