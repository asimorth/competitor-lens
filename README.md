# CompetitorLens v2

A comprehensive competitor analysis platform for comparing Stablex with other cryptocurrency exchanges in Turkey and globally.

## Features

- 📊 **Feature Matrix**: Compare features across 21+ exchanges
- 📸 **Screenshot Gallery**: Visual evidence with 800+ categorized screenshots
- 🏢 **Exchange Profiles**: Detailed view of each competitor
- 📱 **Mobile Responsive**: Optimized for all devices
- 🎯 **TR Market Focus**: Special comparison view for Turkish exchanges
- 🔍 **Smart Search**: Find features and exchanges quickly

## Tech Stack

### Backend
- Node.js + Express.js
- TypeScript
- Prisma ORM + PostgreSQL
- Redis + BullMQ (job queues)
- OpenAI API (screenshot analysis)

### Frontend
- Next.js 15 (App Router)
- React 18
- Tailwind CSS
- Shadcn/ui Components
- TypeScript

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional for production)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/[your-username]/competitor-lens.git
cd competitor-lens
```

2. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Set up environment variables:

Backend (.env):
```env
DATABASE_URL="postgresql://username@localhost:5432/competitor_lens"
OPENAI_API_KEY="your-openai-api-key"
PORT=3001
NODE_ENV=development
```

Frontend (.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Set up database:
```bash
cd backend
npx prisma migrate deploy
npm run import:excel
npm run import:screenshots:smart
```

5. Start development servers:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit http://localhost:3000

## Deployment

### Using Docker (Recommended)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

## Project Structure

```
competitor-lens/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── scripts/
│   ├── prisma/
│   └── uploads/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── public/
└── docker/
```

## License

Private - All rights reserved# Trigger Railway redeploy
