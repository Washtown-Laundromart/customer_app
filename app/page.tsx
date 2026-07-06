"use client";

import { useEffect } from "react";
import { ArrowRight, Bell, LogOut, PackageCheck, ReceiptText, Truck, User, WashingMachine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/toast-provider";
import { apiFetch, type Order } from "@/lib/api";
import { useCustomerStore } from "@/lib/store";

export default function CustomerDashboard() {
  const { token, setToken, profile, setProfile, order, setOrders } = useCustomerStore();
  const { showToast } = useToast();

  useEffect(() => {
    const savedToken = window.localStorage.getItem("freshfold_customer_token");
    const savedProfile = window.localStorage.getItem("freshfold_customer_profile");
    if (!savedToken) {
      window.location.href = "/auth";
      return;
    }
    setToken(savedToken);
    if (savedProfile) setProfile(JSON.parse(savedProfile));
    apiFetch<Order[]>("/api/orders", {}, savedToken).then(setOrders).catch(() => {
      setOrders([]);
      showToast({ type: "error", title: "Could not load orders", message: "Your account is open, but we could not load your latest orders. Please refresh the page." });
    });
  }, [setOrders, setProfile, setToken, showToast]);

  function signOut() {
    window.localStorage.removeItem("freshfold_customer_token");
    setToken("");
    window.location.href = "/auth";
  }

  if (!token) return null;

  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#102532]">
      <Header onSignOut={signOut} />
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card className="border-0 bg-[#102532] p-5 text-white shadow-xl shadow-slate-200 sm:p-7">
            <p className="text-sm font-bold uppercase text-cyan-200">Welcome back</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
              <div>
                <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Request a wash when your clothes are ready.</h1>
                <p className="mt-3 max-w-2xl text-slate-300">We use your saved profile details for courier pickup, then the branch inspects and sends a Paystack bill before washing starts.</p>
              </div>
              <Button className="h-12 w-full bg-white text-[#102532] hover:bg-slate-100 sm:w-auto" onClick={() => (window.location.href = "/request-wash")}>
                Request wash <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <StatusCard icon={<Truck />} label="Pickup" value={order ? "Courier requested" : "No active pickup"} />
            <StatusCard icon={<ReceiptText />} label="Billing" value={order?.bill?.paystackUrl ? "Bill ready" : "Awaiting inspection"} />
            <StatusCard icon={<PackageCheck />} label="Laundry" value={order ? "Pending payment" : "No wash order"} />
          </div>

          <Card className="border-0 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">Current wash order</h2>
                <p className="text-sm text-slate-500">Payment appears here only after the branch evaluates your clothes.</p>
              </div>
              <Button className="w-full bg-white text-[#102532] ring-1 ring-slate-200 hover:bg-slate-50 sm:w-auto" onClick={() => (window.location.href = "/orders")}>View orders</Button>
            </div>
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
              {order ? (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#13a7a5]">{order.code ?? "FF-20871"}</p>
                    <h3 className="mt-1 text-2xl font-bold">{formatStatus(order.status)}</h3>
                    <p className="mt-1 text-sm text-slate-500">{order.pickupAddress}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">{order.bill?.paystackUrl ? "Bill ready" : "Inspection pending"}</span>
                </div>
              ) : (
                <div className="text-center">
                  <PackageCheck className="mx-auto h-10 w-10 text-slate-400" />
                  <h3 className="mt-3 text-xl font-bold">No active wash order</h3>
                  <p className="mt-1 text-sm text-slate-500">Start by requesting pickup and listing the clothes you are sending.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="border-0 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 text-[#13a7a5]">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold">{profile.fullName}</p>
                <p className="text-sm text-slate-500">{profile.phone}</p>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <Info label="Email" value={profile.email} />
              <Info label="Pickup address" value={profile.defaultAddress} />
            </div>
            <Button className="mt-5 w-full bg-white text-[#102532] ring-1 ring-slate-200 hover:bg-slate-50" onClick={() => (window.location.href = "/profile")}>Edit profile</Button>
          </Card>

          <Card className="border-0 p-5 shadow-sm">
            <p className="flex items-center gap-2 font-bold"><Bell className="h-5 w-5 text-[#13a7a5]" /> Notifications</p>
            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              Branch bills and Paystack links will appear here and also be sent to your email.
            </div>
            <Button className="mt-4 w-full bg-white text-[#102532] ring-1 ring-slate-200 hover:bg-slate-50" onClick={() => (window.location.href = "/notifications")}>View notifications</Button>
          </Card>
        </aside>
      </section>
    </main>
  );
}

function Header({ onSignOut }: { onSignOut: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#102532] text-white"><WashingMachine className="h-5 w-5" /></div>
          <div><p className="text-lg font-bold leading-tight">FreshFold</p><p className="text-xs font-medium text-slate-500">Customer dashboard</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Notifications" onClick={() => (window.location.href = "/notifications")} className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#102532] hover:bg-slate-50">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#13a7a5]" />
          </button>
          <Button className="hidden bg-white text-[#102532] ring-1 ring-slate-200 hover:bg-slate-50 sm:inline-flex" onClick={() => (window.location.href = "/profile")}>Profile</Button>
          <Button className="bg-[#102532] px-3 text-xs hover:bg-[#1b3544] sm:px-4 sm:text-sm" onClick={onSignOut}><LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span><span className="sm:hidden">Out</span></Button>
        </div>
      </div>
    </header>
  );
}

function StatusCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <Card className="border-0 p-5 shadow-sm"><div className="text-[#13a7a5]">{icon}</div><p className="mt-4 text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 font-bold">{value}</p></Card>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-slate-100 pb-3"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function formatStatus(status?: string) {
  return status ? status.replaceAll("_", " ").toLowerCase().replace(/^\w|\s\w/g, (match) => match.toUpperCase()) : "Pickup requested";
}
