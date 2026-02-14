# AI Factory

AI-powered newsletter generation pipeline by **GAI Insights**.

Crawls web sources, ranks articles using Gemini AI, generates summaries, and produces HTML newsletters — all through a clean admin UI.

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript, Tailwind)
- **Database**: Neon Postgres via Prisma 7
- **AI**: Google Gemini (structured JSON output)
- **Crawling**: jsdom + @mozilla/readability
- **Exports**: ExcelJS (XLSX), JSON, HTML newsletters

## 7-Phase Pipeline

1. **Extract Information** — Parse topic, generate keywords via AI
2. **Source Articles** — Crawl RSS feeds and HTML pages for article links
3. **Grab Articles** — Fetch content, check relevancy, deduplicate
4. **Rank Articles** — AI scoring with tier classification (Essential/Important/Optional)
5. **Summarise Articles** — Generate newsletter-ready summaries
6. **Generate Newsletter** — Build HTML newsletter grouped by tier
7. **Save & Finalize** — Mark run complete, enable exports

## Setup

### Prerequisites
- Node.js 20+
- Neon Postgres database
- Google Gemini API key

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-2.0-flash
ADMIN_TOKEN=your-secret-token
```

### Local Development

```bash
npm install
npx prisma db push    # Create tables in Neon
npm run dev            # http://localhost:3000
```

### Deploy to Vercel

Push to `main` branch — auto-deploys via Vercel. Ensure env vars are set in Vercel dashboard.

## Usage

1. Set your admin token in the top-right input
2. Create a Profile with source URLs and keywords
3. Create a Run, optionally linking a profile
4. Execute phases one-by-one or click "Run All Remaining"
5. In Guided mode, review and toggle articles between phases
6. Export as JSON, XLSX, or view the HTML newsletter

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/runs` | No | List all runs |
| POST | `/api/runs` | Yes | Create a run |
| GET | `/api/runs/[id]` | No | Run detail with articles |
| POST | `/api/runs/[id]/phase/[name]` | Yes | Execute a phase |
| PATCH | `/api/runs/[id]/articles` | Yes | Toggle article keep/drop |
| GET | `/api/runs/[id]/export/json` | No | JSON export |
| GET | `/api/runs/[id]/export/xlsx` | No | XLSX download |
| GET | `/api/runs/[id]/newsletter` | No | HTML newsletter |
| GET/POST/PUT/DELETE | `/api/profiles` | Mixed | Profile CRUD |
