"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";

interface ArticleRanking {
  category: string;
  score: number;
  tier: string;
  key_findings: string[];
  suggested_header: string;
  rationale: string;
}

interface ArticleSummary {
  summary_text: string;
  why_it_matters: string[];
  implications: string | null;
}

interface Article {
  id: string;
  url: string;
  title: string | null;
  domain: string | null;
  word_count: number | null;
  is_relevant: boolean | null;
  is_duplicate: boolean;
  is_kept: boolean;
  is_shortlisted: boolean;
  sort_index: number | null;
  ranking: ArticleRanking | null;
  summary: ArticleSummary | null;
}

interface RunPhase {
  id: string;
  phase_name: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  logs: string | null;
  error: string | null;
}

interface Newsletter {
  id: string;
  title: string;
  created_at: string;
}

interface RunData {
  id: string;
  run_name: string;
  prompt_topic: string;
  keywords: string[];
  mode: string;
  status: string;
  ranking_enabled: boolean;
  phases: RunPhase[];
  articles: Article[];
  newsletters: Newsletter[];
}

const PHASE_LABELS: Record<string, string> = {
  extract_information: "Extract",
  source_articles: "Source",
  grab_articles: "Grab",
  rank_articles: "Rank",
  summarise_articles: "Summarise",
  generate_final_newsletter: "Generate",
  save_articles: "Finalize",
};

const PHASE_LABELS_FULL: Record<string, string> = {
  extract_information: "Extract Information",
  source_articles: "Source Articles",
  grab_articles: "Grab Articles",
  rank_articles: "Rank Articles",
  summarise_articles: "Summarise Articles",
  generate_final_newsletter: "Generate Newsletter",
  save_articles: "Save & Finalize",
};

