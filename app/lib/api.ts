export function getAdminToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("admin_token") || "";
}

export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const token = getAdminToken();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": token,
      ...options?.headers,
    },
  });
}

// Safe JSON parse — handles empty/non-JSON responses
export async function safeJson<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) throw new Error(`Empty response (${res.status})`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Server error (${res.status}): ${text.slice(0, 200)}`);
  }
}
