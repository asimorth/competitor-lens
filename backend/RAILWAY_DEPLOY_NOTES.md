# Railway Deployment Notes

## CRITICAL: No Database Migrations!

### Why?
- Production database already has complete schema
- All tables, relations, and data exist
- Running migrations causes **P3005 error**: "database schema is not empty"

### What Railway Should Do:
1. ✅ Install dependencies (`npm ci`)
2. ✅ Generate Prisma Client (`npx prisma generate`)
3. ✅ Build TypeScript (`npm run build`)
4. ✅ Start server (`node start-railway.js`)

### What Railway Should NOT Do:
- ❌ Run `prisma migrate deploy`
- ❌ Run `prisma migrate reset`
- ❌ Run `prisma db push`
- ❌ Any database schema changes

### Configuration Files:
- `nixpacks.toml`: Build configuration (no migration commands)
- `.railwayignore`: Excludes `prisma/migrations/` folder
- `.gitignore`: Ignores migrations (not tracked in git)
- `start-railway.js`: Startup script with validation

### If Database Schema Needs Update:
1. Update `prisma/schema.prisma` locally
2. Test locally with `npx prisma db push`
3. When working, update production DB manually via Railway console
4. Deploy new code (Prisma Client will use new schema)

### Environment Variables Required:
- `DATABASE_URL`: Prisma Accelerate connection string
- `DIRECT_DATABASE_URL`: Direct PostgreSQL connection (optional)
- `NODE_ENV`: "production"
- `PORT`: Auto-assigned by Railway

### Troubleshooting:
If you see "database schema is not empty" error:
1. Check if `prisma/migrations/` folder exists in deployment
2. Check Railway logs for `prisma migrate` commands
3. Ensure `.railwayignore` includes `prisma/migrations/`
4. Ensure nixpacks.toml only runs `prisma generate`

