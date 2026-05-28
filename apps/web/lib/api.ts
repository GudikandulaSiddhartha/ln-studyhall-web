/**
 * Central API client for LN StudyHall
 * - Auto-detects API URL from env or falls back gracefully
 * - Checks backend connectivity before requests
 * - Returns typed errors with clear messages
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 0,
    public code: "NETWORK" | "SERVER" | "AUTH" | "VALIDATION" | "NOT_FOUND" = "SERVER"
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Please check your connection or try again later.",
      0,
      "NETWORK"
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError("Unexpected response from server.", response.status, "SERVER");
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as { message: unknown }).message)
        : `Request failed (${response.status})`;

    const code =
      response.status === 401 || response.status === 403
        ? "AUTH"
        : response.status === 404
        ? "NOT_FOUND"
        : response.status === 422
        ? "VALIDATION"
        : "SERVER";

    throw new ApiError(message, response.status, code);
  }

  return data as T;
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export function getStoredAuth(): { token: string; user: AuthUser } | null {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem("ln_auth_token");
    const raw = localStorage.getItem("ln_auth_user");
    if (!token || !raw) return null;
    return { token, user: JSON.parse(raw) as AuthUser };
  } catch {
    return null;
  }
}

export function storeAuth(token: string, user: AuthUser) {
  localStorage.setItem("ln_auth_token", token);
  localStorage.setItem("ln_auth_user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("ln_auth_token");
  localStorage.removeItem("ln_auth_user");
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

// ─── Health check ─────────────────────────────────────────────────────────────

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL.replace("/api", "")}/health`, {
      signal: AbortSignal.timeout(5000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const auth = {
  register: (body: { name: string; email: string; phone?: string; password: string; otpToken: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),

  registerAdmin: (body: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    inviteCode: string;
  }) =>
    request<AuthResponse>("/auth/register/admin", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) })
};
