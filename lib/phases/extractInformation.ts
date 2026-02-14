import { prisma } from "@/lib/db";
import { generateJson } from "@/lib/gemini";
import { withPhaseGuard, type PhaseResult } from "./helpers";
import { z } from "zod";

const KeywordsSchema = z.object({
  keywords: z.array(z.string()),
});

export async function extractInformation(runId: string): Promise<PhaseResult> {
  return withPhaseGuard(runId, "extract_information", async (logs) => {
    const run = await prisma.run.findUniqueOrThrow({ where: { id: runId } });

    logs.push(`Topic: ${run.prompt_topic}`);
    logs.push(`Existing keywords: ${run.keywords.join(", ") || "(none)"}`);

    if (run.keywords.length === 0) {
      logs.push("No keywords provided — generating via Gemini...");

      const result = await generateJson(
        "You generate relevant search keywords for finding articles about a given topic. Return 5-10 specific, diverse keywords that would help find relevant articles.",
        `Generate search keywords for this newsletter topic: "${run.prompt_topic}"`,
        KeywordsSchema
      );

      await prisma.run.update({
        where: { id: runId },
        data: { keywords: result.keywords },
      });

      logs.push(`Generated keywords: ${result.keywords.join(", ")}`);
    } else {
      logs.push("Keywords already provided, skipping generation.");
    }

    // Validate source URLs exist (from run or profile)
    if (
      run.specific_urls.length === 0 &&
      run.source_urls.length === 0
    ) {
      if (run.profile_id) {
        const profile = await prisma.profile.findUnique({
          where: { id: run.profile_id },
        });
        if (profile && profile.default_source_urls.length > 0) {
          await prisma.run.update({
            where: { id: runId },
            data: { source_urls: profile.default_source_urls },
          });
          logs.push(
            `Inherited ${profile.default_source_urls.length} source URLs from profile "${profile.name}"`
          );
        } else {
          logs.push(
            "WARNING: No source URLs or specific URLs provided and profile has none."
          );
        }
      } else {
        logs.push(
          "WARNING: No source URLs, specific URLs, or profile provided."
        );
      }
    }

    await prisma.run.update({
      where: { id: runId },
      data: { status: "running" },
    });

    logs.push("Extract information phase complete.");
  });
}
