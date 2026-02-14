import { prisma } from "@/lib/db";

export const PHASE_NAMES = [
  "extract_information",
  "source_articles",
  "grab_articles",
  "rank_articles",
  "summarise_articles",
  "generate_final_newsletter",
  "save_articles",
] as const;

export type PhaseName = (typeof PHASE_NAMES)[number];

export interface PhaseResult {
  status: "completed" | "skipped" | "already_completed";
  logs: string[];
}

export async function withPhaseGuard(
  runId: string,
  phaseName: PhaseName,
  fn: (logs: string[]) => Promise<void>
): Promise<PhaseResult> {
  const phase = await prisma.runPhase.findUnique({
    where: { run_id_phase_name: { run_id: runId, phase_name: phaseName } },
  });

  if (!phase) throw new Error(`Phase ${phaseName} not found for run ${runId}`);

  if (phase.status === "completed") {
    return { status: "already_completed", logs: ["Phase already completed"] };
  }

  if (phase.status === "in_progress") {
    throw new Error(`Phase ${phaseName} is already in progress`);
  }

  // Mark as in_progress
  await prisma.runPhase.update({
    where: { id: phase.id },
    data: { status: "in_progress", started_at: new Date(), error: null },
  });

  const logs: string[] = [];

  try {
    await fn(logs);

    await prisma.runPhase.update({
      where: { id: phase.id },
      data: {
        status: "completed",
        completed_at: new Date(),
        logs: logs.join("\n"),
      },
    });

    return { status: "completed", logs };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logs.push(`ERROR: ${message}`);

    await prisma.runPhase.update({
      where: { id: phase.id },
      data: {
        status: "failed",
        error: message,
        logs: logs.join("\n"),
      },
    });

    throw err;
  }
}
