"use client";

import { create } from "zustand";
import type { Branch, Order } from "./api";

export type CustomerProfile = {
  fullName: string;
  email: string;
  phone: string;
  defaultAddress: string;
};

type CustomerState = {
  token?: string;
  branch?: Branch;
  orders: Order[];
  order?: Order;
  profile: CustomerProfile;
  setToken: (token: string) => void;
  setBranch: (branch: Branch) => void;
  setOrders: (orders: Order[]) => void;
  setOrder: (order?: Order) => void;
  setProfile: (profile: CustomerProfile) => void;
};

export const useCustomerStore = create<CustomerState>((set) => ({
  profile: {
    fullName: "",
    email: "",
    phone: "",
    defaultAddress: ""
  },
  orders: [],
  setToken: (token) => set({ token }),
  setBranch: (branch) => set({ branch }),
  setOrders: (orders) => set({ orders }),
  setOrder: (order) => set({ order }),
  setProfile: (profile) => set({ profile })
}));
