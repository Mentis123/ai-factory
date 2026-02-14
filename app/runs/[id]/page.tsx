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

  function statusColor(status: string) {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "skipped":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-500";
    }
  }

  function tierBadge(tier: string | undefined, score: number | undefined) {
    if (!tier) return null;
    const colors: Record<string, string> = {
      Essential: "bg-red-100 text-red-700",
      Important: "bg-amber-100 text-amber-700",
      Optional: "bg-gray-100 text-gray-600",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[tier] || colors.Optional}`}
      >
        {tier} {score?.toFixed(1)}
      </span>
    );
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

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!run) return <p className="text-red-500">Run not found.</p>;

  const nextPhase = getNextPhase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{run.run_name}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {run.prompt_topic} &middot; {run.mode} mode &middot;{" "}
          {run.keywords.join(", ")}
        </p>
      </div>

      {/* Phase Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Pipeline Phases</h2>
          <div className="flex gap-2">
            {nextPhase && (
              <>
                <button
                  onClick={() => executePhase(nextPhase)}
                  disabled={!!executing}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {executing
                    ? `Running ${PHASE_LABELS[executing]}...`
                    : `Run: ${PHASE_LABELS[nextPhase]}`}
                </button>
                <button
                  onClick={() => executePhase(nextPhase, true)}
                  disabled={!!executing}
                  className="border border-blue-200 text-blue-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-50"
                >
                  Run All Remaining
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {run.phases.map((phase) => (
            <div
              key={phase.id}
              className="text-center"
            >
              <div
                className={`px-2 py-2 rounded-lg text-xs font-medium ${statusColor(phase.status)}`}
              >
                {PHASE_LABELS[phase.phase_name] || phase.phase_name}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{phase.status}</p>
              {phase.status === "failed" && (
                <button
                  onClick={() => executePhase(phase.phase_name)}
                  disabled={!!executing}
                  className="text-[10px] text-red-600 hover:underline mt-1"
                >
                  Retry
                </button>
              )}
            </div>
          ))}
        </div>

        {phaseLogs && (
          <pre className="mt-4 bg-gray-50 p-3 rounded text-xs text-gray-600 overflow-auto max-h-60 whitespace-pre-wrap">
            {phaseLogs}
          </pre>
        )}
      </div>

      {/* Articles Table */}
      {run.articles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              Articles ({filteredArticles?.length})
            </h2>
            <div className="flex gap-1">
              {["all", "relevant", "shortlisted", "final", "dropped"].map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      filter === f
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
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
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">
                    Title
                  </th>
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">
                    Domain
                  </th>
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">
                    Words
                  </th>
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">
                    Tier
                  </th>
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">
                    Status
                  </th>
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">
                    Keep
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles?.map((article) => (
                  <tr
                    key={article.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-2 px-2 max-w-xs">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs block truncate"
                      >
                        {article.title || article.url}
                      </a>
                      {article.summary && (
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                          {article.summary.summary_text}
                        </p>
                      )}
                    </td>
                    <td className="py-2 px-2 text-xs text-gray-500">
                      {article.domain}
                    </td>
                    <td className="py-2 px-2 text-xs text-gray-500">
                      {article.word_count || "—"}
                    </td>
                    <td className="py-2 px-2">
                      {tierBadge(
                        article.ranking?.tier,
                        article.ranking?.score
                      )}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex gap-1 flex-wrap">
                        {article.is_duplicate && (
                          <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 rounded">
                            dup
                          </span>
                        )}
                        {article.is_relevant === false && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 rounded">
                            irrelevant
                          </span>
                        )}
                        {article.is_relevant === true && (
                          <span className="text-[10px] bg-green-100 text-green-600 px-1.5 rounded">
                            relevant
                          </span>
                        )}
                        {article.summary && (
                          <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded">
                            summarised
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() =>
                          toggleKept(article.id, article.is_kept)
                        }
                        className={`text-xs px-2 py-0.5 rounded ${
                          article.is_kept
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {article.is_kept ? "Kept" : "Dropped"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Newsletter Preview & Exports */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          Exports & Newsletter
        </h2>
        <div className="flex gap-3">
          <a
            href={`/api/runs/${id}/export/json`}
            target="_blank"
            className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Export JSON
          </a>
          <a
            href={`/api/runs/${id}/export/xlsx`}
            className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Export XLSX
          </a>
          <a
            href={`/api/runs/${id}/newsletter`}
            target="_blank"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            View Newsletter
          </a>
        </div>

        {run.newsletters.length > 0 && (
          <div className="mt-4">
            <iframe
              src={`/api/runs/${id}/newsletter`}
              className="w-full h-96 border border-gray-200 rounded-lg"
              title="Newsletter Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
