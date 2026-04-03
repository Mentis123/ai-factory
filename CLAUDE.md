# CLAUDE.md — GAI Insights AI Navigator

## Project

**GAI Insights AI Navigator** — A platform equipped with dozens of specialized AI agents that convert rapid and complex AI market developments into executive-grade intelligence. Powers the Daily AI News Show, client-specific research, and biweekly trend reports tailored for large private equity firms.

## Purpose

AI Navigator serves as the intelligence backbone for GAI Insights, delivering:

- **Daily AI News Show**: Automated research, synthesis, and voice-narrated briefings
- **Client Research**: PE-firm-specific AI landscape analysis and opportunity identification
- **Biweekly Trend Reports**: Executive-grade reports on AI market movements, investments, and strategic implications
- **Research Aggregation**: Continuous monitoring of AI developments across news, papers, patents, and market signals

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript (strict mode) |
| Database | Neon PostgreSQL (serverless) via Drizzle ORM |
| AI | Anthropic SDK (Claude API) — powers all AI agents |
| Search | Exa API — web search and deep research |
| Voice | ElevenLabs — news show narration |
| Storage | Vercel Blob — report and asset storage |
| Hosting | Vercel (auto-deploy on push) |
| Delivery | Email/newsletter for report distribution |

## Key Concepts

- **AI Agent Pipelines**: Orchestrated chains of specialized AI agents (researcher, analyst, writer, editor) that process raw data into polished intelligence
- **Research Aggregation**: Multi-source ingestion from news, research papers, market data, and patent filings via Exa API
- **Content Synthesis**: AI-driven summarization and analysis turning raw research into executive narratives
- **Report Generation**: Automated creation of branded, client-specific PDF/HTML reports stored in Vercel Blob
- **News Show Production**: End-to-end pipeline from research to scripted narration to ElevenLabs voice synthesis

## Folder Structure

```
ai-navigator/
├── src/
│   ├── app/              # Next.js App Router pages and API routes
│   │   └── api/          # API endpoints for agents, pipelines, reports
│   ├── agents/           # AI agent definitions (prompts, schemas, configs)
│   ├── components/       # React components (dashboards, reports, news UI)
│   ├── lib/              # Shared utilities and integrations
│   │   └── db/           # Drizzle ORM schema and database client
│   ├── pipelines/        # Data pipeline definitions (research, synthesis, delivery)
│   ├── styles/           # Global styles and design tokens
│   └── types/            # TypeScript type definitions
├── tests/                # Vitest test files
├── docs/                 # Project documentation
├── drizzle/              # Database migrations
└── public/               # Static assets
```

### Important Directories

- `src/agents/` — AI agent definitions including system prompts, input/output schemas, and orchestration logic. NOT Claude Code agents.
- `src/pipelines/` — Data processing pipelines for research ingestion, content synthesis, report generation, and news show production. These are APPLICATION pipelines, not CI/CD.
- `.claude/agents/` — Claude Code development agents (test-runner, code-reviewer, etc.)
- `.claude/skills/` — Claude Code slash command skills

## Error Handling

- **Fail fast**: Throw errors early, catch at boundaries
- All AI agent calls must have timeout and retry logic
- API routes return structured error responses with appropriate HTTP status codes
- Database operations use transactions where atomicity is required
- External API failures (Exa, ElevenLabs, Anthropic) must be gracefully degraded with fallbacks

## Code Standards

- **OWASP**: Follow security best practices for all API routes and data handling
- **Clean Code**: Descriptive names, small functions, single responsibility
- **TypeScript Strict**: `strict: true`, absolutely no `any` types
- **Mobile-first**: All UI components designed for mobile viewport first
- **Path alias**: `@/` maps to `src/`
- **Imports**: Prefer named exports; group imports (external, internal, types)
- **Components**: Functional components with explicit prop types
- **API Routes**: Validate all inputs, sanitize outputs

## Testing

- **Framework**: Vitest
- **Mandatory**: All new features must include tests
- **Run**: `npx vitest run`
- **Watch**: NOT allowed (no dev servers)
- **Coverage**: Aim for critical path coverage on all agent pipelines

## Commits

Conventional Commits format:

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `chore:` — Maintenance
- `refactor:` — Code restructuring
- `test:` — Test additions/changes

## Agents (Claude Code)

| Agent | Model | Purpose |
|-------|-------|---------|
| test-runner | sonnet | Run vitest, analyze failures |
| code-reviewer | sonnet | Review for quality, security, strict TS, OWASP |
| doc-writer | sonnet | Generate and update documentation |
| api-designer | sonnet | Design Next.js API routes for agent pipelines |
| pipeline-architect | sonnet | Design AI agent pipelines (research, synthesis, reports) |
| component-architect | sonnet | Design React components (dashboards, reports, news UI) |
| risk-evaluator | sonnet | Evaluate operation risk (severity 1-5) |

## Skills (Slash Commands)

| Skill | Purpose |
|-------|---------|
| /test | Run vitest test suite |
| /lint | Run ESLint fix and Prettier |
| /review | Trigger code-reviewer agent |
| /commit | Stage and commit with Conventional Commits |
| /endpoint | Generate a new Next.js API route |
| /pipeline | Generate a new AI agent pipeline scaffold |
| /component | Generate a new React component |
| /risk | Evaluate risk of a planned operation |

## Key Commands

```bash
npx vitest run              # Run tests
npx eslint . --fix          # Fix linting issues
npx prettier --write .      # Format code
npx drizzle-kit push        # Push schema to database
npx drizzle-kit generate    # Generate migration
npm run build               # Build for production (catch errors pre-push)
```

## CRITICAL RULES

### NEVER Run Local Dev Servers

**Do NOT run `npm run dev`, `npm start`, `next dev`, or any local server.**
All testing is done via Vercel deployment:

```
git push -> Vercel auto-deploy -> test on preview/production URL
```

`npm run build` is acceptable for catching build errors before pushing.

### Deployment Flow

```
git add . && git commit -m "feat: description" && git push
```

Vercel automatically deploys on push. Test on the Vercel preview URL.
