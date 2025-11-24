# 📁 Project Structure - Competitor Lens

## 🗂️ Organized Documentation

### Root Directory (Clean!)
```
/competitor-lens/
├── README.md                    # Main documentation
├── CHANGELOG.md                 # Version history
├── backend/                     # Backend application
├── frontend/                    # Frontend application
├── docs/                        # All documentation
└── scripts/                     # Utility scripts
```

### Documentation Structure
```
/docs/
├── current/                     # Active documentation
│   ├── SMART_FRONTEND_IMPLEMENTATION.md
│   ├── DEPLOYMENT_GUIDE_SMART_FRONTEND.md
│   ├── MIGRATION_INSTRUCTIONS.md
│   ├── LOCAL_TEST_GUIDE.md
│   ├── RAILWAY_CONNECT_GUIDE.md
│   ├── SCREENSHOT_FIX_COMPLETE.md
│   ├── QUICK_FIX_UX.md
│   ├── FINAL_DEPLOYMENT_STATUS.md
│   ├── CLEANUP_PLAN.md
│   └── PROJECT_STRUCTURE.md (this file)
│
├── archive/                     # Historical docs
│   ├── deployment/              # Old deployment notes
│   ├── railway-fixes/           # Old fix documentation
│   └── old-setup/               # Old setup guides
│
├── database/                    # Database-specific
│   ├── PRISMA_DATABASE_SETUP.md
│   ├── PRISMA_FINAL_GUIDE.md
│   └── DATABASE_INTEGRATION_COMPLETE.md
│
├── deployment/                  # Deployment guides
│   └── (existing deployment docs)
│
└── setup/                       # Setup guides
    └── (existing setup docs)
```

### Scripts Structure
```
/scripts/
├── apply-migration-railway.sh   # Migration helper
├── run-migration-now.sh         # Migration runner
├── run-migration-with-url.sh    # Manual migration
├── test-after-migration.sh      # Post-migration test
├── railway-import-screenshots.sh # Screenshot import
├── test-production-endpoints.sh  # Production API test
├── test-production-health.sh     # Health check
├── test-production.sh            # Full production test
│
├── sql/                         # SQL scripts
│   ├── COPY_PASTE_THIS.sql      # Migration SQL
│   ├── import-basic-data.sql
│   ├── import-screenshots.sql
│   ├── import-missing-screenshots.sql
│   ├── test-screenshot-paths.sql
│   └── data_dump.sql
│
└── archive/                     # Old scripts
    ├── deploy-*.sh
    ├── setup-*.sh
    └── (old deployment scripts)
```

---

## 📊 Cleanup Summary

### Before
```
38 .md files in root
20+ .sh scripts scattered
Multiple .sql files
Duplicates and outdated docs
```

### After
```
Root: 2 .md files (README, CHANGELOG)
docs/current/: 10 active docs
docs/archive/: 25+ historical docs
scripts/: Organized by category
scripts/sql/: All SQL in one place
```

---

## 🎯 Quick Navigation

### For Development
- **Setup:** `docs/current/LOCAL_TEST_GUIDE.md`
- **API:** Check `backend/README.md` (if exists)

### For Deployment
- **Production:** `docs/current/DEPLOYMENT_GUIDE_SMART_FRONTEND.md`
- **Migration:** `docs/current/MIGRATION_INSTRUCTIONS.md`
- **Railway:** `docs/current/RAILWAY_CONNECT_GUIDE.md`

### For Features
- **Smart UX:** `docs/current/SMART_FRONTEND_IMPLEMENTATION.md`
- **Screenshots:** `docs/current/SCREENSHOT_FIX_COMPLETE.md`

### For Troubleshooting
- **Quick Fixes:** `docs/current/QUICK_FIX_UX.md`
- **Status:** `docs/current/FINAL_DEPLOYMENT_STATUS.md`

---

## 📈 Benefits

✅ **Clean root directory** - Easy to navigate
✅ **Organized docs** - Find what you need fast
✅ **Historical record** - Old docs preserved in archive
✅ **Clear structure** - Logical categorization
✅ **Reduced clutter** - 38 files → 2 in root

---

**Last Updated:** 2025-11-24
**Cleanup By:** Smart organization & archival

