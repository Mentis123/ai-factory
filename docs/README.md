# GAI Insights AI Navigator

## Vision

AI Navigator is an executive intelligence platform built for large private equity firms. It deploys dozens of specialized AI agents that continuously monitor, analyze, and synthesize the rapidly evolving AI landscape into actionable intelligence.

The platform powers three core products:

1. **Daily AI News Show** — Automated research, synthesis, and voice-narrated briefings delivered every morning
2. **Client Research** — PE-firm-specific AI landscape analysis identifying opportunities, risks, and strategic implications for portfolio companies
3. **Biweekly Trend Reports** — Executive-grade reports on AI market movements, investments, regulatory changes, and emerging technologies

## Architecture

The platform is built on a pipeline-based architecture where specialized AI agents are orchestrated in chains:

```
Research Sources → Ingestion Agents → Analysis Agents → Synthesis Agents → Delivery
```

See [architecture.md](./architecture.md) for full technical details.

## Tech Stack

- **Next.js 16** with App Router and React 19
- **TypeScript** in strict mode
- **Neon PostgreSQL** (serverless) with Drizzle ORM
- **Anthropic SDK** (Claude) for AI agent orchestration
- **Exa API** for web search and deep research
- **ElevenLabs** for voice synthesis (news show)
- **Vercel Blob** for report and asset storage
- **Vercel** for hosting with auto-deploy

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your API keys
3. Run `npm install`
4. Run `npx drizzle-kit push` to initialize the database
5. Push to git — Vercel auto-deploys

**Important:** Never run `npm run dev`. All testing is done via Vercel deployments.

## Project Structure

```
src/
├── app/          # Next.js pages and API routes
├── agents/       # AI agent definitions (prompts, schemas, configs)
├── components/   # React components (dashboards, reports, news UI)
├── lib/          # Shared utilities and database client
├── pipelines/    # Data processing pipelines
├── styles/       # Global styles
└── types/        # TypeScript type definitions
```

## Development

- Run tests: `npx vitest run`
- Build: `npm run build`
- Deploy: `git push` (Vercel auto-deploys)