export default function RunDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [run, setRun] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [phaseLogs, setPhaseLogs] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const fetchRun = useCallback(() => {
    fetch(`/api/runs/${id}`)
      .then((r) => r.json())
      .then(setRun)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchRun();
  }, [fetchRun]);

  async function executePhase(phaseName: string, runAll = false) {
    setExecuting(phaseName);
    setPhaseLogs(null);
    try {
      const res = await apiFetch(`/api/runs/${id}/phase/${phaseName}`, {
        method: "POST",
        body: JSON.stringify({ runAll }),
      });
      const data = await res.json();
      if (data.logs) setPhaseLogs(data.logs.join("\n"));
      if (data.results)
        setPhaseLogs(
          data.results
            .map(
              (r: { phase: string; logs: string[] }) =>
                `--- ${r.phase} ---\n${r.logs.join("\n")}`
            )
            .join("\n\n")
        );
      fetchRun();
    } catch (err) {
      setPhaseLogs(`Error: ${err}`);
    } finally {
      setExecuting(null);
    }
  }

  async function toggleKept(articleId: string, isKept: boolean) {
    await apiFetch(`/api/runs/${id}/articles`, {
      method: "PATCH",
      body: JSON.stringify({ articleIds: [articleId], is_kept: !isKept }),
    });
    fetchRun();
  }

  function getNextPhase(): string | null {
    if (!run) return null;
    const next = run.phases.find(
      (p) => p.status === "pending" || p.status === "failed"
    );
    return next?.phase_name || null;
  }

  function phaseStatusStyle(status: string) {
    switch (status) {
      case "completed":
        return {
          bg: "rgba(16, 185, 129, 0.15)",
          border: "rgba(16, 185, 129, 0.4)",
          color: "var(--emerald-500)",
          dot: "var(--emerald-500)",
        };
      case "in_progress":
        return {
          bg: "rgba(20, 184, 166, 0.15)",
          border: "rgba(20, 184, 166, 0.4)",
          color: "var(--teal-400)",
          dot: "var(--teal-400)",
        };
      case "failed":
        return {
          bg: "rgba(244, 63, 94, 0.15)",
          border: "rgba(244, 63, 94, 0.4)",
          color: "var(--rose-500)",
          dot: "var(--rose-500)",
        };
      case "skipped":
        return {
          bg: "rgba(245, 158, 11, 0.1)",
          border: "rgba(245, 158, 11, 0.3)",
          color: "var(--amber-500)",
          dot: "var(--amber-500)",
        };
      default:
        return {
          bg: "var(--navy-800)",
          border: "var(--navy-700)",
          color: "var(--slate-400)",
          dot: "var(--navy-600)",
        };
    }
  }

  function tierStyle(tier: string | undefined) {
    switch (tier) {
      case "Essential":
        return {
          bg: "rgba(244, 63, 94, 0.1)",
          color: "var(--rose-500)",
          border: "rgba(244, 63, 94, 0.3)",
        };
      case "Important":
        return {
          bg: "rgba(245, 158, 11, 0.1)",
          color: "var(--amber-400)",
          border: "rgba(245, 158, 11, 0.3)",
        };
      default:
        return {
          bg: "var(--navy-800)",
          color: "var(--slate-400)",
          border: "var(--navy-700)",
        };
    }
  }

  const filteredArticles = run?.articles.filter((a) => {
    switch (filter) {
      case "relevant":
        return a.is_relevant === true && !a.is_duplicate;
      case "shortlisted":
        return a.is_shortlisted;
      case "final":
        return a.summary !== null;
      case "dropped":
        return !a.is_kept || a.is_duplicate || a.is_relevant === false;
      default:
        return true;
    }
  });

  if (loading)
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-64 rounded-lg" />
        <div className="skeleton h-32 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  if (!run)
    return (
      <p className="text-sm" style={{ color: "var(--rose-500)" }}>
        Run not found.
      </p>
    );

  const nextPhase = getNextPhase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--slate-200)" }}
        >
          {run.run_name}
        </h1>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-sm" style={{ color: "var(--slate-400)" }}>
            {run.prompt_topic}
          </span>
          <span
            className="w-1 h-1 rounded-full"
            style={{ background: "var(--navy-600)" }}
          />
          <span
            className="text-[11px] font-mono uppercase"
            style={{ color: "var(--slate-400)" }}
          >
            {run.mode}
          </span>
          {run.keywords.length > 0 && (
            <>
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: "var(--navy-600)" }}
              />
              <span className="text-xs" style={{ color: "var(--slate-400)" }}>
                {run.keywords.slice(0, 4).join(", ")}
                {run.keywords.length > 4 && ` +${run.keywords.length - 4}`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Phase Pipeline */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--slate-300)" }}
          >
            Pipeline
          </h2>
          <div className="flex gap-2">
            {nextPhase && (
              <>
                <button
                  onClick={() => executePhase(nextPhase)}
                  disabled={!!executing}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, var(--teal-500), var(--teal-400))",
                    color: "var(--navy-950)",
                  }}
                >
                  {executing ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="spinner"
                        style={{ width: 12, height: 12, borderWidth: 1.5 }}
                      />
                      {PHASE_LABELS_FULL[executing]}...
                    </span>
                  ) : (
                    `Run: ${PHASE_LABELS_FULL[nextPhase]}`
                  )}
                </button>
                <button
                  onClick={() => executePhase(nextPhase, true)}
                  disabled={!!executing}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(20, 184, 166, 0.3)",
                    color: "var(--teal-400)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(20, 184, 166, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Run All Remaining
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {run.phases.map((phase) => {
            const ps = phaseStatusStyle(phase.status);
            return (
              <div
                key={phase.id}
                className={`phase-step text-center ${phase.status === "in_progress" ? "phase-active" : ""}`}
              >
                <div
                  className="px-2 py-2.5 rounded-lg text-[11px] font-medium transition-all duration-200"
                  style={{
                    background: ps.bg,
                    border: `1px solid ${ps.border}`,
                    color: ps.color,
                  }}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {phase.status === "completed" && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {phase.status === "in_progress" && (
                      <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                    )}
                    {phase.status === "failed" && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M3 3l4 4M7 3l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                    <span>{PHASE_LABELS[phase.phase_name]}</span>
                  </div>
                </div>
                {phase.status === "failed" && (
                  <button
                    onClick={() => executePhase(phase.phase_name)}
                    disabled={!!executing}
                    className="text-[10px] font-medium mt-1.5 transition-colors"
                    style={{ color: "var(--rose-500)" }}
                  >
                    Retry
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {phaseLogs && (
          <pre
            className="mt-5 p-4 rounded-lg text-xs overflow-auto max-h-60 whitespace-pre-wrap font-mono"
            style={{
              background: "var(--navy-800)",
              border: "1px solid var(--navy-700)",
              color: "var(--slate-400)",
            }}
          >
            {phaseLogs}
          </pre>
        )}
      </div>

      {/* Articles Table */}
      {run.articles.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: "var(--slate-300)" }}
            >
              Articles ({filteredArticles?.length})
            </h2>
            <div className="flex gap-1">
              {["all", "relevant", "shortlisted", "final", "dropped"].map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="px-3 py-1 rounded-md text-[11px] font-medium transition-all duration-200"
                    style={{
                      background:
                        filter === f
                          ? "rgba(20, 184, 166, 0.15)"
                          : "transparent",
                      color:
                        filter === f ? "var(--teal-400)" : "var(--slate-400)",
                      border:
                        filter === f
                          ? "1px solid rgba(20, 184, 166, 0.3)"
                          : "1px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (filter !== f) {
                        e.currentTarget.style.background = "var(--navy-800)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filter !== f) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--navy-700)" }}>
                  {["Title", "Domain", "Words", "Tier", "Status", "Keep"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-2.5 px-3 text-[11px] font-medium uppercase tracking-wider"
                        style={{ color: "var(--slate-400)" }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredArticles?.map((article) => {
                  const ts = tierStyle(article.ranking?.tier);
                  return (
                    <tr
                      key={article.id}
                      style={{ borderBottom: "1px solid var(--navy-800)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(26, 34, 64, 0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td className="py-2.5 px-3 max-w-xs">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium block truncate transition-colors"
                          style={{ color: "var(--teal-400)" }}
                        >
                          {article.title || article.url}
                        </a>
                        {article.summary && (
                          <p
                            className="text-[11px] mt-1 line-clamp-2"
                            style={{ color: "var(--slate-400)" }}
                          >
                            {article.summary.summary_text}
                          </p>
                        )}
                      </td>
                      <td
                        className="py-2.5 px-3 text-xs font-mono"
                        style={{ color: "var(--slate-400)" }}
                      >
                        {article.domain}
                      </td>
                      <td
                        className="py-2.5 px-3 text-xs font-mono"
                        style={{ color: "var(--slate-400)" }}
                      >
                        {article.word_count || "\u2014"}
                      </td>
                      <td className="py-2.5 px-3">
                        {article.ranking?.tier && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{
                              background: ts.bg,
                              color: ts.color,
                              border: `1px solid ${ts.border}`,
                            }}
                          >
                            {article.ranking.tier}{" "}
                            {article.ranking.score.toFixed(1)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex gap-1 flex-wrap">
                          {article.is_duplicate && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                              style={{
                                background: "rgba(245, 158, 11, 0.1)",
                                color: "var(--amber-400)",
                                border: "1px solid rgba(245, 158, 11, 0.2)",
                              }}
                            >
                              dup
                            </span>
                          )}
                          {article.is_relevant === false && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                              style={{
                                background: "var(--navy-800)",
                                color: "var(--slate-400)",
                                border: "1px solid var(--navy-700)",
                              }}
                            >
                              irrelevant
                            </span>
                          )}
                          {article.is_relevant === true && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                              style={{
                                background: "rgba(16, 185, 129, 0.1)",
                                color: "var(--emerald-500)",
                                border: "1px solid rgba(16, 185, 129, 0.2)",
                              }}
                            >
                              relevant
                            </span>
                          )}
                          {article.summary && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                              style={{
                                background: "rgba(20, 184, 166, 0.1)",
                                color: "var(--teal-400)",
                                border: "1px solid rgba(20, 184, 166, 0.2)",
                              }}
                            >
                              summarised
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() =>
                            toggleKept(article.id, article.is_kept)
                          }
                          className="text-[11px] px-2.5 py-1 rounded-md font-medium transition-all duration-200"
                          style={
                            article.is_kept
                              ? {
                                  background: "rgba(16, 185, 129, 0.1)",
                                  color: "var(--emerald-500)",
                                  border: "1px solid rgba(16, 185, 129, 0.3)",
                                }
                              : {
                                  background: "rgba(244, 63, 94, 0.1)",
                                  color: "var(--rose-500)",
                                  border: "1px solid rgba(244, 63, 94, 0.3)",
                                }
                          }
                        >
                          {article.is_kept ? "Kept" : "Dropped"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Newsletter Preview & Exports */}
      <div className="card p-6">
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-4"
          style={{ color: "var(--slate-300)" }}
        >
          Exports & Newsletter
        </h2>
        <div className="flex gap-3">
          <a
            href={`/api/runs/${id}/export/json`}
            target="_blank"
            className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: "transparent",
              border: "1px solid var(--navy-700)",
              color: "var(--slate-400)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "var(--navy-600)";
              el.style.color = "var(--slate-200)";
              el.style.background = "var(--navy-800)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "var(--navy-700)";
              el.style.color = "var(--slate-400)";
              el.style.background = "transparent";
            }}
          >
            Export JSON
          </a>
          <a
            href={`/api/runs/${id}/export/xlsx`}
            className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: "transparent",
              border: "1px solid var(--navy-700)",
              color: "var(--slate-400)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "var(--navy-600)";
              el.style.color = "var(--slate-200)";
              el.style.background = "var(--navy-800)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "var(--navy-700)";
              el.style.color = "var(--slate-400)";
              el.style.background = "transparent";
            }}
          >
            Export XLSX
          </a>
          <a
            href={`/api/runs/${id}/newsletter`}
            target="_blank"
            className="px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, var(--teal-500), var(--teal-400))",
              color: "var(--navy-950)",
            }}
          >
            View Newsletter
          </a>
        </div>

        {run.newsletters.length > 0 && (
          <div className="mt-5">
            <iframe
              src={`/api/runs/${id}/newsletter`}
              className="w-full h-96 rounded-lg"
              style={{ border: "1px solid var(--navy-700)" }}
              title="Newsletter Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
