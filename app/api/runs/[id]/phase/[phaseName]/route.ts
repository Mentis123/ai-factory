import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { PHASE_NAMES, type PhaseName } from "@/lib/phases/helpers";
import { extractInformation } from "@/lib/phases/extractInformation";
import { sourceArticles } from "@/lib/phases/sourceArticles";
import { grabArticles } from "@/lib/phases/grabArticles";
import { rankArticles } from "@/lib/phases/rankArticles";
import { summariseArticles } from "@/lib/phases/summariseArticles";
import { generateNewsletter } from "@/lib/phases/generateNewsletter";
import { saveArticles } from "@/lib/phases/saveArticles";

const phaseHandlers: Record<
  PhaseName,
  (runId: string) => Promise<{ status: string; logs: string[] }>
> = {
  extract_information: extractInformation,
  source_articles: sourceArticles,
  grab_articles: grabArticles,
  rank_articles: rankArticles,
  summarise_articles: summariseArticles,
  generate_final_newsletter: generateNewsletter,
  save_articles: saveArticles,
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; phaseName: string }> }
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { id, phaseName } = await params;

  if (!PHASE_NAMES.includes(phaseName as PhaseName)) {
    return NextResponse.json(
      { error: `Unknown phase: ${phaseName}` },
      { status: 400 }
    );
  }

  let body: { runAll?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // No body is fine
  }

  try {
    if (body.runAll) {
      // Run from current phase to the end
      const startIdx = PHASE_NAMES.indexOf(phaseName as PhaseName);
      const results: { phase: string; status: string; logs: string[] }[] = [];

      for (let i = startIdx; i < PHASE_NAMES.length; i++) {
        const phase = PHASE_NAMES[i];
        const handler = phaseHandlers[phase];
        const result = await handler(id);
        results.push({ phase, ...result });

        // Stop if a phase fails (the error would have been thrown, but check status)
        if (result.status === "failed") break;
      }

      return NextResponse.json({ results });
    } else {
      const handler = phaseHandlers[phaseName as PhaseName];
      const result = await handler(id);
      return NextResponse.json(result);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
