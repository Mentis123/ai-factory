"use client";

import { useState, useEffect, useCallback } from "react";

interface Article {
  id: number;
  title: string;
  url: string;
  source: string;
  publishedDate: string | null;
  aiSummary: string | null;
  aiAnalysis: string | null;
  importance: number;
}

interface ResearchRun {
  id: number;
  query: string;
  status: string;
  articleCount: number;
  createdAt: string;
  articles: Article[];
}

type TabView = "articles" | "briefing";

export default function Dashboard(): React.ReactElement {
  const [runs, setRuns] = useState<ResearchRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("latest AI industry news and developments");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabView>("articles");
  const [briefing, setBriefing] = useState<string | null>(null);
  const [generatingBriefing, setGeneratingBriefing] = useState(false);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/research?limit=10");
      const json = await res.json();
      if (json.data) setRuns(json.data);
    } catch {
      setError("Failed to load research data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const runResearch = async (): Promise<void> => {
    if (running || !query.trim()) return;
    setRunning(true);
    setError(null);

    try {
      const res = await fetch("/api/research/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), numResults: 8 }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Research failed");
        return;
      }

      await fetchRuns();
    } catch {
      setError("Network error — could not reach server");
    } finally {
      setRunning(false);
    }
  };

  const generateBriefingFromRun = async (runId: number): Promise<void> => {
    setGeneratingBriefing(true);
    setError(null);
    setTab("briefing");

    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Briefing generation failed");
        return;
      }

      setBriefing(json.data.briefing);
    } catch {
      setError("Failed to generate briefing");
    } finally {
      setGeneratingBriefing(false);
    }
  };

  const latestRun = runs[0];
  const latestArticles = latestRun?.articles ?? [];

  return (
    <div className="app-container">
      {/* Header */}
      <div className="app-header">
        <div className="app-logo">
          <h1>AI Navigator</h1>
          <span>GAI Insights Intelligence</span>
        </div>
        <div className="app-header-actions">
          {latestRun && latestRun.status === "completed" && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => generateBriefingFromRun(latestRun.id)}
              disabled={generatingBriefing}
            >
              {generatingBriefing ? "Generating..." : "Generate Briefing"}
            </button>
          )}
        </div>
      </div>

      {/* Research bar */}
      <div className="research-bar">
        <input
          className="research-input"
          type="text"
          placeholder="Research query (e.g. latest AI industry news)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runResearch();
          }}
        />
        <button
          className="btn btn-primary"
          onClick={runResearch}
          disabled={running || !query.trim()}
        >
          {running ? "Researching..." : "Run Research"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="status-bar" style={{ borderColor: "var(--danger)" }}>
          <div className="status-dot failed" />
          <span className="status-text" style={{ color: "#fca5a5" }}>{error}</span>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Status */}
      {latestRun && (
        <div className="status-bar">
          <div className={`status-dot ${latestRun.status}`} />
          <span className="status-text">
            Last run: &ldquo;{latestRun.query}&rdquo; &mdash; {latestRun.articleCount} articles
          </span>
          <span className="status-count">
            {new Date(latestRun.createdAt).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${tab === "articles" ? "active" : ""}`}
          onClick={() => setTab("articles")}
        >
          Articles ({latestArticles.length})
        </button>
        <button
          className={`tab ${tab === "briefing" ? "active" : ""}`}
          onClick={() => setTab("briefing")}
        >
          Briefing
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : tab === "articles" ? (
        latestArticles.length === 0 ? (
          <div className="empty-state">
            <h3>No research yet</h3>
            <p>Enter a query above and run your first research pipeline to discover the latest AI developments.</p>
          </div>
        ) : (
          <div className="article-list">
            {latestArticles.map((article) => (
              <div key={article.id} className="article-card">
                <div className="article-card-header">
                  <div className={`article-importance importance-${article.importance}`}>
                    {article.importance}
                  </div>
                  <h3 className="article-title">
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                  </h3>
                </div>

                <div className="article-meta">
                  <span>{article.source}</span>
                  {article.publishedDate && (
                    <span>{new Date(article.publishedDate).toLocaleDateString()}</span>
                  )}
                </div>

                {article.aiSummary && (
                  <p className="article-summary">{article.aiSummary}</p>
                )}

                {article.aiAnalysis && (
                  <div className="article-analysis">{article.aiAnalysis}</div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="briefing-container">
          {generatingBriefing ? (
            <div className="loading-center">
              <div className="spinner" />
            </div>
          ) : briefing ? (
            <div
              className="briefing-content"
              dangerouslySetInnerHTML={{
                __html: briefing
                  .replace(/^# (.*$)/gm, "<h1>$1</h1>")
                  .replace(/^## (.*$)/gm, "<h2>$1</h2>")
                  .replace(/^- (.*$)/gm, "<li>$1</li>")
                  .replace(/\n\n/g, "</p><p>")
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
              }}
            />
          ) : (
            <div className="empty-state">
              <h3>No briefing generated</h3>
              <p>Run research first, then click &ldquo;Generate Briefing&rdquo; to create an executive intelligence summary.</p>
            </div>
          )}
        </div>
      )}

      {/* Previous runs */}
      {runs.length > 1 && tab === "articles" && (
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid var(--border)` }}>
          <h3 style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 12 }}>Previous Runs</h3>
          {runs.slice(1).map((run) => (
            <div
              key={run.id}
              className="status-bar"
              style={{ cursor: "pointer", marginBottom: 8 }}
            >
              <div className={`status-dot ${run.status}`} />
              <span className="status-text">{run.query}</span>
              <span className="status-count">{run.articleCount} articles</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
