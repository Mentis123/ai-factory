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

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Run</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Info</h2>

          <div>
            <label className={labelClass}>Run Name *</label>
            <input
              className={inputClass}
              value={form.run_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, run_name: e.target.value }))
              }
              placeholder="e.g. Weekly AI Digest - Feb 14"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Prompt Topic *</label>
            <input
              className={inputClass}
              value={form.prompt_topic}
              onChange={(e) =>
                setForm((f) => ({ ...f, prompt_topic: e.target.value }))
              }
              placeholder="e.g. Generative AI for Enterprise"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Keywords (comma-separated)</label>
            <input
              className={inputClass}
              value={form.keywords}
              onChange={(e) =>
                setForm((f) => ({ ...f, keywords: e.target.value }))
              }
              placeholder="e.g. LLM, enterprise AI, GPT, Claude"
            />
            <p className="text-xs text-gray-400 mt-1">
              Leave empty to auto-generate via AI
            </p>
          </div>

          {profiles.length > 0 && (
            <div>
              <label className={labelClass}>Profile (optional)</label>
              <select
                className={inputClass}
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

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Sources</h2>

          <div>
            <label className={labelClass}>Specific URLs (one per line)</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.specific_urls}
              onChange={(e) =>
                setForm((f) => ({ ...f, specific_urls: e.target.value }))
              }
              placeholder="Paste specific article URLs to process directly..."
            />
          </div>

          <div>
            <label className={labelClass}>
              Source URLs (one per line — RSS feeds or HTML pages)
            </label>
            <textarea
              className={inputClass}
              rows={4}
              value={form.source_urls}
              onChange={(e) =>
                setForm((f) => ({ ...f, source_urls: e.target.value }))
              }
              placeholder="https://example.com/rss&#10;https://news.site.com/ai"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Settings</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Mode</label>
              <select
                className={inputClass}
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
              <label className={labelClass}>Lookback Days</label>
              <input
                type="number"
                className={inputClass}
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
              <label className={labelClass}>Min Fit Score</label>
              <input
                type="number"
                step="0.1"
                className={inputClass}
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
              <label className={labelClass}>Max Total Articles</label>
              <input
                type="number"
                className={inputClass}
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
              <label className={labelClass}>Max Per Domain</label>
              <input
                type="number"
                className={inputClass}
                value={form.max_per_domain}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    max_per_domain: parseInt(e.target.value) || 4,
                  }))
                }
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="ranking_enabled"
                checked={form.ranking_enabled}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    ranking_enabled: e.target.checked,
                  }))
                }
                className="rounded border-gray-300"
              />
              <label
                htmlFor="ranking_enabled"
                className="text-sm text-gray-700"
              >
                Enable AI Ranking
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Run"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
