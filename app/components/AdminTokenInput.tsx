"use client";

import { useEffect, useRef, useState } from "react";

export default function AdminTokenInput() {
  const [token, setToken] = useState("");
  const [focused, setFocused] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (saved) {
      setToken(saved);
      verifyToken(saved);
    }
  }, []);

  function verifyToken(value: string) {
    if (!value) {
      setVerified(null);
      return;
    }
    fetch("/api/runs", { headers: { "x-admin-token": value } })
      .then((r) => setVerified(r.status !== 401))
      .catch(() => setVerified(false));
  }

  function handleChange(value: string) {
    setToken(value);
    localStorage.setItem("admin_token", value);
    setVerified(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => verifyToken(value), 500);
  }

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
        onChange={(e) => handleChange(e.target.value)}
      />
      {token && (
        <div
          className="w-2 h-2 rounded-full transition-colors duration-300"
          style={{
            background:
              verified === true
                ? "var(--emerald-500)"
                : verified === false
                  ? "var(--rose-500)"
                  : "var(--slate-500)",
          }}
          title={
            verified === true
              ? "Authenticated"
              : verified === false
                ? "Invalid token"
                : "Verifying..."
          }
        />
      )}
    </div>
  );
}
