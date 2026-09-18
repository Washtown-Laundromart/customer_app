"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/toast-provider";
import { apiFetch, toErrorMessage, type ProfileResponse } from "@/lib/api";
import { CustomerProfile, useCustomerStore } from "@/lib/store";

function splitName(fullName: string) {
  const trimmed = (fullName ?? "").trim();
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, spaceIndex), lastName: trimmed.slice(spaceIndex + 1).trim() };
}

export default function ProfilePage() {
  const { profile, setProfile, setToken } = useCustomerStore();
  const { showToast } = useToast();
  const [form, setForm] = useState<CustomerProfile>(profile);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("freshfold_customer_token");
    const savedProfile = window.localStorage.getItem("freshfold_customer_profile");
    if (!savedToken) {
      window.location.href = "/auth";
      return;
    }
    setToken(savedToken);
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile) as CustomerProfile;
      setProfile(parsed);
      setForm(parsed);
      const split = splitName(parsed.fullName);
      setFirstName(split.firstName);
      setLastName(split.lastName);
    }
    apiFetch<ProfileResponse>("/api/auth/me", {}, savedToken).then((result) => {
      const profileFromApi = {
        fullName: result.user.fullName,
        email: result.user.email,
        phone: result.user.phone ?? "",
        defaultAddress: result.user.defaultAddress ?? ""
      };
      window.localStorage.setItem("freshfold_customer_profile", JSON.stringify(profileFromApi));
      setProfile(profileFromApi);
      setForm(profileFromApi);
      const split = splitName(result.user.fullName);
      setFirstName(split.firstName);
      setLastName(split.lastName);
    }).catch(() => {
      showToast({ type: "error", title: "Could not load profile", message: "We could not get your saved profile details. Please refresh the page." });
    }).finally(() => setIsLoading(false));
  }, [setProfile, setToken, showToast]);

  async function saveProfile() {
    const savedToken = window.localStorage.getItem("freshfold_customer_token");
    if (!savedToken) {
      window.location.href = "/auth";
      return;
    }
    const cleanedFirst = firstName.trim().replace(/\s+/g, " ");
    const cleanedLast = lastName.trim().replace(/\s+/g, " ");
    if (!cleanedFirst || !cleanedLast) {
      showToast({
        type: "error",
        title: "Name incomplete",
        message: "Please enter both your first and last name (e.g. John Doe). Courier companies reject one-word names."
      });
      return;
    }
    if (/\d/.test(`${cleanedFirst}${cleanedLast}`)) {
      showToast({
        type: "error",
        title: "Invalid name",
        message: "Your name cannot contain numbers or symbols. Please correct it and save again."
      });
      return;
    }
    const fullName = `${cleanedFirst} ${cleanedLast}`;
    try {
      const result = await apiFetch<ProfileResponse>("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          fullName,
          phone: form.phone,
          defaultAddress: form.defaultAddress
        })
      }, savedToken);
      const profileFromApi = {
        fullName: result.user.fullName,
        email: result.user.email,
        phone: result.user.phone ?? "",
        defaultAddress: result.user.defaultAddress ?? ""
      };
      window.localStorage.setItem("freshfold_customer_profile", JSON.stringify(profileFromApi));
      setProfile(profileFromApi);
      showToast({ type: "success", title: "Profile saved", message: "We will use these details for your next pickup request." });
      window.location.href = "/";
    } catch (error) {
      showToast({ type: "error", title: "Could not save profile", message: toErrorMessage(error) });
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <Header />
      <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Button className="mb-5 bg-white text-[#0b4ea2] ring-1 ring-slate-200 hover:bg-slate-50" onClick={() => (window.location.href = "/")}><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Card className="border-0 p-4 shadow-xl shadow-slate-200 sm:p-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Profile details</h1>
          <p className="mt-2 text-slate-500">These details are reused when requesting Shipbubble or Relay pickup through the backend. Courier companies require both your first and last name.</p>
          {isLoading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-20" />)}
            </div>
          ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="First name" value={firstName} onChange={setFirstName} />
            <Field label="Last name" value={lastName} onChange={setLastName} />
            <Field label="Phone number" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <Field label="Email" value={form.email} readOnly />
            <div className="sm:col-span-2">
              <Field label="Default pickup address" value={form.defaultAddress} onChange={(value) => setForm({ ...form, defaultAddress: value })} />
            </div>
          </div>
          )}
          <Button className="mt-6 h-12 w-full" disabled={isLoading} onClick={saveProfile}><Save className="h-4 w-4" /> Save profile</Button>
        </Card>
      </section>
    </main>
  );
}

function Header() {
  return <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white p-1 ring-1 ring-slate-200"><img src="/washtownlogo.png" alt="Washtownnig" className="max-h-full max-w-full object-contain" /></div><div><p className="text-lg font-bold text-[#0b4ea2]">Washtownnig</p><p className="text-xs text-slate-500">Customer profile</p></div></div></header>;
}

function Field({ label, value, onChange, readOnly }: { label: string; value: string; onChange?: (value: string) => void; readOnly?: boolean }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<input className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#df1f2d] disabled:bg-slate-50" value={value} disabled={readOnly} onChange={(event) => onChange?.(event.target.value)} /></label>;
}
