const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const TOKEN_KEY = "cahier_token";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// JWT Token Management
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

// API Request with JWT
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (typeof value === "string") headers[key] = value;
    });
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  // Handle token expiration - try to refresh and retry once
  if (response.status === 401 && token && path !== "/auth/refresh") {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (refreshResponse.ok) {
        const data = (await refreshResponse.json()) as { token?: string };
        if (data.token) {
          setToken(data.token);
          // Retry original request with new token
          const retryHeaders = { ...headers, Authorization: `Bearer ${data.token}` };
          response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers,
            body: options.body === undefined ? undefined : JSON.stringify(options.body),
          });
        }
      } else {
        // Refresh failed, clear token
        clearToken();
        window.dispatchEvent(new CustomEvent("logout"));
      }
    } catch (error) {
      clearToken();
      window.dispatchEvent(new CustomEvent("logout"));
    }
  }

  if (!response.ok) {
    const contentType = response.headers.get("Content-Type") || "";
    let message = `Request failed with status ${response.status}`;
    try {
      if (contentType.includes("application/json")) {
        const payload = (await response.json()) as { error?: string; message?: string };
        message = payload.error || payload.message || message;
      } else {
        const text = await response.text();
        if (text && !text.startsWith("<")) {
          message = text.slice(0, 200);
        }
      }
    } catch {
      // Swallow parse errors and use default message
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const okContentType = response.headers.get("Content-Type") || "";
  if (okContentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  // Gracefully handle empty/non-JSON bodies
  const text = await response.text();
  return (text as unknown) as T;
}

export function resolvePosterUrl(path?: string | null): string {
  if (!path) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 960">
        <rect width="640" height="960" fill="#111111"/>
        <rect x="36" y="36" width="568" height="888" rx="24" fill="#1c1c1c" stroke="#2d2d2d"/>
        <text x="50%" y="47%" dominant-baseline="middle" text-anchor="middle"
          fill="#f0ece8" font-family="Georgia, serif" font-size="54" font-style="italic">
          Cahier
        </text>
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
          fill="#7a7a7a" font-family="Arial, sans-serif" font-size="18" letter-spacing="6">
          POSTER UNAVAILABLE
        </text>
      </svg>`,
    )}`;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/")) {
    return `https://image.tmdb.org/t/p/w500${path}`;
  }

  return path;
}
