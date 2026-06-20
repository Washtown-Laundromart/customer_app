"use client";

import { useState } from "react";
import { ArrowRight, Check, ShieldCheck, WashingMachine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useCustomerStore } from "@/lib/store";

export default function CustomerAuthPage() {
  const { setToken, setProfile } = useCustomerStore();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [form, setForm] = useState({
    fullName: "David Ukap",
    email: "david@email.com",
    phone: "08035550192",
    password: "password123"
  });

  async function submit() {
    setIsSubmitting(true);
    setNotice(undefined);
    try {
      const path = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = mode === "register" ? form : { email: form.email, password: form.password };
      const result = await apiFetch<{ token: string }>(path, { method: "POST", body: JSON.stringify(body) });
      window.localStorage.setItem("freshfold_customer_token", result.token);
      const profile = { fullName: form.fullName, email: form.email, phone: form.phone, defaultAddress: "7B Bode Thomas St, Surulere, Lagos" };
      window.localStorage.setItem("freshfold_customer_profile", JSON.stringify(profile));
      setProfile(profile);
      setToken(result.token);
    } catch {
      window.localStorage.setItem("freshfold_customer_token", "demo-token");
      const profile = { fullName: form.fullName, email: form.email, phone: form.phone, defaultAddress: "7B Bode Thomas St, Surulere, Lagos" };
      window.localStorage.setItem("freshfold_customer_profile", JSON.stringify(profile));
      setProfile(profile);
      setToken("demo-token");
      setNotice("Backend auth is not connected to a database yet, so you are entering the app in demo mode.");
    } finally {
      setIsSubmitting(false);
    }
    window.location.href = "/";
  }

  return (
    <main className="grid min-h-screen bg-[#f7faf9] text-[#102532] lg:grid-cols-[0.95fr_1.05fr]">
      <section className="flex flex-col justify-between bg-[#102532] p-6 text-white lg:p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
            <WashingMachine className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-bold">FreshFold</p>
            <p className="text-sm text-slate-300">Laundry pickup and delivery</p>
          </div>
        </div>
        <div className="my-16 max-w-xl">
          <p className="text-sm font-bold uppercase text-cyan-200">Customer access</p>
          <h1 className="mt-4 text-5xl font-bold leading-tight">Start a laundry order from the nearest branch.</h1>
          <div className="mt-8 grid gap-3 text-sm text-slate-200">
            {["Account required before booking", "Pay only after itemized inspection", "Track pickup, cleaning and delivery"].map((item) => (
              <div key={item} className="flex items-center gap-3"><Check className="h-4 w-4 text-emerald-300" /> {item}</div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          Secure customer account
        </div>
      </section>

      <section className="flex items-center justify-center p-5">
        <Card className="w-full max-w-xl border-0 p-6 shadow-xl shadow-slate-200">
          <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
            {(["register", "login"] as const).map((item) => (
              <button key={item} onClick={() => setMode(item)} className={`h-10 flex-1 rounded-md text-sm font-bold capitalize ${mode === item ? "bg-white shadow-sm" : "text-slate-500"}`}>
                {item}
              </button>
            ))}
          </div>
          <h2 className="text-2xl font-bold">{mode === "register" ? "Create your account" : "Welcome back"}</h2>
          <p className="mt-1 text-sm text-slate-500">Auth stays here. The main app starts after this screen.</p>

          {notice && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{notice}</div>}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {mode === "register" && <Field label="Full name" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} />}
            {mode === "register" && <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />}
            <Field label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            <Field label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
          </div>

          <Button className="mt-6 h-12 w-full bg-[#102532] hover:bg-[#1b3544]" disabled={isSubmitting} onClick={submit}>
            {isSubmitting ? "Please wait..." : mode === "register" ? "Create account" : "Log in"} <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </section>
    </main>
  );
}

function Field({ label, value, type = "text", onChange }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#13a7a5]" value={value} type={type} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
