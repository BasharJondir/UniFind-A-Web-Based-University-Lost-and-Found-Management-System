import {
  Item,
  ItemInput,
  ItemStatus,
  Stats,
  FilterState,
  User,
  AuthResponse,
  LoginInput,
  SignupInput,
} from "./types";

// In-memory token storage (persists per tab session)
let inMemoryAccessToken: string | null = null;
let onAuthFailureCallback: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  if (token) {
    sessionStorage.setItem("unifind_access_token", token);
  } else {
    sessionStorage.removeItem("unifind_access_token");
  }
}

export function getAccessToken(): string | null {
  if (!inMemoryAccessToken) {
    inMemoryAccessToken = sessionStorage.getItem("unifind_access_token");
  }
  return inMemoryAccessToken;
}

export function setOnAuthFailure(callback: () => void) {
  onAuthFailureCallback = callback;
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  body?: any,
  isRetry: boolean = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: "same-origin", // send HttpOnly cookies for refresh endpoint
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  // If access token expired (401) and not already a retry, attempt automatic silent refresh
  if (res.status === 401 && !isRetry && !url.includes("/api/auth/")) {
    try {
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.access_token) {
          setAccessToken(refreshData.access_token);
          // Retry the original request with the fresh token
          return request<T>(method, url, body, true);
        }
      }
    } catch {
      // Refresh failed; clear auth
      setAccessToken(null);
      if (onAuthFailureCallback) onAuthFailureCallback();
    }
  }

  let data: any = null;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorDetail =
      typeof data === "object" && data?.detail ? data.detail : res.statusText;
    throw new Error(errorDetail || `Request failed with status ${res.status}`);
  }

  return data as T;
}

// ==========================================
// Authentication API Endpoints
// ==========================================

export async function signupApi(data: SignupInput): Promise<User> {
  return request<User>("POST", "/api/auth/signup", data);
}

export async function loginApi(credentials: LoginInput): Promise<AuthResponse> {
  const res = await request<AuthResponse>("POST", "/api/auth/login", credentials);
  if (res.access_token) {
    setAccessToken(res.access_token);
  }
  return res;
}

export async function refreshApi(): Promise<{ access_token: string }> {
  const res = await request<{ access_token: string }>("POST", "/api/auth/refresh");
  if (res.access_token) {
    setAccessToken(res.access_token);
  }
  return res;
}

export async function logoutApi(): Promise<{ message: string }> {
  try {
    return await request<{ message: string }>("POST", "/api/auth/logout");
  } finally {
    setAccessToken(null);
  }
}

export async function fetchMeApi(): Promise<User> {
  return request<User>("GET", "/api/users/me");
}

// ==========================================
// Items & Dashboard Stats API Endpoints
// ==========================================

export async function fetchStats(): Promise<Stats> {
  return request<Stats>("GET", "/api/stats");
}

export async function fetchItems(filters?: Partial<FilterState>): Promise<Item[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.type && filters.type !== "all") params.append("type", filters.type);
  if (filters?.category && filters.category !== "all") params.append("category", filters.category);
  if (filters?.status && filters.status !== "all") params.append("status", filters.status);

  const query = params.toString() ? `?${params.toString()}` : "";
  return request<Item[]>("GET", `/api/items${query}`);
}

export async function fetchItem(id: string): Promise<Item> {
  return request<Item>("GET", `/api/items/${id}`);
}

export async function createItem(data: ItemInput): Promise<Item> {
  return request<Item>("POST", "/api/items", data);
}

export async function updateItem(id: string, data: Partial<ItemInput>): Promise<Item> {
  return request<Item>("PUT", `/api/items/${id}`, data);
}

export async function updateItemStatus(id: string, status: ItemStatus): Promise<Item> {
  return request<Item>("PATCH", `/api/items/${id}/status`, { status });
}

export async function deleteItem(id: string): Promise<{ message: string; id: string }> {
  return request<{ message: string; id: string }>("DELETE", `/api/items/${id}`);
}
