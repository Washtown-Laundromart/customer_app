// This customer app should never call Uber, Bolt, Kwik, or Paystack secret APIs directly.
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");

export type ApiUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  defaultAddress?: string | null;
  role: "SUPER_ADMIN" | "BRANCH_ADMIN" | "BRANCH_STAFF" | "CUSTOMER";
  branchId?: string | null;
};

export type AuthResponse = {
  token: string;
  user: ApiUser;
};

export type ProfileResponse = {
  user: ApiUser;
};

export type Branch = {
  id: string;
  name: string;
  address: string;
  closesAt: string;
};

export type RequestedItem = {
  itemType: string;
  quantity: number;
};

export type Bill = {
  id: string;
  cleaningSubtotal: number;
  deliveryFee: number;
  total: number;
  paystackUrl?: string | null;
  items?: Array<{
    itemName: string;
    serviceType: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
};

export type Order = {
  id: string;
  code: string;
  status: string;
  pickupAddress: string;
  requestedItems?: RequestedItem[] | unknown;
  branch?: Branch;
  bill?: Bill | null;
  createdAt?: string;
};

export async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

export function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as { message?: string };
      return friendlyErrorMessage(parsed.message ?? error.message);
    } catch {
      return friendlyErrorMessage(error.message);
    }
  }
  return "Something went wrong. Please try again.";
}

export function friendlyErrorMessage(message?: string) {
  const normalized = message?.toLowerCase() ?? "";
  if (normalized.includes("invalid credentials")) return "The email or password is not correct. Please check it and try again.";
  if (normalized.includes("unique") || normalized.includes("already")) return "An account with this email already exists. Please log in instead.";
  if (normalized.includes("failed to fetch") || normalized.includes("network") || normalized.includes("can't reach")) {
    return "We could not connect to FreshFold right now. Please check your internet connection and try again.";
  }
  if (normalized.includes("cannot get /api/auth/me") || normalized.includes("cannot patch /api/auth/me")) {
    return "Profile saving is not available yet. Please try again after the app update is live.";
  }
  if (normalized.includes("no live branches")) return "We could not find any open FreshFold branches yet. Please try again later.";
  if (normalized.includes("missing bearer") || normalized.includes("invalid or expired")) return "Your session has expired. Please log in again.";
  return message && message.length < 140 ? message : "Something went wrong. Please try again.";
}
