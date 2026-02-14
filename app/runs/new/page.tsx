"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";

interface Profile {
  id: string;
  name: string;
  default_source_urls: string[];
  default_keywords: string[];
}

export default function CreateRunPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    run_name: "",
    prompt_topic: "",
    keywords: "",
    specific_urls: "",
    source_urls: "",
    lookback_days: 7,
    mode: "auto",
    min_fit_score: 6.0,
    max_total_articles: 12,
    max_per_domain: 4,
    ranking_enabled: true,
    profile_id: "",
  });

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then(setProfiles);
  }, []);

  function handleProfileChange(profileId: string) {
    setForm((f) => ({ ...f, profile_id: profileId }));
    if (profileId) {
      const profile = profiles.find((p) => p.id === profileId);
      if (profile) {
        setForm((f) => ({
          ...f,
          profile_id: profileId,
          source_urls: f.source_urls || profile.default_source_urls.join("\n"),
          keywords: f.keywords || profile.default_keywords.join(", "),
        }));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const body = {
      run_name: form.run_name,
      prompt_topic: form.prompt_topic,
      keywords: form.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      specific_urls: form.specific_urls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean),
      source_urls: form.source_urls
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean),
      lookback_days: form.lookback_days,
      mode: form.mode,
      min_fit_score: form.min_fit_score,
      max_total_articles: form.max_total_articles,
      max_per_domain: form.max_per_domain,
      ranking_enabled: form.ranking_enabled,
      profile_id: form.profile_id || null,
    };

    try {
      const res = await apiFetch("/api/runs", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create run");
        return;
      }

      const run = await res.json();
      router.push(`/runs/${run.id}`);
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    background: "var(--navy-800)",
    border: "1px solid var(--navy-700)",
    color: "var(--slate-200)",
  };

  const inputFocusClass =
    "w-full rounded-lg px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:opacity-40";

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--slate-200)" }}
        >
          Create Run
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--slate-400)" }}>
          Configure a new newsletter generation pipeline
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div
            className="px-4 py-3 rounded-lg text-sm"
            style={{
              background: "rgba(244, 63, 94, 0.1)",
              color: "var(--rose-500)",
              border: "1px solid rgba(244, 63, 94, 0.2)",
            }}
          >
            {error}
          </div>
        )}

        <div className="card p-6 space-y-4">
          <h2
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--slate-300)" }}
          >
            Basic Info
          </h2>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--slate-400)" }}
            >
              Run Name *
            </label>
            <input
              className={inputFocusClass}
              style={{
                ...inputStyle,
                boxShadow: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--teal-500)";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(20, 184, 166, 0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--navy-700)";
                e.currentTarget.style.boxShadow = "none";
              }}
              value={form.run_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, run_name: e.target.value }))
              }
              placeholder="e.g. Weekly AI Digest - Feb 14"
              required
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--slate-400)" }}
            >
              Prompt Topic *
            </label>
            <input
              className={inputFocusClass}
              style={{ ...inputStyle, boxShadow: "none" }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--teal-500)";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(20, 184, 166, 0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--navy-700)";
                e.currentTarget.style.boxShadow = "none";
              }}
              value={form.prompt_topic}
              onChange={(e) =>
                setForm((f) => ({ ...f, prompt_topic: e.target.value }))
              }
              placeholder="e.g. Generative AI for Enterprise"
              required
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--slate-400)" }}
            >
              Keywords (comma-separated)
            </label>
            <input
              className={inputFocusClass}
              style={{ ...inputStyle, boxShadow: "none" }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--teal-500)";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(20, 184, 166, 0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--navy-700)";
                e.currentTarget.style.boxShadow = "none";
              }}
              value={form.keywords}
              onChange={(e) =>
                setForm((f) => ({ ...f, keywords: e.target.value }))
              }
              placeholder="e.g. LLM, enterprise AI, GPT, Claude"
            />
            <p
              className="text-[11px] mt-1.5 font-mono"
              style={{ color: "var(--slate-400)", opacity: 0.7 }}
            >
              Leave empty to auto-generate via AI
            </p>
          </div>

          {profiles.length > 0 && (
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--slate-400)" }}
              >
                Profile (optional)
              </label>
              <select
                className={inputFocusClass}
                style={{ ...inputStyle, boxShadow: "none" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--teal-500)";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(20, 184, 166, 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--navy-700)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                value={form.profile_id}
                onChange={(e) => handleProfileChange(e.target.value)}
              >
                <option value="">No profile</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="card p-6 space-y-4">
          <h2
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--slate-300)" }}
          >
            Sources
          </h2>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--slate-400)" }}
            >
              Specific URLs (one per line)
            </label>
            <textarea
              className={inputFocusClass}
              style={{ ...inputStyle, boxShadow: "none" }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--teal-500)";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(20, 184, 166, 0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--navy-700)";
                e.currentTarget.style.boxShadow = "none";
              }}
              rows={3}
              value={form.specific_urls}
              onChange={(e) =>
                setForm((f) => ({ ...f, specific_urls: e.target.value }))
              }
              placeholder="Paste specific article URLs to process directly..."
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--slate-400)" }}
            >
              Source URLs (one per line — RSS feeds or HTML pages)
            </label>
            <textarea
              className={inputFocusClass}
              style={{ ...inputStyle, boxShadow: "none" }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--teal-500)";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(20, 184, 166, 0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--navy-700)";
                e.currentTarget.style.boxShadow = "none";
              }}
              rows={4}
              value={form.source_urls}
              onChange={(e) =>
                setForm((f) => ({ ...f, source_urls: e.target.value }))
              }
              placeholder={"https://example.com/rss\nhttps://news.site.com/ai"}
            />
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--slate-300)" }}
          >
            Settings
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--slate-400)" }}
              >
                Mode
              </label>
              <select
                className={inputFocusClass}
                style={{ ...inputStyle, boxShadow: "none" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--teal-500)";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(20, 184, 166, 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--navy-700)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                value={form.mode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mode: e.target.value }))
                }
              >
                <option value="auto">Auto (end-to-end)</option>
                <option value="guided">Guided (with checkpoints)</option>
              </select>
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--slate-400)" }}
              >
                Lookback Days
              </label>
              <input
                type="number"
                className={inputFocusClass}
                style={{ ...inputStyle, boxShadow: "none" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--teal-500)";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(20, 184, 166, 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--navy-700)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                value={form.lookback_days}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    lookback_days: parseInt(e.target.value) || 7,
                  }))
                }
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--slate-400)" }}
              >
                Min Fit Score
              </label>
              <input
                type="number"
                step="0.1"
                className={inputFocusClass}
                style={{ ...inputStyle, boxShadow: "none" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--teal-500)";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(20, 184, 166, 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--navy-700)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                value={form.min_fit_score}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    min_fit_score: parseFloat(e.target.value) || 6.0,
                  }))
                }
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--slate-400)" }}
              >
                Max Total Articles
              </label>
              <input
                type="number"
                className={inputFocusClass}
                style={{ ...inputStyle, boxShadow: "none" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--teal-500)";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(20, 184, 166, 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--navy-700)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                value={form.max_total_articles}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    max_total_articles: parseInt(e.target.value) || 12,
                  }))
                }
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--slate-400)" }}
              >
                Max Per Domain
              </label>
              <input
                type="number"
                className={inputFocusClass}
                style={{ ...inputStyle, boxShadow: "none" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--teal-500)";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(20, 184, 166, 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--navy-700)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                value={form.max_per_domain}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    max_per_domain: parseInt(e.target.value) || 4,
                  }))
                }
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    ranking_enabled: !f.ranking_enabled,
                  }))
                }
                className="relative w-10 h-5 rounded-full transition-all duration-200"
                style={{
                  background: form.ranking_enabled
                    ? "var(--teal-500)"
                    : "var(--navy-700)",
                }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200"
                  style={{
                    background: "var(--slate-200)",
                    left: form.ranking_enabled ? "22px" : "2px",
                  }}
                />
              </button>
              <label
                className="text-sm"
                style={{ color: "var(--slate-300)" }}
              >
                Enable AI Ranking
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, var(--teal-500), var(--teal-400))",
              color: "var(--navy-950)",
            }}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                Creating...
              </span>
            ) : (
              "Create Run"
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: "transparent",
              border: "1px solid var(--navy-700)",
              color: "var(--slate-400)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--navy-600)";
              e.currentTarget.style.color = "var(--slate-200)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--navy-700)";
              e.currentTarget.style.color = "var(--slate-400)";
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
