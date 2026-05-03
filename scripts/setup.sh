#!/usr/bin/env bash
set -euo pipefail

echo "🎛  SONORATIVA — Local Setup"
echo "================================"

# 1. Check Node version
REQUIRED_NODE="18"
CURRENT_NODE=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$CURRENT_NODE" -lt "$REQUIRED_NODE" ]; then
  echo "❌ Node.js >= $REQUIRED_NODE required (found v$CURRENT_NODE)"
  exit 1
fi

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm ci

# 3. Copy env file if not present
if [ ! -f ".env.local" ]; then
  cp .env.local.example .env.local
  echo "✅ Created .env.local from template. Edit it with your credentials."
else
  echo "ℹ️  .env.local already exists — skipping."
fi

# 4. Run tests
echo "🧪 Running unit/integration tests..."
npm test

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env.local with your Supabase + Payload credentials"
echo "  2. Run: psql \$POSTGRES_URL_NON_POOLING < supabase/schema.sql    (first time only)"
echo "  3. Run: npm run migrate                                          (first time only)"
echo "  4. Run: npx payload generate:types                               (after schema changes)"
echo "  5. Run: npm run dev"
