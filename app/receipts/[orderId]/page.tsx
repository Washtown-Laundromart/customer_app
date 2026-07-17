"use client";

import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Download, ReceiptText, WashingMachine } from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/toast-provider";
import { apiFetch, type Order } from "@/lib/api";
import { useCustomerStore } from "@/lib/store";

export default function ReceiptPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { token, setToken } = useCustomerStore();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const order = useMemo(() => orders.find((item) => item.id === orderId), [orderId, orders]);
  const bill = order?.bill;

  useEffect(() => {
    const savedToken = window.localStorage.getItem("freshfold_customer_token");
    if (!savedToken) {
      window.location.href = "/auth";
      return;
    }
    setToken(savedToken);
    apiFetch<Order[]>("/api/orders", {}, savedToken).then(setOrders).catch(() => {
      showToast({ type: "error", title: "Could not load receipt", message: "We could not load this receipt right now." });
    }).finally(() => setIsLoading(false));
  }, [setToken, showToast]);

  function downloadPdf() {
    if (!order || !bill) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const paidAt = bill.paidAt ? new Date(bill.paidAt).toLocaleString() : "Payment pending";
    const lineItems = bill.items ?? [];

    doc.setFillColor(16, 37, 50);
    doc.rect(0, 0, 595, 170, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Washtownnig", 48, 62);
    doc.setFontSize(15);
    doc.text("Payment Receipt", 48, 94);
    doc.setFontSize(28);
    doc.text(formatNaira(bill.total), 390, 80, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Total payment", 390, 104, { align: "right" });

    doc.setTextColor(16, 37, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Receipt details", 48, 215);
    detail(doc, "Order", order.code, 48, 245);
    detail(doc, "Payment time", paidAt, 305, 245);
    detail(doc, "Customer", order.branch?.name ? `${order.branch.name}` : "Washtownnig customer", 48, 305);
    detail(doc, "Payment method", "Paystack", 305, 305);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Inspected laundry items", 48, 390);
    let y = 420;
    lineItems.forEach((item) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${item.quantity} x ${item.itemName}`, 48, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`${item.serviceType} @ ${formatNaira(item.unitPrice)}`, 48, y + 17);
      doc.setTextColor(16, 37, 50);
      doc.setFont("helvetica", "bold");
      doc.text(formatNaira(item.total), 505, y, { align: "right" });
      y += 48;
    });

    y += 12;
    summary(doc, "Cleaning subtotal", bill.cleaningSubtotal, y);
    summary(doc, "Return delivery", bill.deliveryFee, y + 28);
    doc.setDrawColor(226, 232, 240);
    doc.line(48, y + 48, 505, y + 48);
    summary(doc, "Total paid", bill.total, y + 78, true);
    doc.save(`${order.code}-receipt.pdf`);
  }

  if (!token) return null;

  return (
    <main className="min-h-screen bg-[#5e6b7b] px-4 py-6 text-[#102532]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Button className="bg-white px-3 text-[#102532] ring-1 ring-slate-200 hover:bg-slate-50" onClick={() => (window.location.href = "/orders")}>
            <ArrowLeft className="h-4 w-4" /> Orders
          </Button>
          <Button disabled={!bill?.paidAt} onClick={downloadPdf}>
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>

        {isLoading && <Card className="border-0 p-6 text-center text-sm text-slate-500 shadow-xl">Loading receipt...</Card>}
        {!isLoading && (!order || !bill) && (
          <Card className="border-0 p-6 text-center shadow-xl">
            <h1 className="text-2xl font-bold">Receipt unavailable</h1>
            <p className="mt-2 text-sm text-slate-500">This order does not have a paid receipt yet.</p>
          </Card>
        )}
        {order && bill && (
          <Card className="overflow-hidden border-0 bg-[#20252c] text-white shadow-2xl">
            <div className="relative p-6 sm:p-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#49d39a] text-[#102532] shadow-xl">
                <Check className="h-8 w-8" />
              </div>
              <div className="mt-6 text-center">
                <p className="text-2xl font-bold">{bill.paidAt ? "Payment Success!" : "Payment Pending"}</p>
                <p className="mt-2 text-sm text-slate-300">{bill.paidAt ? "Your payment has been successfully confirmed." : "This receipt becomes final after payment is confirmed."}</p>
              </div>

              <div className="my-8 border-t border-white/15" />
              <div className="text-center">
                <p className="text-sm text-slate-300">Total Payment</p>
                <p className="mt-2 text-4xl font-bold">{formatNaira(bill.total)}</p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <ReceiptMeta label="Order" value={order.code} />
                <ReceiptMeta label="Payment Time" value={bill.paidAt ? new Date(bill.paidAt).toLocaleString() : "Pending"} />
                <ReceiptMeta label="Payment Method" value="Paystack" />
                <ReceiptMeta label="Branch" value={order.branch?.name ?? "Washtownnig"} />
              </div>

              <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="flex items-center gap-2 font-bold"><ReceiptText className="h-5 w-5 text-[#49d39a]" /> Inspected laundry items</p>
                <div className="mt-4 space-y-3">
                  {bill.items?.map((item, index) => (
                    <div key={`${item.itemName}-${index}`} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 text-sm">
                      <span><strong>{item.quantity} x {item.itemName}</strong><span className="block text-slate-400">{item.serviceType} · Unit {formatNaira(item.unitPrice)}</span></span>
                      <strong>{formatNaira(item.total)}</strong>
                    </div>
                  ))}
                  <ReceiptSummary label="Cleaning subtotal" value={bill.cleaningSubtotal} />
                  <ReceiptSummary label="Return delivery" value={bill.deliveryFee} />
                  <ReceiptSummary label="Total paid" value={bill.total} strong />
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-2"><WashingMachine className="h-4 w-4" /> Washtownnig</span>
                <span>{order.code}</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}

function ReceiptMeta({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/15 p-4"><p className="text-sm text-slate-300">{label}</p><p className="mt-2 font-bold">{value}</p></div>;
}

function ReceiptSummary({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return <div className={`flex items-center justify-between text-sm ${strong ? "pt-2 text-lg font-bold" : "text-slate-300"}`}><span>{label}</span><span>{formatNaira(value)}</span></div>;
}

function detail(doc: jsPDF, label: string, value: string, x: number, y: number) {
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y - 24, 200, 48, 6, 6, "F");
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text(label, x + 12, y - 5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 37, 50);
  doc.setFontSize(11);
  doc.text(value.slice(0, 28), x + 12, y + 14);
}

function summary(doc: jsPDF, label: string, value: number, y: number, strong = false) {
  doc.setFont("helvetica", strong ? "bold" : "normal");
  doc.setFontSize(strong ? 14 : 11);
  doc.text(label, 48, y);
  doc.text(formatNaira(value), 505, y, { align: "right" });
}

function formatNaira(value: number) {
  return `NGN ${Number(value).toLocaleString()}`;
}
