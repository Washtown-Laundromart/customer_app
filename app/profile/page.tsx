"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Save, WashingMachine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomerProfile, useCustomerStore } from "@/lib/store";

export default function ProfilePage() {
  const { profile, setProfile, setToken } = useCustomerStore();
  const [form, setForm] = useState<CustomerProfile>(profile);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("freshfold_customer_token");
    const savedProfile = window.localStorage.getItem("freshfold_customer_profile");
    if (savedToken) setToken(savedToken);
    else window.location.href = "/auth";
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile) as CustomerProfile;
      setProfile(parsed);
      setForm(parsed);
    }
  }, [setProfile, setToken]);

  function saveProfile() {
    window.localStorage.setItem("freshfold_customer_profile", JSON.stringify(form));
    setProfile(form);
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#102532]">
      <Header />
      <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Button className="mb-5 bg-white text-[#102532] ring-1 ring-slate-200 hover:bg-slate-50" onClick={() => (window.location.href = "/")}><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Card className="border-0 p-4 shadow-xl shadow-slate-200 sm:p-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Profile details</h1>
          <p className="mt-2 text-slate-500">These details are reused when requesting Uber, Bolt or Kwik pickup through the backend.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} />
            <Field label="Phone number" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <Field label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            <Field label="Default pickup address" value={form.defaultAddress} onChange={(value) => setForm({ ...form, defaultAddress: value })} />
          </div>
          <Button className="mt-6 h-12 w-full" onClick={saveProfile}><Save className="h-4 w-4" /> Save profile</Button>
        </Card>
      </section>
    </main>
  );
}

function Header() {
  return <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#102532] text-white"><WashingMachine className="h-5 w-5" /></div><div><p className="text-lg font-bold">FreshFold</p><p className="text-xs text-slate-500">Customer profile</p></div></div></header>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<input className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#13a7a5]" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
