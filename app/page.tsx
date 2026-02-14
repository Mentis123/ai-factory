"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { safeJson } from "@/app/lib/api";

interface RunPhase {
  phase_name: string;
  status: string;
}

interface Run {
  id: string;
  run_name: string;
  prompt_topic: string;
  mode: string;
  status: string;
  created_at: string;
  phases: RunPhase[];
  _count: { articles: number };
}

export default function RunsListPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/runs")
      .then((r) => safeJson<Run[]>(r))
      .then(setRuns)
      .catch((err) => console.error("Failed to load runs:", err))
      .finally(() => setLoading(false));
  }, []);

  function phaseProgress(phases: RunPhase[]) {
    const completed = phases.filter(
      (p) => p.status === "completed" || p.status === "skipped"
    ).length;
    return { completed, total: phases.length };
  }

  function statusBadge(status: string) {
    const styles: Record<string, { bg: string; color: string; border: string }> = {
      created: {
        bg: "var(--navy-800)",
        color: "var(--slate-400)",
        border: "var(--navy-700)",
      },
      running: {
        bg: "rgba(20, 184, 166, 0.1)",
        color: "var(--teal-400)",
        border: "rgba(20, 184, 166, 0.3)",
      },
      completed: {
        bg: "rgba(16, 185, 129, 0.1)",
        color: "var(--emerald-500)",
        border: "rgba(16, 185, 129, 0.3)",
      },
      failed: {
        bg: "rgba(244, 63, 94, 0.1)",
        color: "var(--rose-500)",
        border: "rgba(244, 63, 94, 0.3)",
      },
    };
    const s = styles[status] || styles.created;
    return (
      <span
        className="px-2 py-0.5 rounded-full text-[11px] font-medium"
        style={{
          background: s.bg,
          color: s.color,
          border: `1px solid ${s.border}`,
        }}
      >
        {status}
      </span>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--slate-200)" }}
          >
            Pipeline Runs
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--slate-400)" }}
          >
            {runs.length > 0 ? `${runs.length} run${runs.length !== 1 ? "s" : ""}` : "No runs yet"}
          </p>
        </div>
        <Link
          href="/runs/new"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, var(--teal-500), var(--teal-400))",
            color: "var(--navy-950)",
          }}
        >
          + Create Run
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div
          className="card text-center py-16 px-6"
        >
          <div
            className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{
              background: "var(--navy-800)",
              border: "1px solid var(--navy-700)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--slate-400)" }}>
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm mb-1" style={{ color: "var(--slate-300)" }}>
            No pipeline runs yet
          </p>
          <p className="text-xs mb-4" style={{ color: "var(--slate-400)" }}>
            Create your first run to start curating articles
          </p>
          <Link
            href="/runs/new"
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--teal-400)" }}
          >
            Create your first run →
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--navy-700)" }}>
                <th
                  className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--slate-400)" }}
                >
                  Name
                </th>
                <th
                  className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--slate-400)" }}
                >
                  Topic
                </th>
                <th
                  className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--slate-400)" }}
                >
                  Mode
                </th>
                <th
                  className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--slate-400)" }}
                >
                  Status
                </th>
                <th
                  className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--slate-400)" }}
                >
                  Progress
                </th>
                <th
                  className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--slate-400)" }}
                >
                  Articles
                </th>
                <th
                  className="text-left px-5 py-3 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--slate-400)" }}
                >
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const progress = phaseProgress(run.phases);
                return (
                  <tr
                    key={run.id}
                    className="transition-card cursor-pointer"
                    style={{ borderBottom: "1px solid var(--navy-800)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--navy-800)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/runs/${run.id}`}
                        className="text-sm font-medium transition-colors"
                        style={{ color: "var(--teal-400)" }}
                      >
                        {run.run_name}
                      </Link>
                    </td>
                    <td
                      className="px-5 py-3.5 text-sm max-w-xs truncate"
                      style={{ color: "var(--slate-300)" }}
                    >
                      {run.prompt_topic}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-[11px] font-mono uppercase"
                        style={{ color: "var(--slate-400)" }}
                      >
                        {run.mode}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">{statusBadge(run.status)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-16 h-1.5 rounded-full overflow-hidden"
                          style={{ background: "var(--navy-800)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(progress.completed / progress.total) * 100}%`,
                              background: progress.completed === progress.total
                                ? "var(--emerald-500)"
                                : "var(--teal-400)",
                            }}
                          />
                        </div>
                        <span
                          className="text-xs font-mono"
                          style={{ color: "var(--slate-400)" }}
                        >
                          {progress.completed}/{progress.total}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-5 py-3.5 text-sm font-mono"
                      style={{ color: "var(--slate-400)" }}
                    >
                      {run._count.articles}
                    </td>
                    <td
                      className="px-5 py-3.5 text-xs"
                      style={{ color: "var(--slate-400)" }}
                    >
                      {new Date(run.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
