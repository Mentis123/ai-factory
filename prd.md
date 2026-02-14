You are Claude Code acting as a senior full-stack engineer. Build the AI Factory MVP described below, end-to-end, as a production-ready Vercel Next.js app using Neon Postgres and Gemini 3 Flash.



REPO + DEPLOYMENT TARGETS

\- Repo: Mentis123/ai-factory (already connected to Vercel; pushing to main triggers deploy)

\- Database: Neon Postgres already connected to Vercel (assume DATABASE\_URL is present in Vercel env)

\- Model: Gemini 3 Flash for MVP; use Gemini API JS SDK

\- GEMINI\_API\_KEY already exists in Vercel env vars



CRITICAL CONSTRAINTS

\- Do NOT rely on running local tests or manual verification. Implement cleanly and defensively.

\- Avoid long-running single requests. Implement pipeline as discrete “phases” executed via separate API calls.

\- All mutating API routes must require an ADMIN\_TOKEN header (x-admin-token). UI supports entering token.



STACK DECISIONS (use exactly these)

\- Next.js App Router + TypeScript

\- Tailwind for UI styling (simple, clean)

\- Prisma ORM + Neon Postgres

\- Gemini API via @google/genai

\- Content extraction via jsdom + @mozilla/readability

\- Concurrency limiting via p-limit

\- XLSX export via exceljs

\- JSON schema validation via zod + zod-to-json-schema



MODEL DETAILS (important)

\- Default Gemini model id: "gemini-3-flash-preview" (but configurable via GEMINI\_MODEL env var)

\- Use structured outputs: responseMimeType "application/json" + responseJsonSchema for ranking + summarisation



WHAT TO BUILD (MVP FEATURES)

1\) Runs

\- Create a “run” from:

&nbsp; - run\_name, prompt\_topic, keywords (optional), specific\_urls (optional), source\_urls (optional), lookback\_days (default 7)

&nbsp; - mode auto|guided (default auto)

&nbsp; - min\_fit\_score default 6.0

&nbsp; - max\_total\_articles default 12

&nbsp; - max\_per\_domain default 4

\- Persist runs to DB.



2\) Profiles

\- Simple CRUD for “profiles” (newsletter profiles) storing:

&nbsp; - default\_source\_urls, default\_keywords

&nbsp; - trends\_to\_watch, competitors\_to\_monitor

\- Runs can optionally reference a profile and inherit defaults.



3\) Phase pipeline (each phase is an API call and writes to run\_phases)

Phases:

\- extract\_information

\- source\_articles

\- grab\_articles

\- rank\_articles

\- summarise\_articles

\- generate\_final\_newsletter

\- save\_articles (exports)



Implement each phase as POST /api/runs/:id/phase/:phaseName

The phase must:

\- lock the run phase row (or “in\_progress” guard) to avoid double execution

\- write logs and status transitions

\- be resumable: if phase already succeeded, return OK and do nothing



4\) Source discovery

\- If specific\_urls provided, treat them as discovered articles directly.

\- Otherwise use source\_urls (from run or profile); each URL can be:

&nbsp; - RSS feed: parse and extract items (title + link)

&nbsp; - HTML page: fetch and extract <a href> links; keep likely article links

\- Normalise URLs by stripping common tracking params.

\- Save discovered articles (url, title, source\_url, discovered\_at).



5\) Grab/fetch full content

For each discovered article not yet fetched:

\- fetch HTML

\- use Readability to extract text

\- attempt publish\_date from meta tags (best-effort)

\- compute word\_count

\- quick relevancy check (Gemini) -> is\_relevant boolean

\- dedupe using:

&nbsp; - canonical URL equality

&nbsp; - title similarity (simple function)

&nbsp; - mark duplicates and set duplicate\_of\_article\_id

Guided Mode checkpoint:

\- after this phase, UI shows candidate list with toggles to keep/drop.



6\) Ranking

For each kept \& relevant \& non-duplicate article:

\- Call Gemini with STRICT rubric (see PROMPT FILES below)

\- Output JSON (validated by zod):

