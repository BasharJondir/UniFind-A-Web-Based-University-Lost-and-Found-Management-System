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
  user_id?: string;
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
  user_id?: string;
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

// User & Authentication Types
export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_banned: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  email: string;
  full_name: string;
  password: string;
  role?: UserRole;
}
