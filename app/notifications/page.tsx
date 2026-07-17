"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Bell, CreditCard, Mail, WashingMachine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useCustomerStore } from "@/lib/store";

export default function NotificationsPage() {
  const { token, setToken } = useCustomerStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("freshfold_customer_token");
    if (savedToken) {
      setToken(savedToken);
      if (savedToken !== "demo-token") {
        apiFetch<any[]>("/api/notifications", {}, savedToken).then(setNotifications).catch(() => setNotifications([])).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    } else {
      window.location.href = "/auth";
    }
  }, [setToken]);

  if (!token) return null;

  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#102532]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#102532] text-white"><WashingMachine className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate text-lg font-bold">Notifications</p><p className="truncate text-xs text-slate-500">Bills, broadcasts and order updates</p></div></div>
          <Button className="shrink-0 bg-white px-3 text-xs text-[#102532] ring-1 ring-slate-200 hover:bg-slate-50 sm:px-4 sm:text-sm" onClick={() => (window.location.href = "/")}><ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span></Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 xl:grid-cols-[1fr_340px]">
        <Card className="border-0 p-4 shadow-xl shadow-slate-200 sm:p-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Notification inbox</h1>
          <p className="mt-2 text-sm text-slate-500">When a branch admin sends your order bill, it appears here with the full breakdown and Paystack payment action.</p>
          <div className="mt-6 space-y-3">
            {isLoading && <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Loading notifications...</p>}
            {notifications.map((notification) => (
              <button key={notification.id} onClick={() => (window.location.href = `/notifications/${notification.id}`)} className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#13a7a5] hover:bg-cyan-50">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-[#13a7a5]">
                      {notification.type === "BILL_READY" ? <CreditCard className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-bold">{notification.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{notification.excerpt}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">{notification.type.replace("_", " ")}</span>
                </div>
              </button>
            ))}
            {!isLoading && !notifications.length && (
              <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center">
                <p className="font-bold">No notifications yet</p>
                <p className="mt-1 text-sm text-slate-500">Your bill notification will appear here after the branch creates a bill.</p>
              </div>
            )}
          </div>
        </Card>

        <aside className="space-y-5">
          <Card className="border-0 p-5 shadow-sm">
            <p className="flex items-center gap-2 font-bold"><Mail className="h-5 w-5 text-[#13a7a5]" /> Email copy</p>
            <p className="mt-3 text-sm text-slate-500">Branch admins can send matching email notifications. Email provider wiring belongs on the backend.</p>
          </Card>
        </aside>
      </section>
    </main>
  );
}
