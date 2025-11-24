# 🎯 Competitor Lens - Smart Multi-Persona Platform

Kripto borsa rakip analizi için data-driven, AI-powered platform. 3 farklı kullanıcı tipi için optimize edilmiş UX.

## 🚀 Features

### Multi-Persona Architecture
- **Product Managers:** Strategic analysis, opportunity scoring, gap analysis
- **Product Designers:** Screenshot quality, UI patterns, visual benchmarks  
- **Executives:** High-level metrics, positioning, strategic insights

### Intelligent Data Foundation
- AI-powered screenshot assignment
- Quality validation & scoring
- Automated feature detection
- Confidence-based analysis

### Smart UX
- Persona-aware views (toggle between PM/Designer/Executive)
- Context-aware breadcrumbs & navigation
- Data quality indicators
- Actionable insights & recommendations

---

## 📚 Documentation

### Current (Active)
- **[Smart Frontend Implementation](docs/current/SMART_FRONTEND_IMPLEMENTATION.md)** - Multi-persona UX details
- **[Deployment Guide](docs/current/DEPLOYMENT_GUIDE_SMART_FRONTEND.md)** - Production deployment
- **[Migration Instructions](docs/current/MIGRATION_INSTRUCTIONS.md)** - Database migrations
- **[Local Test Guide](docs/current/LOCAL_TEST_GUIDE.md)** - Local development
- **[Railway Connect Guide](docs/current/RAILWAY_CONNECT_GUIDE.md)** - Railway connection
- **[Screenshot Fix](docs/current/SCREENSHOT_FIX_COMPLETE.md)** - Screenshot serving solution
- **[Quick Fix UX](docs/current/QUICK_FIX_UX.md)** - UX troubleshooting
- **[Final Status](docs/current/FINAL_DEPLOYMENT_STATUS.md)** - Current deployment status

### Archive
Historical documentation in `docs/archive/` (deployment history, old fixes, setup notes)

---

## 🏗️ Tech Stack

### Backend
- **Runtime:** Node.js 20 + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (Railway)
- **ORM:** Prisma with Accelerate
- **AI:** OpenAI + Tesseract OCR
- **Deployment:** Railway (Docker)

### Frontend
- **Framework:** Next.js 15 (React 19)
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** React Context (PersonaContext)
- **Deployment:** Vercel

---

## 🚀 Quick Start

### Local Development

```bash
# Clone repository
git clone https://github.com/asimorth/competitor-lens.git
cd competitor-lens

# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

**Frontend:** http://localhost:3000 (or 3001)
**Backend:** http://localhost:3002

### Environment Variables

```bash
# Backend (.env)
DATABASE_URL="your-postgres-url"
OPENAI_API_KEY="your-key"

# Frontend (.env.local)
NEXT_PUBLIC_API_URL="http://localhost:3002"
```

---

## 📊 Production URLs

- **Frontend:** https://competitor-lens-prod.vercel.app
- **Backend API:** https://competitor-lens-production.up.railway.app
- **Health Check:** https://competitor-lens-production.up.railway.app/health

---

## 🎯 Multi-Persona Usage

### As Product Manager
1. Navigate to feature/competitor pages
2. Select "Product Manager" from persona toggle (top-right)
3. View: Strategic analysis, opportunity scores, gap analysis
4. Get: Actionable recommendations, roadmap suggestions

### As Product Designer
1. Select "Product Designer" persona
2. View: Screenshot galleries, quality metrics, UI patterns
3. Get: Visual benchmarks, coverage gaps, design recommendations

### As Executive
1. Select "Executive" persona
2. View: High-level metrics, market positioning
3. Get: One-liner insights, strategic actions, risk assessment

---

## 🔧 Maintenance

### Database Migrations
See: [Migration Instructions](docs/current/MIGRATION_INSTRUCTIONS.md)

### Deployment
See: [Deployment Guide](docs/current/DEPLOYMENT_GUIDE_SMART_FRONTEND.md)

### Troubleshooting
See: [Quick Fix UX](docs/current/QUICK_FIX_UX.md)

---

## 📈 Project Stats

- **Competitors:** 20 exchanges (TR + Global)
- **Features:** 44 tracked features
- **Screenshots:** 1,320 (851 in production DB)
- **Coverage:** ~64% market average
- **Code:** ~15,000 LOC (Backend + Frontend)
- **API Endpoints:** 50+ REST endpoints

---

## 🤝 Contributing

1. Create feature branch
2. Implement changes
3. Test locally
4. Submit PR to `main`
5. Auto-deploy on merge

---

## 📝 Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

---

**Built with ❤️ for competitive intelligence**
