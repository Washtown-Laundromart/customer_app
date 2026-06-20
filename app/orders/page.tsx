"use client";

import { useEffect } from "react";
import { ArrowLeft, Bell, CreditCard, Mail, PackageCheck, WashingMachine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCustomerStore } from "@/lib/store";

export default function OrdersPage() {
  const { token, setToken, order, setOrder } = useCustomerStore();

  useEffect(() => {
    const savedToken = window.localStorage.getItem("freshfold_customer_token");
    if (savedToken) setToken(savedToken);
    else window.location.href = "/auth";
  }, [setToken]);

  if (!token) return null;

  const activeOrder = order ?? {
    code: "FF-20871",
    requestedItems: [{ itemType: "Shirt", quantity: 5 }],
    status: "PICKUP_REQUESTED"
  };

  const billReady = Boolean(activeOrder.bill?.paystackUrl);

  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#102532]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#102532] text-white"><WashingMachine className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate text-lg font-bold">Orders</p><p className="truncate text-xs text-slate-500">Bills, payment and wash status</p></div></div>
          <Button className="shrink-0 bg-white px-3 text-xs text-[#102532] ring-1 ring-slate-200 hover:bg-slate-50 sm:px-4 sm:text-sm" onClick={() => (window.location.href = "/")}><ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span></Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 xl:grid-cols-[1fr_360px]">
        <Card className="border-0 p-4 shadow-xl shadow-slate-200 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#13a7a5]">{activeOrder.code}</p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Wash order status</h1>
              <p className="mt-2 text-slate-500">Branch staff must inspect stains and garment condition, then send a Paystack bill before washing starts.</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${billReady ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{billReady ? "Bill ready" : "Awaiting branch bill"}</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Stage active done label="Pickup requested" />
            <Stage active={activeOrder.status === "AT_BRANCH" || billReady} label="Branch inspection" />
            <Stage active={billReady} label="Payment link sent" />
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-xl font-bold">Customer item estimate</h2>
            <div className="mt-4 space-y-3">
              {(activeOrder.requestedItems ?? []).map((item: any, index: number) => (
                <div key={`${item.itemType}-${index}`} className="flex items-center justify-between border-b border-slate-200 pb-3 text-sm">
                  <span>{item.itemType}</span>
                  <strong>{item.quantity}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-5">
            {billReady ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div><h2 className="text-xl font-bold">Your bill is ready</h2><p className="text-sm text-slate-500">Includes wash bill and return delivery fee.</p></div>
                <Button className="w-full sm:w-auto" onClick={() => (window.location.href = activeOrder.bill.paystackUrl)}><CreditCard className="h-4 w-4" /> Pay with Paystack</Button>
              </div>
            ) : (
              <div className="text-center">
                <PackageCheck className="mx-auto h-10 w-10 text-slate-400" />
                <h2 className="mt-3 text-xl font-bold">No bill yet</h2>
                <p className="mt-1 text-sm text-slate-500">You will receive an email and in-site notification when branch staff sends the Paystack payment link.</p>
              </div>
            )}
          </div>
        </Card>

        <aside className="space-y-5">
          <Card className="border-0 p-5 shadow-sm">
            <p className="flex items-center gap-2 font-bold"><Bell className="h-5 w-5 text-[#13a7a5]" /> Site notification</p>
            <p className="mt-3 text-sm text-slate-500">{billReady ? "Payment link received from branch." : "Waiting for bill from the laundromart."}</p>
          </Card>
          <Card className="border-0 p-5 shadow-sm">
            <p className="flex items-center gap-2 font-bold"><Mail className="h-5 w-5 text-[#13a7a5]" /> Email notification</p>
            <p className="mt-3 text-sm text-slate-500">The same Paystack bill link is sent to the customer email saved on profile.</p>
          </Card>
          <Button className="w-full" onClick={() => setOrder({ ...activeOrder, bill: { paystackUrl: "https://paystack.com/pay/freshfold-demo" } })}>Demo: mark bill ready</Button>
        </aside>
      </section>
    </main>
  );
}

function Stage({ label, active, done }: { label: string; active?: boolean; done?: boolean }) {
  return <div className={`rounded-xl border p-4 ${active ? "border-[#13a7a5] bg-cyan-50" : "border-slate-200 bg-white"}`}><div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full ${done ? "bg-emerald-500 text-white" : active ? "bg-[#13a7a5] text-white" : "bg-slate-100 text-slate-400"}`}>{done ? "✓" : "•"}</div><p className="font-bold">{label}</p></div>;
}
