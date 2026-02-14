"use client";

import { useEffect, useState } from "react";

export default function AdminTokenInput() {
  const [token, setToken] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (saved) setToken(saved);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="admin-token" className="text-xs text-gray-400">
        Token:
      </label>
      <input
        id="admin-token"
        type="password"
        placeholder="Admin token"
        className="border border-gray-200 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={token}
        onChange={(e) => {
          setToken(e.target.value);
          localStorage.setItem("admin_token", e.target.value);
        }}
      />
    </div>
  );
}
