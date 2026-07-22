"use client";

import { use, useEffect, useState } from "react";
import { ArrowLeft, Bell, CreditCard, Download, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { useCustomerStore } from "@/lib/store";

export default function NotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, setToken } = useCustomerStore();
  const [notification, setNotification] = useState<any>();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("freshfold_customer_token");
    if (savedToken) {
      setToken(savedToken);
      if (savedToken !== "demo-token") {
        apiFetch<any>(`/api/notifications/${id}`, {}, savedToken).then(setNotification).catch(() => setNotFound(true));
      } else {
        setNotFound(true);
      }
    } else {
      window.location.href = "/auth";
    }
  }, [id, setToken]);

  if (!token) return null;
  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4 text-slate-950">
        <Card className="max-w-md border-0 p-6 text-center shadow-xl shadow-slate-200">
          <h1 className="text-2xl font-bold">Notification not found</h1>
          <p className="mt-2 text-sm text-slate-500">This notification is not available for your account.</p>
          <Button className="mt-5" onClick={() => (window.location.href = "/notifications")}><ArrowLeft className="h-4 w-4" /> Back to notifications</Button>
        </Card>
      </main>
    );
  }
  if (!notification) {
    return (
      <main className="min-h-screen bg-[#f4f7fb] text-slate-950">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white p-1 ring-1 ring-slate-200"><img src="/washtownlogo.png" alt="Washtownnig" className="max-h-full max-w-full object-contain" /></div><div className="min-w-0"><p className="truncate text-lg font-bold">Notification details</p><p className="truncate text-xs text-slate-500">Review message and payment action</p></div></div>
          </div>
        </header>
        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 xl:grid-cols-[1fr_360px]">
          <Card className="border-0 p-4 shadow-xl shadow-slate-200 sm:p-6">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <Skeleton className="mt-5 h-8 w-2/3" />
            <Skeleton className="mt-3 h-4 w-1/2" />
            <Skeleton className="mt-6 h-40 w-full rounded-xl" />
          </Card>
          <Card className="border-0 p-5 shadow-sm">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-4 h-16 w-full" />
          </Card>
        </section>
      </main>
    );
  }

  const bill = notification.order?.bill;
  const paystackUrl = notification.paystackUrl ?? bill?.paystackUrl;
  const isPaid = Boolean(bill?.paidAt);

  function downloadReceipt() {
    if (!bill) return;
    const receipt = [
      "Washtownnig Payment Receipt",
      `Order: ${notification.order?.code ?? notification.title}`,
      `Paid at: ${bill.paidAt ? new Date(bill.paidAt).toLocaleString() : "Not paid"}`,
      "",
      "Items",
      ...(bill.items ?? []).map((item: any) => `${item.quantity} x ${item.itemName} (${item.serviceType}) @ NGN ${Number(item.unitPrice).toLocaleString()} = NGN ${Number(item.total).toLocaleString()}`),
      "",
      `Cleaning subtotal: NGN ${Number(bill.cleaningSubtotal).toLocaleString()}`,
      `Delivery fee: NGN ${Number(bill.deliveryFee).toLocaleString()}`,
      `Total paid: NGN ${Number(bill.total).toLocaleString()}`
    ].join("\n");
    const url = URL.createObjectURL(new Blob([receipt], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${notification.order?.code ?? "washtownnig"}-receipt.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white p-1 ring-1 ring-slate-200"><img src="/washtownlogo.png" alt="Washtownnig" className="max-h-full max-w-full object-contain" /></div><div className="min-w-0"><p className="truncate text-lg font-bold">Notification details</p><p className="truncate text-xs text-slate-500">Review message and payment action</p></div></div>
          <Button className="shrink-0 bg-white px-3 text-xs text-[#0b4ea2] ring-1 ring-slate-200 hover:bg-slate-50 sm:px-4 sm:text-sm" onClick={() => (window.location.href = "/notifications")}><ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span></Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 xl:grid-cols-[1fr_360px]">
        <Card className="border-0 p-4 shadow-xl shadow-slate-200 sm:p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-[#df1f2d]">
            {notification.type === "BILL_READY" ? <CreditCard className="h-6 w-6" /> : <Bell className="h-6 w-6" />}
          </div>
          <h1 className="mt-5 text-2xl font-bold sm:text-3xl">{notification.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{notification.excerpt}</p>
          <div className="prose prose-sm mt-6 max-w-none rounded-xl bg-slate-50 p-4 text-slate-700" dangerouslySetInnerHTML={{ __html: notification.bodyHtml }} />

          {bill && (
            <div className="mt-6 rounded-xl border border-slate-200 p-4">
              <p className="flex items-center gap-2 font-bold"><ReceiptText className="h-5 w-5 text-[#df1f2d]" /> Bill breakdown</p>
              <div className="mt-4 space-y-3">
                {bill.items?.map((item: any, index: number) => (
                  <div key={`${item.itemName}-${index}`} className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm">
                    <div><p className="font-bold">{item.quantity} x {item.itemName}</p><p className="text-slate-500">{item.serviceType}</p></div>
                    <strong>NGN {Number(item.total).toLocaleString()}</strong>
                  </div>
                ))}
                <Summary label="Cleaning subtotal" value={bill.cleaningSubtotal} />
                <Summary label="Return delivery" value={bill.deliveryFee} />
                <Summary label={isPaid ? "Total paid" : "Total to pay"} value={bill.total} strong />
                {isPaid && bill.paidAt && <p className="text-sm text-slate-500">Paid on {new Date(bill.paidAt).toLocaleString()}</p>}
              </div>
            </div>
          )}
        </Card>

        <aside className="space-y-5">
          <Card className="border-0 p-5 shadow-sm">
            <p className="font-bold">Action</p>
            <p className="mt-2 text-sm text-slate-500">{isPaid ? "Payment is complete. You can download your receipt." : paystackUrl ? "Use the Paystack link attached to this notification to continue your order." : "No payment action is attached to this notification."}</p>
            {isPaid && <Button className="mt-5 h-12 w-full" onClick={downloadReceipt}><Download className="h-4 w-4" /> Download receipt</Button>}
            {!isPaid && paystackUrl && <Button className="mt-5 h-12 w-full" onClick={() => (window.location.href = paystackUrl)}><CreditCard className="h-4 w-4" /> Pay now</Button>}
          </Card>
        </aside>
      </section>
    </main>
  );
}

function Summary({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return <div className={`flex items-center justify-between text-sm ${strong ? "pt-2 text-lg font-bold" : ""}`}><span>{label}</span><span>NGN {Number(value).toLocaleString()}</span></div>;
}
