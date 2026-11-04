export type ItemType = "lost" | "found";
export type ItemStatus = "missing" | "found" | "returned";

export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  type: ItemType;
  location: string;
  date: string;
  contact_email: string;
  image_url?: string;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
}

export interface ItemInput {
  title: string;
  description: string;
  category: string;
  type: ItemType;
  location: string;
  date: string;
  contact_email: string;
  image_url?: string;
  status: ItemStatus;
}

export interface Stats {
  total: number;
  lost: number;
  found: number;
  returned: number;
}

export interface FilterState {
  search: string;
  type: "all" | ItemType;
  category: string;
  status: "all" | ItemStatus;
}
