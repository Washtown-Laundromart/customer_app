"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell, CreditCard, ExternalLink, Mail, PackageCheck, ReceiptText, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/toast-provider";
import { apiFetch, type Order, type RequestedItem } from "@/lib/api";
import { useCustomerStore } from "@/lib/store";

export default function OrdersPage() {
  const { token, setToken, order, orders, setOrders } = useCustomerStore();
  const { showToast } = useToast();
  const [selectedOrderId, setSelectedOrderId] = useState<string>();
  const [ordersPage, setOrdersPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("freshfold_customer_token");
    if (!savedToken) {
      window.location.href = "/auth";
      return;
    }
    setToken(savedToken);
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") ?? params.get("trxref");
    const loadOrders = () => apiFetch<Order[]>("/api/orders", {}, savedToken).then((result) => {
      setOrders(result);
      if (!selectedOrderId && result[0]) setSelectedOrderId(result[0].id);
    }).finally(() => setIsLoading(false));
    const verifyPayment = reference
      ? apiFetch<{ order: Order }>("/api/orders/payments/verify", {
        method: "POST",
        body: JSON.stringify({ reference })
      }, savedToken).then((result) => {
        window.history.replaceState({}, "", "/orders");
        setSelectedOrderId(result.order.id);
        showToast({ type: "success", title: "Payment confirmed", message: "Your payment has been verified and your order is now in cleaning." });
        return loadOrders();
      })
      : loadOrders();

    verifyPayment.catch(() => {
      loadOrders().catch(() => {
        setOrders([]);
        showToast({ type: "error", title: "Could not load orders", message: "We could not get your orders right now. Please refresh the page." });
      });
    });
    const interval = window.setInterval(() => {
      loadOrders().catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [selectedOrderId, setOrders, setToken, showToast]);

  const sortedOrders = useMemo(() => {
    const byId = new Map<string, Order>();
    orders.forEach((item) => byId.set(item.id, item));
    if (order && !byId.has(order.id)) byId.set(order.id, order);
    return Array.from(byId.values()).sort((a, b) => {
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  }, [order, orders]);

  const activeOrder = sortedOrders.find((item) => item.id === selectedOrderId) ?? sortedOrders[0] ?? {
    id: "demo-order",
    code: "FF-20871",
    requestedItems: [{ itemType: "Shirt", quantity: 5 }],
    status: "PICKUP_REQUESTED"
  };

  const paystackUrl = activeOrder.bill?.paystackUrl ?? "";
  const billReady = Boolean(paystackUrl);
  const isPaid = Boolean(activeOrder.bill?.paidAt);
  const requestedItems = Array.isArray(activeOrder.requestedItems) ? activeOrder.requestedItems as RequestedItem[] : [];
  const pageSize = 6;
  const ordersPageCount = Math.max(1, Math.ceil(sortedOrders.length / pageSize));
  const paginatedOrders = sortedOrders.slice((ordersPage - 1) * pageSize, ordersPage * pageSize);

  useEffect(() => {
    setOrdersPage((current) => Math.min(current, ordersPageCount));
  }, [ordersPageCount]);

  if (!token) return null;

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#0b4ea2]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white p-1 ring-1 ring-slate-200"><img src="/washtownlogo.png" alt="Washtownnig" className="max-h-full max-w-full object-contain" /></div><div className="min-w-0"><p className="truncate text-lg font-bold">Orders</p><p className="truncate text-xs text-slate-500">Bills, payment and wash status</p></div></div>
          <Button className="shrink-0 bg-white px-3 text-xs text-[#0b4ea2] ring-1 ring-slate-200 hover:bg-slate-50 sm:px-4 sm:text-sm" onClick={() => (window.location.href = "/")}><ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span></Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 xl:grid-cols-[1fr_360px]">
        <Card className="border-0 p-4 shadow-xl shadow-slate-200 sm:p-6">
          {isLoading ? (
            <OrderDetailSkeleton />
          ) : (
          <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#df1f2d]">{activeOrder.code}</p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Wash order status</h1>
              <p className="mt-2 text-slate-500">Branch staff must inspect stains and garment condition, then send a Paystack bill before washing starts.</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${isPaid ? "bg-blue-50 text-blue-700" : billReady ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{isPaid ? "Paid" : billReady ? "Bill ready" : "Awaiting branch bill"}</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Stage active done label="Pickup requested" />
            <Stage active={activeOrder.status === "AT_BRANCH" || billReady} done={billReady} label="Branch inspection" />
            <Stage active={billReady} done={isPaid} label={isPaid ? "Payment completed" : "Payment link sent"} />
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-xl font-bold">Customer item estimate</h2>
            <div className="mt-4 space-y-3">
              {requestedItems.map((item, index) => (
                <div key={`${item.itemType}-${index}`} className="flex items-center justify-between border-b border-slate-200 pb-3 text-sm">
                  <span>{item.itemType}</span>
                  <strong>{item.quantity}</strong>
                </div>
              ))}
            </div>
          </div>

          {!!activeOrder.deliveries?.length && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="flex items-center gap-2 text-xl font-bold"><Truck className="h-5 w-5 text-[#df1f2d]" /> Courier tracking</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {activeOrder.deliveries.map((delivery) => (
                  <div key={delivery.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <strong>{delivery.provider}</strong>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-500">{formatDeliveryLeg(delivery.leg)}</span>
                    </div>
                    <p className="mt-2 text-slate-500">{formatStatus(delivery.status)}</p>
                    {delivery.externalDeliveryId && <p className="mt-1 text-xs text-slate-500">Tracking ref: {delivery.externalDeliveryId}</p>}
                    {delivery.trackingUrl && (
                      <Button className="mt-3 h-10 w-full bg-white text-[#0b4ea2] ring-1 ring-slate-200 hover:bg-slate-50" onClick={() => window.open(delivery.trackingUrl ?? "", "_blank", "noopener,noreferrer")}>
                        Track delivery <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-5">
            {billReady ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div><h2 className="flex items-center gap-2 text-xl font-bold"><ReceiptText className="h-5 w-5 text-[#df1f2d]" /> {isPaid ? "Payment receipt" : "Your bill is ready"}</h2><p className="text-sm text-slate-500">Branch-inspected pricing and return delivery fee.</p></div>
                  {isPaid ? (
                    <Button className="w-full sm:w-auto" onClick={() => (window.location.href = `/receipts/${activeOrder.id}`)}><ReceiptText className="h-4 w-4" /> View receipt</Button>
                  ) : (
                    <Button className="w-full sm:w-auto" onClick={() => (window.location.href = paystackUrl)}><CreditCard className="h-4 w-4" /> Pay with Paystack</Button>
                  )}
                </div>
                <div className="mt-5 space-y-3">
                  {activeOrder.bill?.items?.map((item, index) => (
                    <div key={`${item.itemName}-${index}`} className="flex items-center justify-between border-b border-slate-200 pb-3 text-sm">
                      <div><p className="font-bold">{item.quantity} x {item.itemName}</p><p className="text-slate-500">{item.serviceType} · Unit {formatNaira(item.unitPrice)}</p></div>
                      <strong>{formatNaira(item.total)}</strong>
                    </div>
                  ))}
                  <Summary label="Cleaning subtotal" value={activeOrder.bill?.cleaningSubtotal ?? 0} />
                  <Summary label="Return delivery" value={activeOrder.bill?.deliveryFee ?? 0} />
                  <Summary label={isPaid ? "Total paid" : "Total to pay"} value={activeOrder.bill?.total ?? 0} strong />
                  {isPaid && activeOrder.bill?.paidAt && <p className="text-sm text-slate-500">Paid on {new Date(activeOrder.bill.paidAt).toLocaleString()}</p>}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <PackageCheck className="mx-auto h-10 w-10 text-slate-400" />
                <h2 className="mt-3 text-xl font-bold">No bill yet</h2>
                <p className="mt-1 text-sm text-slate-500">You will receive an email and in-site notification when branch staff sends the Paystack payment link.</p>
              </div>
            )}
          </div>
          </>
          )}
        </Card>

        <aside className="space-y-5">
          <Card className="border-0 p-5 shadow-sm">
            <h2 className="font-bold">Your orders</h2>
            <div className="mt-4 space-y-2">
              {isLoading && Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-lg border border-slate-200 bg-white p-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-3 h-3 w-28" />
                  <Skeleton className="mt-2 h-3 w-36" />
                </div>
              ))}
              {!isLoading && paginatedOrders.map((item) => (
                <button key={item.id} className={`w-full rounded-lg border p-3 text-left text-sm transition ${activeOrder.id === item.id ? "border-[#df1f2d] bg-red-50" : "border-slate-200 bg-white hover:bg-slate-50"}`} onClick={() => setSelectedOrderId(item.id)}>
                  <span className="block font-bold">{item.code}</span>
                  <span className="mt-1 block text-xs text-slate-500">{formatStatus(item.status)}</span>
                  {item.createdAt && <span className="mt-1 block text-xs text-slate-500">{formatDateTime(item.createdAt)}</span>}
                  {item.bill?.paidAt ? <span className="mt-2 inline-block rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">Paid</span> : item.bill?.paystackUrl ? <span className="mt-2 inline-block rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700">Awaiting payment</span> : null}
                </button>
              ))}
              {!isLoading && !sortedOrders.length && <p className="text-sm text-slate-500">Your wash requests will appear here.</p>}
            </div>
            {sortedOrders.length > pageSize && (
              <div className="mt-4 flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                <span>Page {ordersPage} of {ordersPageCount}</span>
                <div className="flex gap-2">
                  <Button className="h-8 bg-white px-2 text-xs text-[#0b4ea2] ring-1 ring-slate-200 hover:bg-slate-50" disabled={ordersPage <= 1} onClick={() => setOrdersPage((current) => Math.max(1, current - 1))}>Previous</Button>
                  <Button className="h-8 bg-white px-2 text-xs text-[#0b4ea2] ring-1 ring-slate-200 hover:bg-slate-50" disabled={ordersPage >= ordersPageCount} onClick={() => setOrdersPage((current) => Math.min(ordersPageCount, current + 1))}>Next</Button>
                </div>
              </div>
            )}
          </Card>
          <Card className="border-0 p-5 shadow-sm">
            <p className="flex items-center gap-2 font-bold"><Bell className="h-5 w-5 text-[#df1f2d]" /> Site notification</p>
            <p className="mt-3 text-sm text-slate-500">{billReady ? "Payment link received from branch." : "Waiting for bill from the laundromart."}</p>
          </Card>
          <Card className="border-0 p-5 shadow-sm">
            <p className="flex items-center gap-2 font-bold"><Mail className="h-5 w-5 text-[#df1f2d]" /> Email notification</p>
            <p className="mt-3 text-sm text-slate-500">The same Paystack bill link is sent to the customer email saved on profile.</p>
          </Card>
        </aside>
      </section>
    </main>
  );
}

function Stage({ label, active, done }: { label: string; active?: boolean; done?: boolean }) {
  return <div className={`rounded-xl border p-4 ${active ? "border-[#df1f2d] bg-red-50" : "border-slate-200 bg-white"}`}><div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full ${done ? "bg-blue-500 text-white" : active ? "bg-[#df1f2d] text-white" : "bg-slate-100 text-slate-400"}`}>{done ? "✓" : "•"}</div><p className="font-bold">{label}</p></div>;
}

function OrderDetailSkeleton() {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-8 w-56" />
          <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="mt-6 h-40 rounded-xl" />
      <Skeleton className="mt-6 h-48 rounded-xl" />
    </div>
  );
}

function Summary({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return <div className={`flex items-center justify-between text-sm ${strong ? "pt-2 text-lg font-bold" : ""}`}><span>{label}</span><span>{formatNaira(value)}</span></div>;
}

function formatNaira(value: number) {
  return `NGN ${Number(value).toLocaleString()}`;
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ").toLowerCase().replace(/^\w|\s\w/g, (match) => match.toUpperCase());
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function formatDeliveryLeg(leg: string) {
  return leg === "PICKUP_TO_BRANCH" ? "Pickup to branch" : "Return to customer";
}
