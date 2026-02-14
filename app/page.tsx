"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
      .then((r) => r.json())
      .then(setRuns)
      .finally(() => setLoading(false));
  }, []);

  function phaseProgress(phases: RunPhase[]) {
    const completed = phases.filter(
      (p) => p.status === "completed" || p.status === "skipped"
    ).length;
    return `${completed}/${phases.length}`;
  }

  function statusBadge(status: string) {
    const colors: Record<string, string> = {
      created: "bg-gray-100 text-gray-700",
      running: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.created}`}
      >
        {status}
      </span>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Runs</h1>
        <Link
          href="/runs/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Create Run
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : runs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">No runs yet.</p>
          <Link
            href="/runs/new"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first run
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Topic
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Mode
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Phases
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Articles
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {runs.map((run) => (
                <tr
                  key={run.id}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/runs/${run.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      {run.run_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {run.prompt_topic}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {run.mode}
                  </td>
                  <td className="px-4 py-3">{statusBadge(run.status)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                    {phaseProgress(run.phases)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {run._count.articles}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(run.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
