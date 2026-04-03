# Architecture — AI Navigator

## System Overview

AI Navigator is a pipeline-based intelligence platform where specialized AI agents are orchestrated to transform raw AI market data into executive-grade deliverables.

```
┌─────────────────────────────────────────────────────────┐
│                    Client Portal (Next.js)               │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │Dashboard │  │Report Viewer │  │News Show Player  │  │
│  └──────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                    API Layer (App Router)                 │
│  /api/agents/*  /api/reports/*  /api/news/*  /api/research│
├─────────────────────────────────────────────────────────┤
│                 AI Agent Pipeline System                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │Research  │→ │Analysis  │→ │Synthesis │→ │Delivery│  │
│  │Agents    │  │Agents    │  │Agents    │  │Agents  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
├─────────────────────────────────────────────────────────┤
│                    Data & Storage                         │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │Neon Postgres│  │Vercel Blob   │  │External APIs   │  │
│  │(Drizzle)   │  │(Reports/Audio)│  │(Exa, 11Labs)  │  │
│  └────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## AI Agent Pipeline System

The core of AI Navigator is its pipeline system — orchestrated chains of AI agents that process data through defined stages.

### Pipeline Types

#### 1. Research Ingestion Pipeline

Continuously monitors and ingests AI-related content from multiple sources.

- **Source Scanner Agent** — Uses Exa API to discover new AI news, papers, patents, funding rounds
- **Content Extractor Agent** — Extracts structured data from raw sources
- **Relevance Scorer Agent** — Filters and scores content by relevance to client interests
- **Storage Agent** — Persists scored content to Neon PostgreSQL

#### 2. Content Synthesis Pipeline

Transforms raw research into structured analysis.

- **Topic Clusterer Agent** — Groups related items by theme, technology, or company
- **Trend Analyzer Agent** — Identifies patterns, momentum shifts, and emerging themes
- **Impact Assessor Agent** — Evaluates implications for PE portfolio companies
- **Narrative Writer Agent** — Produces executive-grade written analysis

#### 3. Report Generation Pipeline

Produces client-specific deliverables.

- **Client Context Agent** — Loads client profile, portfolio, and interests
- **Content Selector Agent** — Curates relevant content for specific client
- **Report Composer Agent** — Assembles the final report with executive summary
- **Format Agent** — Renders to HTML/PDF, stores in Vercel Blob
- **Delivery Agent** — Sends via email/newsletter

#### 4. News Show Production Pipeline

Produces the Daily AI News Show.

- **Story Selector Agent** — Picks the top stories for the day
- **Script Writer Agent** — Writes natural, conversational narration scripts
- **Voice Synthesis Agent** — Generates audio via ElevenLabs
- **Show Assembler Agent** — Combines audio segments with intro/outro
- **Publishing Agent** — Publishes to platform and sends notifications

## Database Schema (Neon PostgreSQL)

Managed via Drizzle ORM. Key tables:

- `sources` — Tracked research sources and their metadata
- `articles` — Ingested and scored content items
- `topics` — Clustered topic groups
- `reports` — Generated reports with metadata and storage URLs
- `clients` — PE firm client profiles and preferences
- `pipelines` — Pipeline execution logs for observability
- `news_episodes` — Daily news show episodes and assets

## API Layer

All APIs are Next.js App Router route handlers:

- `GET /api/health` — Platform health check
- `POST /api/agents/:name/run` — Trigger a specific AI agent
- `POST /api/pipelines/:name/run` — Trigger a full pipeline
- `GET /api/reports` — List generated reports
- `GET /api/reports/:id` — Get a specific report
- `GET /api/news/latest` — Get the latest news show episode
- `POST /api/research/search` — Trigger research search via Exa

## External Integrations

| Service | Purpose | SDK |
|---------|---------|-----|
| Anthropic (Claude) | AI agent reasoning and generation | `@anthropic-ai/sdk` |
| Exa | Web search, deep research, company research | Exa API (REST) |
| ElevenLabs | Voice synthesis for news show | ElevenLabs API (REST) |
| Vercel Blob | Report and audio file storage | `@vercel/blob` |
| Neon | Serverless PostgreSQL database | `@neondatabase/serverless` |

## Deployment

- Hosted on Vercel with automatic deployments on `git push`
- Database on Neon serverless PostgreSQL
- No local dev servers — all testing via Vercel preview URLs
- Environment variables managed in Vercel dashboard
