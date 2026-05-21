const BASE_URL = "";

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

const getAuthStore = () =>
  import("@/store/auth").then((m) => m.useAuthStore.getState());

function redirectToSignIn(): never {
  if (typeof window !== "undefined") {
    document.cookie =
      "_sid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict";
    window.location.href = "/signin";
  }
  throw new APIError(401, "UNAUTHORIZED", "session expired");
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
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

      const { setAuth } = await getAuthStore();
      setAuth(user, accessToken);

      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const { accessToken } = await getAuthStore();

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...(options.headers as Record<string, string>),
    },
    credentials: "include",
  });

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();

    if (!refreshed) {
      const { clearAuth } = await getAuthStore();
      clearAuth();
      redirectToSignIn();
    }

    const { accessToken: newToken } = await getAuthStore();

    const retryRes = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${newToken}`,
        ...(options.headers as Record<string, string>),
      },
      credentials: "include",
    });

    if (retryRes.status === 401) {
      const { clearAuth } = await getAuthStore();
      clearAuth();
      redirectToSignIn();
    }

    if (!retryRes.ok) throw await parseError(retryRes);
    return retryRes;
  }

  if (!res.ok) throw await parseError(res);
  return res;
}

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
