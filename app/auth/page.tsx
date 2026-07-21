"use client";

import { useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/toast-provider";
import { apiFetch, toErrorMessage, type AuthResponse } from "@/lib/api";
import { useCustomerStore } from "@/lib/store";

export default function CustomerAuthPage() {
  const { setToken, setProfile } = useCustomerStore();
  const { showToast } = useToast();
  const [mode, setMode] = useState<"register" | "login" | "reset">("register");
  const [resetStep, setResetStep] = useState<"request" | "confirm">("request");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    otp: ""
  });

  async function submit() {
    setIsSubmitting(true);
    try {
      const path = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = mode === "register" ? form : { email: form.email, password: form.password };
      const result = await apiFetch<AuthResponse>(path, { method: "POST", body: JSON.stringify(body) });
      window.localStorage.setItem("freshfold_customer_token", result.token);
      const profile = {
        fullName: result.user.fullName,
        email: result.user.email,
        phone: result.user.phone ?? form.phone,
        defaultAddress: result.user.defaultAddress ?? ""
      };
      window.localStorage.setItem("freshfold_customer_profile", JSON.stringify(profile));
      setProfile(profile);
      setToken(result.token);
      showToast({
        type: "success",
        title: mode === "register" ? "Account created" : "You are signed in",
        message: mode === "register" ? "Welcome to Washtownnig. You can now request a wash." : "Welcome back. Your dashboard is opening now."
      });
      window.location.href = "/";
    } catch (error) {
      showToast({
        type: "error",
        title: mode === "register" ? "Could not create account" : "Could not sign you in",
        message: toErrorMessage(error)
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestResetOtp() {
    setIsSubmitting(true);
    try {
      await apiFetch<{ message: string }>("/api/auth/forgot-password/request", { method: "POST", body: JSON.stringify({ email: form.email }) });
      setResetStep("confirm");
      showToast({
        type: "success",
        title: "Check your email",
        message: "If this customer account exists, a reset code has been sent."
      });
    } catch (error) {
      showToast({ type: "error", title: "Could not send code", message: toErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resetPassword() {
    setIsSubmitting(true);
    try {
      await apiFetch<{ message: string }>("/api/auth/forgot-password/reset", {
        method: "POST",
        body: JSON.stringify({ email: form.email, otp: form.otp, password: form.password })
      });
      setMode("login");
      setResetStep("request");
      setForm({ ...form, otp: "", password: "" });
      showToast({
        type: "success",
        title: "Password updated",
        message: "You can now log in with your new password."
      });
    } catch (error) {
      showToast({ type: "error", title: "Could not reset password", message: toErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(nextMode: "register" | "login" | "reset") {
    setMode(nextMode);
    if (nextMode !== "reset") setResetStep("request");
  }

  const isResetMode = mode === "reset";

  return (
    <main className="grid min-h-screen bg-[#f7faf9] text-[#102532] lg:grid-cols-[0.95fr_1.05fr]">
      <section className="flex flex-col justify-between bg-[#102532] p-6 text-white lg:p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white p-1.5">
            <img src="/washtownlogo.png" alt="Washtownnig" className="max-h-full max-w-full object-contain" />
          </div>
          <div>
            <p className="text-xl font-bold">Washtownnig</p>
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
              <button key={item} onClick={() => switchMode(item)} className={`h-10 flex-1 rounded-md text-sm font-bold capitalize ${mode === item ? "bg-white shadow-sm" : "text-slate-500"}`}>
                {item}
              </button>
            ))}
          </div>
          <h2 className="text-2xl font-bold">{mode === "register" ? "Create your account" : isResetMode ? "Reset your password" : "Welcome back"}</h2>
          <p className="mt-1 text-sm text-slate-500">{isResetMode ? "Use the OTP sent to your email to set a new password." : "Auth stays here. The main app starts after this screen."}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {mode === "register" && <Field label="Full name" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} />}
            {mode === "register" && <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />}
            <Field label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            {!isResetMode && <Field label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />}
            {isResetMode && resetStep === "confirm" && <Field label="OTP code" value={form.otp} onChange={(value) => setForm({ ...form, otp: value.replace(/\D/g, "").slice(0, 6) })} />}
            {isResetMode && resetStep === "confirm" && <Field label="New password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />}
          </div>

          <Button className="mt-6 h-12 w-full bg-[#102532] hover:bg-[#1b3544]" disabled={isSubmitting} onClick={isResetMode ? resetStep === "request" ? requestResetOtp : resetPassword : submit}>
            {isSubmitting ? "Please wait..." : mode === "register" ? "Create account" : isResetMode ? resetStep === "request" ? "Send OTP" : "Reset password" : "Log in"}
            {isResetMode ? resetStep === "request" ? <Mail className="h-4 w-4" /> : <KeyRound className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          </Button>
          {mode === "login" && (
            <button type="button" className="mt-4 w-full text-sm font-bold text-[#0b817f] hover:text-[#102532]" onClick={() => switchMode("reset")}>
              Forgot password?
            </button>
          )}
          {isResetMode && (
            <button type="button" className="mt-4 w-full text-sm font-bold text-[#0b817f] hover:text-[#102532]" onClick={() => switchMode("login")}>
              Back to login
            </button>
          )}
        </Card>
      </section>
    </main>
  );
}

function Field({ label, value, type = "text", onChange }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <span className="relative mt-2 block">
        <input className="h-12 w-full rounded-lg border border-slate-200 bg-white px-3 pr-11 text-sm outline-none focus:border-[#13a7a5]" value={value} type={isPassword && showPassword ? "text" : type} onChange={(event) => onChange(event.target.value)} />
        {isPassword && (
          <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" onClick={() => setShowPassword((current) => !current)}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </span>
    </label>
  );
}
