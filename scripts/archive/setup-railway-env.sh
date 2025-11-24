#!/bin/bash
set -e

echo "🚂 Railway Environment Variables Setup"
echo "====================================="

# Generate JWT Secret
JWT_SECRET=$(openssl rand -base64 32)

# Set all environment variables
echo "Setting environment variables..."

railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set JWT_SECRET=$JWT_SECRET
railway variables set OPENAI_API_KEY=${OPENAI_API_KEY:-"sk-your-openai-key"}
railway variables set ALLOWED_ORIGINS="https://competitor-lens.vercel.app,http://localhost:3000"
railway variables set RATE_LIMIT_PUBLIC=100

# Prisma Accelerate URL
railway variables set DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19Pbm1MaF9hY2Y3YXlGcDM0NVIyRVYiLCJhcGlfa2V5IjoiMDFLNllYTjhHUk5LVDZQTURUN0o2UE5OVjciLCJ0ZW5hbnRfaWQiOiJkYWEwZWQwYmE4NDQxMTVjN2NjMjg2OGMyMjFhN2ZmODc3YWQ2YTFlZWZlM2Q0ZjIxNGQ1OGRiMzA2YzVkYTY0IiwiaW50ZXJuYWxfc2VjcmV0IjoiODFkYWMwODktMWE3My00Nzg5LTkwOGQtZTMzYWY4ZGEzNTZiIn0.eJmtPhzrSMu283EQoAJF2NdvYBmB7mLGfHk1fkxsR6w"

echo "✅ Environment variables set!"
echo ""
echo "Generated JWT_SECRET: $JWT_SECRET"
echo ""
echo "Next steps:"
echo "1. Get your direct database URL: railway variables"
echo "2. Set DIRECT_DATABASE_URL for migrations"
