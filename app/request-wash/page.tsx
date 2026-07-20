"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, LocateFixed, Minus, Plus, Send, Truck, WashingMachine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/toast-provider";
import { apiFetch, toErrorMessage, type Branch, type Order, type ProfileResponse } from "@/lib/api";
import { useCustomerStore } from "@/lib/store";

const clothingTypes = ["Shirt", "Suit", "Senator wear", "Bedsheet", "Duvet", "Trouser", "Agbada", "Dress", "Skirt", "Towel"];
const providers = ["SHIPBUBBLE", "RELAY", "KWIK", "BOLT"] as const;

export default function RequestWashPage() {
  const { token, setToken, profile, setProfile, branch, setBranch, setOrder } = useCustomerStore();
  const { showToast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [pickupAddress, setPickupAddress] = useState(profile.defaultAddress);
  const [pickupCoordinates, setPickupCoordinates] = useState<{ latitude: number; longitude: number }>();
  const [provider, setProvider] = useState<(typeof providers)[number]>("SHIPBUBBLE");
  const [note, setNote] = useState("Please inspect for stains before billing.");
  const [items, setItems] = useState<Array<{ itemType: string; quantity: string }>>([{ itemType: "Shirt", quantity: "5" }]);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("freshfold_customer_token");
    const savedProfile = window.localStorage.getItem("freshfold_customer_profile");
    if (savedToken) setToken(savedToken);
    else window.location.href = "/auth";
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
      setPickupAddress(parsed.defaultAddress);
    }
    if (savedToken) {
      apiFetch<ProfileResponse>("/api/auth/me", {}, savedToken).then((result) => {
        const profileFromApi = {
          fullName: result.user.fullName,
          email: result.user.email,
          phone: result.user.phone ?? "",
          defaultAddress: result.user.defaultAddress ?? ""
        };
        window.localStorage.setItem("freshfold_customer_profile", JSON.stringify(profileFromApi));
        setProfile(profileFromApi);
        setPickupAddress(profileFromApi.defaultAddress);
      }).catch(() => {
        window.localStorage.removeItem("freshfold_customer_profile");
        setPickupAddress("");
      });
    }
    apiFetch<Branch[]>("/api/branches").then(setBranches).catch(() => setBranches([]));
  }, [setProfile, setToken]);

  const hasLiveBranches = branches.length > 0;
  const selectedBranch = useMemo(() => branch ?? branches[0], [branch, branches]);
  const totalClothes = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  function updateItem(index: number, patch: Partial<{ itemType: string; quantity: string }>) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function updatePickupAddress(value: string) {
    setPickupAddress(value);
    setPickupCoordinates(undefined);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      showToast({ type: "error", title: "Location unavailable", message: "Your browser cannot share your current location. Please enter a clear pickup address." });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition((position) => {
      setPickupCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      setIsLocating(false);
      showToast({ type: "success", title: "Location saved", message: "We will send these pickup coordinates with your wash request." });
    }, () => {
      setIsLocating(false);
      showToast({ type: "error", title: "Location not shared", message: "Allow location access or use another courier provider while testing." });
    }, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    });
  }

  async function submitRequest() {
    setIsSubmitting(true);
    try {
      if (!token) throw new Error("Please log in again.");
      if (!hasLiveBranches) {
        throw new Error("We could not find any FreshFold branches yet. Please try again in a few minutes.");
      }
      if (!selectedBranch) {
        throw new Error("Please select a branch before sending your request.");
      }
      if (provider === "RELAY" && !pickupCoordinates) {
        throw new Error("Tap Use my location before submitting a Relay pickup so the courier receives exact coordinates.");
      }
      const created = await apiFetch<Order>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          branchId: selectedBranch.id,
          pickupAddress,
          pickupLatitude: pickupCoordinates?.latitude,
          pickupLongitude: pickupCoordinates?.longitude,
          customerNote: `${note}\nPreferred provider: ${provider}`,
          preferredProvider: provider,
          requestedItems: items.map((item) => ({ itemType: item.itemType, quantity: Math.max(1, Number(item.quantity || 1)) })),
          fulfillmentMethod: "HOME_DELIVERY"
        })
      }, token);
      setOrder(created);
      showToast({
        type: "success",
        title: "Wash request sent",
        message: created.status === "PICKUP_COURIER_ASSIGNED" ? `Your order ${created.code} has been sent and pickup tracking is ready.` : `Your order ${created.code} has been sent to the branch for pickup review.`
      });
      window.location.href = "/orders";
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not send request",
        message: toErrorMessage(error)
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#102532]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#102532] text-white"><WashingMachine className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate text-lg font-bold">Request wash</p><p className="truncate text-xs text-slate-500">Pickup details and clothes count</p></div></div>
          <Button className="shrink-0 bg-white px-3 text-xs text-[#102532] ring-1 ring-slate-200 hover:bg-slate-50 sm:px-4 sm:text-sm" onClick={() => (window.location.href = "/")}><ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span></Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Card className="border-0 p-4 shadow-xl shadow-slate-200 sm:p-6">
            <h1 className="text-2xl font-bold sm:text-3xl">Pickup and courier details</h1>
            <p className="mt-2 text-slate-500">These are the details the backend will use when creating a courier pickup job.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Full name" value={profile.fullName} readOnly />
              <Field label="Phone number" value={profile.phone} readOnly />
              <Field label="Email" value={profile.email} readOnly />
              <div>
                <Field label="Pickup address" value={pickupAddress} onChange={updatePickupAddress} />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button className="h-9 bg-white px-3 text-xs text-[#102532] ring-1 ring-slate-200 hover:bg-slate-50" type="button" disabled={isLocating} onClick={useCurrentLocation}>
                    <LocateFixed className="h-3.5 w-3.5" /> {isLocating ? "Getting location..." : "Use my location"}
                  </Button>
                  {pickupCoordinates && <span className="text-xs font-semibold text-[#0b817f]">Coordinates saved</span>}
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Nearest branch<select className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" value={selectedBranch?.id ?? ""} onChange={(event) => setBranch(branches.find((item) => item.id === event.target.value) ?? branches[0])} disabled={!branches.length}>{branches.length ? branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>) : <option value="">No live branches found</option>}</select></label>
              <label className="text-sm font-semibold text-slate-700">Preferred courier provider<select className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" value={provider} onChange={(event) => setProvider(event.target.value as typeof provider)}>{providers.map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
          </Card>

          <Card className="border-0 p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-2xl font-bold">Clothes you are sending</h2><p className="text-sm text-slate-500">This is only a customer estimate. Branch staff still bills after inspection.</p></div>
              <Button className="w-full bg-white text-[#102532] ring-1 ring-slate-200 hover:bg-slate-50 sm:w-auto" onClick={() => setItems([...items, { itemType: "Shirt", quantity: "1" }])}><Plus className="h-4 w-4" /> Add item</Button>
            </div>
            <div className="mt-5 space-y-3">
              {items.map((item, index) => (
                <div key={`${item.itemType}-${index}`} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_140px_auto]">
                  <select className="h-12 rounded-lg border border-slate-200 bg-white px-3 text-sm" value={item.itemType} onChange={(event) => updateItem(index, { itemType: event.target.value })}>{clothingTypes.map((type) => <option key={type}>{type}</option>)}</select>
                  <input className="h-12 rounded-lg border border-slate-200 bg-white px-3 text-sm" inputMode="numeric" pattern="[0-9]*" type="text" value={item.quantity} onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "");
                    updateItem(index, { quantity: digits });
                  }} />
                  <Button className="w-full bg-white text-[#102532] ring-1 ring-slate-200 hover:bg-slate-50 sm:w-12" onClick={() => removeItem(index)}><Minus className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
            <label className="mt-5 block text-sm font-semibold text-slate-700">Notes for branch staff<textarea className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#13a7a5]" value={note} onChange={(event) => setNote(event.target.value)} /></label>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="border-0 bg-[#102532] p-5 text-white shadow-xl shadow-slate-200">
            <Truck className="h-6 w-6 text-cyan-200" />
            <h2 className="mt-5 text-2xl font-bold">Request summary</h2>
            <div className="mt-5 space-y-3 text-sm">
              <Summary label="Customer" value={profile.fullName} />
              <Summary label="Phone" value={profile.phone} />
              <Summary label="Provider" value={provider} />
              <Summary label="Clothes count" value={`${totalClothes} items`} />
              <Summary label="Billing" value="After inspection" />
            </div>
            <Button className="mt-6 h-12 w-full bg-white text-[#102532] hover:bg-slate-100" disabled={isSubmitting || !items.length} onClick={submitRequest}>
              {isSubmitting ? "Submitting..." : "Submit wash request"} <Send className="h-4 w-4" />
            </Button>
          </Card>
        </aside>
      </section>
    </main>
  );
}

function Field({ label, value, readOnly, onChange }: { label: string; value: string; readOnly?: boolean; onChange?: (value: string) => void }) {
  return <label className="text-sm font-semibold text-slate-700">{label}<input className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#13a7a5] disabled:bg-slate-50" value={value} disabled={readOnly} onChange={(event) => onChange?.(event.target.value)} /></label>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3 border-b border-white/10 pb-3"><span className="text-slate-300">{label}</span><strong className="text-right">{value}</strong></div>;
}
