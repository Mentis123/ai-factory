# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: AI Factory

**Type:** GAI Insights consulting product — AI-powered newsletter generation pipeline
**Status:** Active Development (MVP shipped)
**Parent:** `GAIInsights/` (night job — AI consulting)
**Repo:** `Mentis123/ai-factory` (connected to Vercel, push-to-deploy)

## What This Is

An automated newsletter curation system targeting SME leaders interested in Generative AI. The system crawls web sources, ranks articles using Gemini AI, generates summaries, and produces templated HTML newsletters.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript, Tailwind)
- **Database:** Neon Postgres via Prisma 7 + @prisma/adapter-neon
- **AI:** Google Gemini via @google/genai SDK (structured JSON output)
- **Crawling:** jsdom + @mozilla/readability
- **Concurrency:** p-limit@4
- **Exports:** ExcelJS (XLSX), JSON, HTML newsletters
- **Validation:** Zod v4 + zod-to-json-schema (with adapter for Gemini Type enums)
- **Auth:** Simple ADMIN_TOKEN header check

## Key Architecture Decisions

- **Prisma 7** requires `@prisma/adapter-neon` — no `url` in schema, adapter passed at construction
- **Gemini schema adapter** converts JSON Schema `"string"` → `Type.STRING` etc.
- **Lazy Gemini init** — `GoogleGenAI` constructed on first call, not at module load (prevents build errors)
- **Zod v4** — type incompatibility with zod-to-json-schema requires `any` cast in `zodToGeminiSchema`
- **p-limit@4** — v5+ uses `#async_hooks` import maps that Turbopack can't resolve

## File Structure

```
app/                    # Next.js App Router
  api/                  # API routes
    runs/               # Run CRUD + phase execution + exports
    profiles/           # Profile CRUD
  components/           # Client components
  lib/api.ts            # Client-side fetch helpers
  runs/                 # Run pages (new, [id])
  profiles/             # Profile page
lib/                    # Server-side modules
  db.ts                 # Prisma client (Neon adapter)
  adminAuth.ts          # Token auth helper
  gemini.ts             # Gemini client + schema adapter
  crawl.ts              # HTML fetch + Readability extraction
  rss.ts                # RSS/Atom parsing
  phases/               # 7 pipeline phase modules
  export/               # JSON, XLSX, HTML export
  utils/                # URL normalization, similarity, prompt loading
prompts/                # System + user prompt templates (6 files)
prisma/schema.prisma    # Database schema
prisma.config.ts        # Prisma 7 config
docs/                   # Original spec documents (gitignored binaries)
```

## Commands

```bash
npm run dev             # Local dev server
npm run build           # prisma generate + next build
npx prisma db push      # Push schema to Neon
npx prisma studio       # Visual DB editor
```

## Spec Documents

Located in `docs/` (gitignored binaries):
- `Application Workflow (1).pdf` — 8-phase pipeline architecture
- `Article Ranking and Classification Prompt.pdf` — Scoring rubric
- `AI Factory Basic summary.pptx` — Executive summary
- `basic workflow.png` — High-level diagram
- `image (10).png` — Detailed technical flowchart

## Article Scoring System

- **Essential** (8.0–10.0): Top 10-20% of articles
- **Important** (5.0–7.9): Next 20-30%
- **Optional** (0.0–4.9): Bottom 50-70%
- Bonuses for preferred domains: OpenAI, Google, Microsoft, Anthropic, consulting firms
- Penalties for short articles, promotional content, paywalls, redundancy

## Dashboard Sync

After any significant change to this project:
1. Update `C:\Users\user\Documents\dashboard.html` with:
   - Status badge (planning → active → shipped)
   - Phase/milestone changes
2. Update `C:\Users\user\Documents\CLAUDE.md` portfolio table if status changes

## Next Steps (Plan)

1. [x] MVP implementation (7-phase pipeline, admin UI, exports)
2. [ ] Deploy to Vercel and verify with real data
3. [ ] Frontend design polish (2 rounds via /frontend-design)
4. [ ] Add error recovery / retry UI for failed phases
5. [ ] Implement lookback_days filtering in source phase
6. [ ] Add email distribution phase
7. [ ] Consider SaaS multi-tenant architecture
