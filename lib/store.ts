"use client";

import { create } from "zustand";

type Branch = {
  id: string;
  name: string;
  address: string;
  closesAt: string;
};

export type CustomerProfile = {
  fullName: string;
  email: string;
  phone: string;
  defaultAddress: string;
};

type CustomerState = {
  token?: string;
  branch?: Branch;
  order?: any;
  profile: CustomerProfile;
  setToken: (token: string) => void;
  setBranch: (branch: Branch) => void;
  setOrder: (order: any) => void;
  setProfile: (profile: CustomerProfile) => void;
};

export const useCustomerStore = create<CustomerState>((set) => ({
  profile: {
    fullName: "David Ukap",
    email: "david@email.com",
    phone: "08035550192",
    defaultAddress: "7B Bode Thomas St, Surulere, Lagos"
  },
  setToken: (token) => set({ token }),
  setBranch: (branch) => set({ branch }),
  setOrder: (order) => set({ order }),
  setProfile: (profile) => set({ profile })
}));
