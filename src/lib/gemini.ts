import { GoogleGenerativeAI } from "@google/generative-ai";

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
      throw new Error("GOOGLE_API_KEY is not set");
    }
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
}

const MODEL_NAME = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

export async function analyzeArticle(
  title: string,
  snippet: string,
  url: string,
): Promise<{ summary: string; analysis: string; importance: number }> {
  const model = getGenAI().getGenerativeModel({ model: MODEL_NAME });

  const prompt = `You are an AI market intelligence analyst for a consulting firm that advises private equity firms.

Analyze this AI industry article:

**Title:** ${title}
**URL:** ${url}
**Snippet:** ${snippet}

Respond in this exact JSON format (no markdown, no code fences):
{
  "summary": "2-3 sentence executive summary of the key development",
  "analysis": "2-3 sentences on strategic implications for PE firms and the broader AI market. What does this mean for investment, competition, or adoption?",
  "importance": <1-5 integer: 1=routine, 2=noteworthy, 3=significant, 4=major, 5=critical>
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    const parsed = JSON.parse(text) as {
      summary: string;
      analysis: string;
      importance: number;
    };
    return {
      summary: parsed.summary ?? "",
      analysis: parsed.analysis ?? "",
      importance: Math.max(1, Math.min(5, parsed.importance ?? 3)),
    };
  } catch {
    return {
      summary: text.slice(0, 500),
      analysis: "Analysis could not be parsed.",
      importance: 3,
    };
  }
}

export async function generateBriefing(
  articles: Array<{ title: string; aiSummary: string; aiAnalysis: string; importance: number }>,
): Promise<string> {
  const model = getGenAI().getGenerativeModel({ model: MODEL_NAME });

  const articleList = articles
    .sort((a, b) => b.importance - a.importance)
    .map(
      (a, i) =>
        `${i + 1}. [Importance: ${a.importance}/5] ${a.title}\n   Summary: ${a.aiSummary}\n   Analysis: ${a.aiAnalysis}`,
    )
    .join("\n\n");

  const prompt = `You are the lead analyst at GAI Insights, producing a daily AI intelligence briefing for C-suite executives at private equity firms.

Based on the following ${articles.length} articles, write a concise executive briefing:

${articleList}

Format the briefing as:

# AI Intelligence Briefing

## Top Stories
(2-3 most important developments with why they matter)

## Market Signals
(Key trends and patterns across today's news)

## Strategic Implications
(What PE firms should watch or act on)

## Quick Takes
(1-line summaries of remaining stories)

Keep it sharp, actionable, and under 600 words.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
