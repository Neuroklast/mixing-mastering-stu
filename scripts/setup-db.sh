#!/usr/bin/env bash
set -euo pipefail

echo "🗄  SONORATIVA — Database Setup"
echo "================================"

if [ -z "${DATABASE_URI:-}" ]; then
  if [ -f ".env.local" ]; then
    export $(grep -v '^#' .env.local | grep DATABASE_URI | xargs)
  fi
fi

if [ -z "${DATABASE_URI:-}" ]; then
  echo "❌ DATABASE_URI is not set."
  echo "   Set it in .env.local or export it before running this script."
  exit 1
fi

echo "📊 Applying Supabase schema..."
psql "$DATABASE_URI" < supabase/schema.sql
echo "✅ Schema applied."

echo ""
echo "Now run: npx payload migrate"