&nbsp; - category, score, tier, key\_findings\[], key\_entities\[], rationale, suggested\_header

\- Save article\_rankings row including raw\_json

Auto Mode:

\- drop items with score < min\_fit\_score (default 6.0)

Ranking must be OPTIONAL:

\- if run has ranking\_enabled=false, skip this phase and just do lightweight tiering during summarisation.



7\) Summarisation

For shortlisted articles:

\- Call Gemini to generate JSON:

&nbsp; - summary\_text (2–3 sentences)

&nbsp; - why\_it\_matters (3 bullets)

&nbsp; - implications (optional 1–2 sentences)

\- Apply business rules:

&nbsp; - cap max\_per\_domain

&nbsp; - cap max\_total\_articles

\- Guided Mode checkpoint:

&nbsp; - allow final keep/drop and reorder (ordering can be stored as sort\_index on articles)



8\) Newsletter HTML

Generate HTML template:

\- Title (headline)

\- Date

\- Group by tier sections (Essential, Important, Optional)

\- Each entry shows: suggested\_header, tier+score, summary, bullets, link

Store in newsletters table.



9\) Exports

\- JSON export: GET /api/runs/:id/export.json

\- XLSX export: GET /api/runs/:id/export.xlsx

\- HTML export: GET /api/runs/:id/newsletter.html

Generate dynamically from DB (ok to not store blobs).



10\) UI pages

\- / : list runs + create run button

\- /runs/new : create run form (including profile picker and source URLs textarea)

\- /runs/\[id] : run dashboard

&nbsp; - show phase statuses

&nbsp; - buttons: “Run next phase” and “Run all phases”

&nbsp; - show tables: discovered, dropped, shortlisted, final

&nbsp; - toggles for keep/drop in guided checkpoints

&nbsp; - downloads and view newsletter



FILE STRUCTURE TO IMPLEMENT

\- /app

&nbsp; - /page.tsx (runs list)

&nbsp; - /runs/new/page.tsx

&nbsp; - /runs/\[id]/page.tsx

&nbsp; - /profiles/page.tsx (simple profile CRUD)

\- /app/api

&nbsp; - /runs/route.ts

&nbsp; - /runs/\[id]/route.ts

&nbsp; - /runs/\[id]/phase/\[phaseName]/route.ts

&nbsp; - /runs/\[id]/export.json/route.ts

&nbsp; - /runs/\[id]/export.xlsx/route.ts

&nbsp; - /runs/\[id]/newsletter.html/route.ts

&nbsp; - /profiles/route.ts

\- /lib

&nbsp; - db.ts (prisma client)

&nbsp; - adminAuth.ts (token check)

&nbsp; - gemini.ts (client wrapper + structured output helper)

&nbsp; - crawl.ts (html fetch + link extraction + readability extraction)

&nbsp; - rss.ts (rss parsing)

&nbsp; - phases/\*.ts (one module per phase)

&nbsp; - export/\*.ts (xlsx/json/html)

&nbsp; - utils/\*.ts (url normalisation, similarity, concurrency)

\- /prompts

&nbsp; - article\_ranking\_system.txt

&nbsp; - article\_ranking\_user.txt (template)

&nbsp; - article\_summary\_system.txt

&nbsp; - article\_summary\_user.txt (template)

&nbsp; - relevancy\_check\_system.txt

&nbsp; - relevancy\_check\_user.txt (template)

\- prisma/schema.prisma

\- README.md

\- .env.example



PROMPTS (create these files exactly; use as system/user prompts)

1\) prompts/article\_ranking\_system.txt

--- START FILE ---

You are an expert article analyst for a Generative AI daily newsletter targeting small to medium-sized enterprise (SME) leaders. Your job is to evaluate articles in real-time and classify them into tiers based on their importance, relevance, and business value.



SCORING TIERS

ESSENTIAL (Score 8.0 - 10.0)

Definition: Strongly meets most/all criteria; high impact and broad relevance to enterprise AI adoption and strategy.

Target: Only ~10-20% of articles should reach this tier.



