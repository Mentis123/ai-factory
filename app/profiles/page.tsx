"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";

interface Profile {
  id: string;
  name: string;
  default_source_urls: string[];
  default_keywords: string[];
  trends_to_watch: string[];
  competitors_to_monitor: string[];
  created_at: string;
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    default_source_urls: "",
    default_keywords: "",
    trends_to_watch: "",
    competitors_to_monitor: "",
  });

  function fetchProfiles() {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then(setProfiles)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchProfiles();
  }, []);

  function resetForm() {
    setForm({
      name: "",
      default_source_urls: "",
      default_keywords: "",
      trends_to_watch: "",
      competitors_to_monitor: "",
    });
    setEditing(null);
    setShowForm(false);
  }

  function editProfile(profile: Profile) {
    setForm({
      name: profile.name,
      default_source_urls: profile.default_source_urls.join("\n"),
      default_keywords: profile.default_keywords.join("\n"),
      trends_to_watch: profile.trends_to_watch.join("\n"),
      competitors_to_monitor: profile.competitors_to_monitor.join("\n"),
    });
    setEditing(profile);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lines = (s: string) =>
      s
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    const body = {
      ...(editing ? { id: editing.id } : {}),
      name: form.name,
      default_source_urls: lines(form.default_source_urls),
      default_keywords: lines(form.default_keywords),
      trends_to_watch: lines(form.trends_to_watch),
      competitors_to_monitor: lines(form.competitors_to_monitor),
    };

    await apiFetch("/api/profiles", {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(body),
    });

    resetForm();
    fetchProfiles();
  }

  async function deleteProfile(id: string) {
    await apiFetch(`/api/profiles?id=${id}`, { method: "DELETE" });
    fetchProfiles();
  }

  const inputStyle = {
    background: "var(--navy-800)",
    border: "1px solid var(--navy-700)",
    color: "var(--slate-200)",
  };

  const inputFocusClass =
    "w-full rounded-lg px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none placeholder:opacity-40";

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--slate-200)" }}
          >
            Profiles
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--slate-400)" }}>
            Reusable source configurations for pipeline runs
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, var(--teal-500), var(--teal-400))",
            color: "var(--navy-950)",
          }}
        >
          + New Profile
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="card p-6 mb-6 space-y-4"
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--slate-300)" }}
          >
            {editing ? "Edit Profile" : "New Profile"}
          </h2>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--slate-400)" }}
            >
              Name *
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
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="e.g. Enterprise AI Weekly"
              required
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--slate-400)" }}
            >
              Default Source URLs (one per line)
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
              value={form.default_source_urls}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  default_source_urls: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--slate-400)" }}
            >
              Default Keywords (one per line)
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
              rows={2}
              value={form.default_keywords}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  default_keywords: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--slate-400)" }}
            >
              Trends to Watch (one per line)
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
              rows={2}
              value={form.trends_to_watch}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  trends_to_watch: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--slate-400)" }}
            >
              Competitors to Monitor (one per line)
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
              rows={2}
              value={form.competitors_to_monitor}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  competitors_to_monitor: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, var(--teal-500), var(--teal-400))",
                color: "var(--navy-950)",
              }}
            >
              {editing ? "Update Profile" : "Create Profile"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200"
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
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="card text-center py-16 px-6">
          <div
            className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{
              background: "var(--navy-800)",
              border: "1px solid var(--navy-700)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--slate-400)" }}>
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <p className="text-sm mb-1" style={{ color: "var(--slate-300)" }}>
            No profiles yet
          </p>
          <p className="text-xs" style={{ color: "var(--slate-400)" }}>
            Create a profile to save reusable source configurations
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="card p-5 transition-card"
            >
              <div className="flex items-center justify-between">
                <h3
                  className="font-medium text-sm"
                  style={{ color: "var(--slate-200)" }}
                >
                  {profile.name}
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => editProfile(profile)}
                    className="text-xs font-medium transition-colors"
                    style={{ color: "var(--teal-400)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--teal-500)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--teal-400)";
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteProfile(profile.id)}
                    className="text-xs font-medium transition-colors"
                    style={{ color: "var(--rose-500)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.7";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-3 flex gap-6 text-xs" style={{ color: "var(--slate-400)" }}>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--teal-400)" }}
                  />
                  <span className="font-medium" style={{ color: "var(--slate-300)" }}>
                    {profile.default_source_urls.length}
                  </span>{" "}
                  sources
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--amber-400)" }}
                  />
                  <span className="font-medium" style={{ color: "var(--slate-300)" }}>
                    {profile.default_keywords.length}
                  </span>{" "}
                  keywords
                </div>
                {profile.trends_to_watch.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "var(--emerald-500)" }}
                    />
                    <span className="font-medium" style={{ color: "var(--slate-300)" }}>
                      {profile.trends_to_watch.length}
                    </span>{" "}
                    trends
                  </div>
                )}
              </div>
              {profile.default_keywords.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.default_keywords.slice(0, 6).map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[11px]"
                      style={{
                        background: "var(--navy-800)",
                        color: "var(--slate-400)",
                        border: "1px solid var(--navy-700)",
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                  {profile.default_keywords.length > 6 && (
                    <span
                      className="px-2 py-0.5 rounded text-[11px]"
                      style={{ color: "var(--slate-400)" }}
                    >
                      +{profile.default_keywords.length - 6} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
