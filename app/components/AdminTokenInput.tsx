"use client";

import { useEffect, useState } from "react";

export default function AdminTokenInput() {
  const [token, setToken] = useState("");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (saved) setToken(saved);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="admin-token"
        className="text-[11px] font-mono uppercase tracking-wider"
        style={{ color: "var(--slate-400)" }}
      >
        Token
      </label>
      <input
        id="admin-token"
        type="password"
        placeholder="Enter token"
        className="rounded-md px-2.5 py-1 text-xs w-28 transition-all duration-200 focus:outline-none"
        style={{
          background: focused ? "var(--navy-800)" : "var(--navy-900)",
          border: `1px solid ${focused ? "var(--teal-500)" : "var(--navy-700)"}`,
          color: "var(--slate-200)",
          boxShadow: focused ? "0 0 0 2px rgba(20, 184, 166, 0.15)" : "none",
        }}
        value={token}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          setToken(e.target.value);
          localStorage.setItem("admin_token", e.target.value);
        }}
      />
      {token && (
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--emerald-500)" }}
          title="Token set"
        />
      )}
    </div>
  );
}
