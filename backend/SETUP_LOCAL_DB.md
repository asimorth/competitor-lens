# Local Database Setup Guide

## Quick Setup (macOS/Linux)

### 1. Install PostgreSQL

```bash
# macOS (Homebrew)
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Local Database

```bash
# Create database
createdb competitor_lens_dev

# Or using psql
psql postgres
CREATE DATABASE competitor_lens_dev;
\q
```

### 3. Setup Environment

```bash
cd backend

# Copy example env
cp .env.example .env

# .env should have:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/competitor_lens_dev"
DIRECT_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/competitor_lens_dev"
```

### 4. Push Schema to Local DB

```bash
# This creates all tables
npx prisma db push

# Verify
npx prisma studio
```

### 5. Start Development Server

```bash
npm run dev
```

## Production vs Local

### Local Development
- ✅ Uses local PostgreSQL
- ✅ `prisma db push` for quick schema changes
- ✅ Full control, no limits
- ✅ Works offline

### Production (Railway)
- ✅ Uses Prisma Accelerate (connection pooling)
- ✅ Schema already exists (NO migrations needed)
- ✅ Only `prisma generate` runs
- ✅ Automatic deployment

## Troubleshooting

### PostgreSQL not running?
```bash
# Check status
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Restart
brew services restart postgresql@16
sudo systemctl restart postgresql
```

### Cannot connect to database?
```bash
# Check connection
psql postgres -c "SELECT version();"

# Check if database exists
psql -l | grep competitor_lens_dev
```

### Schema out of sync?
```bash
# Reset local DB
npx prisma db push --force-reset

# Or start fresh
dropdb competitor_lens_dev
createdb competitor_lens_dev
npx prisma db push
```

## Sample Data (Optional)

```bash
# Import sample data
psql competitor_lens_dev < ../sample-data/seed.sql

# Or use Prisma seed
npm run seed
```

## Multiple Developers

Each developer should:
1. Have their own local PostgreSQL
2. Have their own `.env` file (never commit!)
3. Run `npx prisma db push` to create schema
4. Work independently without conflicts

## Environment Variables

### Required for Local Development
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/competitor_lens_dev"
NODE_ENV=development
PORT=3001
```

### Optional
```env
OPENAI_API_KEY=sk-your-key  # For AI features
REDIS_URL=redis://localhost:6379  # For caching
```

