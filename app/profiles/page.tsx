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

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profiles</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          New Profile
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg border border-gray-200 p-6 mb-6 space-y-4"
        >
          <h2 className="font-semibold text-gray-900">
            {editing ? "Edit Profile" : "New Profile"}
          </h2>

          <div>
            <label className={labelClass}>Name *</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className={labelClass}>
              Default Source URLs (one per line)
            </label>
            <textarea
              className={inputClass}
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
            <label className={labelClass}>
              Default Keywords (one per line)
            </label>
            <textarea
              className={inputClass}
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
            <label className={labelClass}>
              Trends to Watch (one per line)
            </label>
            <textarea
              className={inputClass}
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
            <label className={labelClass}>
              Competitors to Monitor (one per line)
            </label>
            <textarea
              className={inputClass}
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

          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              {editing ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No profiles yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{profile.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => editProfile(profile)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteProfile(profile.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <span className="font-medium">Sources:</span>{" "}
                  {profile.default_source_urls.length} URLs
                </div>
                <div>
                  <span className="font-medium">Keywords:</span>{" "}
                  {profile.default_keywords.join(", ") || "None"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
