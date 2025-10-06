#!/bin/bash

# Railway Database Setup Script

echo "🚀 Railway Database Setup"
echo "========================"

# Railway'de çalıştırılacak komutlar:
echo ""
echo "1. Railway Dashboard'da Database bölümüne gidin"
echo "2. 'Connect' butonuna tıklayın ve connection string'i kopyalayın"
echo "3. Aşağıdaki komutları sırayla çalıştırın:"
echo ""
echo "# Prisma migrations"
echo "cd backend"
echo "npx prisma migrate deploy"
echo ""
echo "# Excel verilerini import et"
echo "npm run import:excel"
echo ""
echo "# Screenshot'ları import et" 
echo "npm run import:screenshots:smart"
echo ""
echo "# Veya tek seferde hepsini:"
echo "cd backend && npx prisma migrate deploy && npm run import:excel && npm run import:screenshots:smart"
