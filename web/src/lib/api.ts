const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// custom error class so callers can catch API errors specifically
export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "APIError";
  }
}

async function parseError(res: Response): Promise<APIError> {
  try {
    const data = await res.json();
    return new APIError(
      res.status,
      data.error?.code ?? "UNKNOWN",
      data.error?.message ?? "an unexpected error occurred",
    );
  } catch {
    return new APIError(res.status, "UNKNOWN", "an unexpected error occurred");
  }
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) return false;

    const json = await res.json();

    const user = json.data?.user;
    const accessToken = json.data?.access_token;

    if (!user || !accessToken) return false;

    const { setAuth } = (await import("@/store/auth")).useAuthStore.getState();
    setAuth(user, accessToken);

    return true;
  } catch {
    return false;
  }
}

async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const { accessToken } = (
    await import("@/store/auth")
  ).useAuthStore.getState();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();

    if (!refreshed) {
      const { clearAuth } = (
        await import("@/store/auth")
      ).useAuthStore.getState();
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/signin";
      }
      throw new APIError(401, "UNAUTHORIZED", "session expired");
    }

    const { accessToken: newToken } = (
      await import("@/store/auth")
    ).useAuthStore.getState();

    const retryRes = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${newToken}`,
        ...(options.headers as Record<string, string>),
      },
      credentials: "include",
    });

    if (!retryRes.ok) throw await parseError(retryRes);
    return retryRes;
  }

  if (!res.ok) throw await parseError(res);
  return res;
}

// public fetch — no auth header, no token refresh
// used for login, register, public event listing etc
async function fetchPublic(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
    credentials: "include",
  });

  if (!res.ok) throw await parseError(res);
  return res;
}

export const api = {
  // authenticated requests
  get: (endpoint: string, options?: RequestInit) =>
    fetchWithAuth(endpoint, { ...options, method: "GET" }),

  post: (endpoint: string, body: unknown, options?: RequestInit) =>
    fetchWithAuth(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),

  patch: (endpoint: string, body: unknown, options?: RequestInit) =>
    fetchWithAuth(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: (endpoint: string, options?: RequestInit) =>
    fetchWithAuth(endpoint, { ...options, method: "DELETE" }),

  // public requests — no auth
  public: {
    get: (endpoint: string, options?: RequestInit) =>
      fetchPublic(endpoint, { ...options, method: "GET" }),

    post: (endpoint: string, body: unknown, options?: RequestInit) =>
      fetchPublic(endpoint, {
        ...options,
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
};