IMPORTANT (Score 5.0 - 7.9)

Definition: Useful and actionable but not foundational; provides value without being must-read material.

Target: ~20-30% of articles.



OPTIONAL (Score 0.0 - 4.9)

Definition: Niche, speculative, redundant, or low-quality; safe to skip without missing important developments.

Target: ~50-70% of articles (majority).



EVALUATION CATEGORIES (choose one)

\- Product Announcement \& Updates

\- Business Case Studies / Implementations

\- Surveys / Reports / Market Analysis

\- Technical Research Paper

\- Commentary / Opinion Pieces

\- Theoretical Discussions / Frameworks

\- Other



Use category-specific weighted criteria and apply scoring modifiers:

PENALTIES:

\- Under 300 words: severe penalty → likely Optional (0-3)

\- 300-500 words: moderate penalty → cap at Important (max 6)

\- Promotional/marketing: 0-1

\- Clickbait with thin content: 0-2

\- Paywalled with no substance: 0

\- Rehash/old news: -2 to -3

\- Redundant coverage: -1 to -2



BONUSES:

\- Preferred domains (+0.5 to +1.0): google.com, microsoft.com, openai.com, anthropic.com, meta.com, amazon.com, nvidia.com, huggingface.co, mckinsey.com, bain.com, deloitte.com, bcg.com, pwc.com, accenture.com, oneusefulthing.org

\- Quantified results/benchmarks: +0.5 to +1.0

\- Clear enterprise applicability: +0.5

\- Exclusive/breaking: +1.0

\- In-depth analysis (1000+ substantive words): +0.5



ADDITIONAL GUIDELINES

\- Impact over theory; favour practical, actionable content

\- Be harsh: only truly impactful articles are Essential

\- No score inflation; use the full scale



Return ONLY valid JSON matching the provided schema.

--- END FILE ---



2\) prompts/article\_summary\_system.txt

--- START FILE ---

You write newsletter-ready summaries for busy SME/enterprise leaders. Be clear, concrete, and non-hype. Prefer plain English. If facts are missing, do not invent them.



Return ONLY valid JSON matching the provided schema.

--- END FILE ---



3\) prompts/relevancy\_check\_system.txt

--- START FILE ---

You are a strict relevancy filter. Given a newsletter topic and an article (title + extracted text), decide whether the article is genuinely about the topic. If it is only loosely related, say false.



Return ONLY valid JSON matching the provided schema.

--- END FILE ---



DB (Prisma) — implement schema aligned to PRD:

\- profiles

\- runs

\- run\_phases

\- articles

\- article\_rankings

\- article\_summaries

\- newsletters



Also add:

\- Article.sort\_index (int nullable) for ordering in guided mode.



ENV VARS

\- DATABASE\_URL (required)

\- GEMINI\_API\_KEY (required)

\- GEMINI\_MODEL (optional default gemini-3-flash-preview)

\- ADMIN\_TOKEN (required)



IMPLEMENTATION PLAN (do sequentially)

A) Initialise/verify Next.js app + dependencies + tsconfig

B) Add Prisma schema + migrations + prisma client helper

C) Implement adminAuth middleware helper for API routes

D) Implement Gemini client wrapper with:

&nbsp;  - generateJson(model, systemPrompt, userPrompt, zodSchema)

&nbsp;  - uses responseMimeType + responseJsonSchema

E) Implement crawling/extraction + RSS parsing + url normalisation + title similarity

F) Implement each phase module with clear inputs/outputs and DB writes

G) Wire phase API route to call correct module

H) Build UI pages and basic components

I) Implement exports (json, xlsx, html)

J) Write README with local dev instructions and Vercel notes



QUALITY BAR

\- TypeScript strictness

\- Defensive parsing; never crash on a single bad article; log and continue

\- Respect concurrency limits (e.g., max 3 simultaneous Gemini calls; max 5 fetches)

\- Keep the UI simple but functional

\- Ensure all routes compile on Vercel



Finally: commit all changes, with clean commit messages, and ensure build passes (do not run heavy tests; but do ensure code is syntactically correct).

END.



