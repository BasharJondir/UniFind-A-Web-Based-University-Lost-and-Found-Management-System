import { Item, ItemInput, ItemStatus, Stats, FilterState } from "./types";

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  body?: any
): Promise<T> {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  let data: any = null;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorDetail = typeof data === "object" && data?.detail ? data.detail : res.statusText;
    throw new Error(errorDetail || `Request failed with status ${res.status}`);
  }

  return data as T;
}

// 1. Get Summary Stats
export async function fetchStats(): Promise<Stats> {
  return request<Stats>("GET", "/api/stats");
}

// 2. Read All Items (List with filters)
export async function fetchItems(filters?: Partial<FilterState>): Promise<Item[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.type && filters.type !== "all") params.append("type", filters.type);
  if (filters?.category && filters.category !== "all") params.append("category", filters.category);
  if (filters?.status && filters.status !== "all") params.append("status", filters.status);

  const query = params.toString() ? `?${params.toString()}` : "";
  return request<Item[]>("GET", `/api/items${query}`);
}

// 3. Read Single Item by ID
export async function fetchItem(id: string): Promise<Item> {
  return request<Item>("GET", `/api/items/${id}`);
}

// 4. Create New Item Report
export async function createItem(data: ItemInput): Promise<Item> {
  return request<Item>("POST", "/api/items", data);
}

// 5. Update Existing Item
export async function updateItem(id: string, data: Partial<ItemInput>): Promise<Item> {
  return request<Item>("PUT", `/api/items/${id}`, data);
}

// 6. Quick Update Status
export async function updateItemStatus(id: string, status: ItemStatus): Promise<Item> {
  return request<Item>("PATCH", `/api/items/${id}/status`, { status });
}

// 7. Delete Item
export async function deleteItem(id: string): Promise<{ message: string; id: string }> {
  return request<{ message: string; id: string }>("DELETE", `/api/items/${id}`);
}
