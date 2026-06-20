"use client";

import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell, CreditCard, ReceiptText, WashingMachine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useCustomerStore } from "@/lib/store";
import { demoNotifications } from "@/lib/demo-notifications";

export default function NotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, setToken } = useCustomerStore();
  const [notification, setNotification] = useState<any>();
  const fallback = useMemo(() => demoNotifications.find((item) => item.id === id) ?? demoNotifications[0], [id]);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("freshfold_customer_token");
    if (savedToken) {
      setToken(savedToken);
      if (savedToken !== "demo-token") {
        apiFetch<any>(`/api/notifications/${id}`, {}, savedToken).then(setNotification).catch(() => setNotification(fallback));
      } else {
        setNotification(fallback);
      }
    } else {
      window.location.href = "/auth";
    }
  }, [fallback, id, setToken]);

  if (!token || !notification) return null;

  const bill = notification.order?.bill;
  const paystackUrl = notification.paystackUrl ?? bill?.paystackUrl;

  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#102532]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#102532] text-white"><WashingMachine className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate text-lg font-bold">Notification details</p><p className="truncate text-xs text-slate-500">Review message and payment action</p></div></div>
          <Button className="shrink-0 bg-white px-3 text-xs text-[#102532] ring-1 ring-slate-200 hover:bg-slate-50 sm:px-4 sm:text-sm" onClick={() => (window.location.href = "/notifications")}><ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span></Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 xl:grid-cols-[1fr_360px]">
        <Card className="border-0 p-4 shadow-xl shadow-slate-200 sm:p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 text-[#13a7a5]">
            {notification.type === "BILL_READY" ? <CreditCard className="h-6 w-6" /> : <Bell className="h-6 w-6" />}
          </div>
          <h1 className="mt-5 text-2xl font-bold sm:text-3xl">{notification.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{notification.excerpt}</p>
          <div className="prose prose-sm mt-6 max-w-none rounded-xl bg-slate-50 p-4 text-slate-700" dangerouslySetInnerHTML={{ __html: notification.bodyHtml }} />

          {bill && (
            <div className="mt-6 rounded-xl border border-slate-200 p-4">
              <p className="flex items-center gap-2 font-bold"><ReceiptText className="h-5 w-5 text-[#13a7a5]" /> Bill breakdown</p>
              <div className="mt-4 space-y-3">
                {bill.items?.map((item: any, index: number) => (
                  <div key={`${item.itemName}-${index}`} className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm">
                    <div><p className="font-bold">{item.quantity} x {item.itemName}</p><p className="text-slate-500">{item.serviceType}</p></div>
                    <strong>NGN {Number(item.total).toLocaleString()}</strong>
                  </div>
                ))}
                <Summary label="Cleaning subtotal" value={bill.cleaningSubtotal} />
                <Summary label="Return delivery" value={bill.deliveryFee} />
                <Summary label="Total to pay" value={bill.total} strong />
              </div>
            </div>
          )}
        </Card>

        <aside className="space-y-5">
          <Card className="border-0 p-5 shadow-sm">
            <p className="font-bold">Action</p>
            <p className="mt-2 text-sm text-slate-500">{paystackUrl ? "Pay with Paystack so washing can begin." : "No payment action is attached to this notification."}</p>
            {paystackUrl && <Button className="mt-5 h-12 w-full" onClick={() => (window.location.href = paystackUrl)}><CreditCard className="h-4 w-4" /> Pay now</Button>}
          </Card>
        </aside>
      </section>
    </main>
  );
}

function Summary({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return <div className={`flex items-center justify-between text-sm ${strong ? "pt-2 text-lg font-bold" : ""}`}><span>{label}</span><span>NGN {Number(value).toLocaleString()}</span></div>;
}
