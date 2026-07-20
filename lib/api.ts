// This customer app should never call Relay, Bolt, Kwik, or Paystack secret APIs directly.
export const API_BASE_URL = "/api/freshfold";

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
  paidAt?: string | null;
  paystackUrl?: string | null;
  items?: Array<{
    itemName: string;
    serviceType: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
};

export type DeliveryJob = {
  id: string;
  provider: "RELAY" | "BOLT" | "KWIK" | "SHIPBUBBLE";
  leg: "PICKUP_TO_BRANCH" | "BRANCH_TO_CUSTOMER";
  status: string;
  fee: number;
  trackingUrl?: string | null;
  externalDeliveryId?: string | null;
  courierName?: string | null;
  courierPhone?: string | null;
};

export type Order = {
  id: string;
  code: string;
  status: string;
  pickupAddress: string;
  requestedItems?: RequestedItem[] | unknown;
  branch?: Branch;
  bill?: Bill | null;
  deliveries?: DeliveryJob[];
  createdAt?: string;
};

export async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  try {
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
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("FreshFold could not reach its server right now. Please try again later.");
    }
    throw error;
  }
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
  if (normalized.includes("could not connect to freshfold at")) return message ?? "We could not connect to FreshFold right now.";
  if (normalized.includes("failed to fetch") || normalized.includes("network") || normalized.includes("can't reach")) {
    return "We could not connect to FreshFold right now. Please check your internet connection and try again.";
  }
  if (normalized.includes("cannot get /api/auth/me") || normalized.includes("cannot patch /api/auth/me")) {
    return "Profile saving is not available yet. Please try again after the app update is live.";
  }
  if (normalized.includes("no live branches")) return "We could not find any open FreshFold branches yet. Please try again later.";
  if (normalized.includes("no_same_day_courier_available")) {
    return "Same-day courier pickup is not available for this route right now. Please try again shortly or contact the branch for help.";
  }
  if (normalized.includes("missing bearer") || normalized.includes("invalid or expired")) return "Your session has expired. Please log in again.";
  return message && message.length < 140 ? message : "Something went wrong. Please try again.";
}
