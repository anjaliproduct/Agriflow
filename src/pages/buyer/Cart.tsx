import { Check, ChevronRight, Hash, MapPin, Pencil, Wheat } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

const produceImages: Record<string, string> = {
  Tomatoes:   "/Farm%20Produce/Tomato.png",
  Onions:     "/Farm%20Produce/Onion.png",
  Potatoes:   "/Farm%20Produce/Potato.png",
  Carrots:    "/Farm%20Produce/Carrot.png",
  Spinach:    "/Farm%20Produce/Spinach.png",
  Broccoli:   "/Farm%20Produce/Brocolli.png",
  Cucumber:   "/Farm%20Produce/Cucumber.png",
  Cabbage:    "/Farm%20Produce/Cabbage.png",
  Corn:       "/Farm%20Produce/Corn.png",
  Blueberry:  "/Farm%20Produce/Blueberry.png",
  Lemon:      "/Farm%20Produce/Lemon.png",
  Pomegranate: "/Farm%20Produce/Pomogranate.png",
  Capsicum:   "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&h=400&fit=crop&auto=format",
};

const produceEmoji: Record<string, string> = {
  Tomatoes: "🍅", Onions: "🧅", Potatoes: "🥔", Carrots: "🥕", Spinach: "🥬",
  Broccoli: "🥦", Capsicum: "🫑", Cucumber: "🥒", Cabbage: "🥬", Corn: "🌽",
  Blueberry: "🫐", Lemon: "🍋", Pomegranate: "🍎",
};

const produceGrade: Record<string, "A" | "B"> = {
  Tomatoes: "A", Onions: "A", Potatoes: "B", Carrots: "A", Spinach: "A",
  Broccoli: "B", Capsicum: "B", Cucumber: "A", Cabbage: "A", Corn: "A",
  Blueberry: "A", Lemon: "A", Pomegranate: "B",
};

const produceHarvest: Record<string, string> = {
  Tomatoes: "2026-07-03", Onions: "2026-07-03", Potatoes: "2026-07-05", Carrots: "2026-07-04",
  Spinach: "2026-07-06", Broccoli: "2026-07-04", Capsicum: "2026-07-06", Cucumber: "2026-07-07",
  Cabbage: "2026-07-05", Corn: "2026-07-06",
  Blueberry: "2026-07-08", Lemon: "2026-07-05", Pomegranate: "2026-07-02",
};

const produceMaxQty: Record<string, number> = {
  Tomatoes: 700, Onions: 500, Potatoes: 600, Carrots: 400, Spinach: 200,
  Broccoli: 300, Capsicum: 250, Cucumber: 350, Cabbage: 450, Corn: 300,
  Blueberry: 60, Lemon: 140, Pomegranate: 90,
};

const TODAY = new Date("2026-07-08");

function harvestLabel(name: string): string {
  const dateStr = produceHarvest[name];
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  const diff = Math.floor((TODAY.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Harvested today";
  if (diff === 1) return "Harvested yesterday";
  return `Harvested ${diff} days ago`;
}

function earliestDelivery() {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + 2);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const TIME_SLOTS = [
  { id: "morning",   label: "Morning",   sub: "6 AM – 10 AM" },
  { id: "afternoon", label: "Afternoon", sub: "10 AM – 2 PM" },
  { id: "evening",   label: "Evening",   sub: "2 PM – 6 PM" },
];

const ADDRESSES = [
  {
    id: "default",
    name: "Fresh Mart Co.",
    tag: "WAREHOUSE",
    line1: "14 Orchard Lane, Industrial Estate, Whitefield",
    line2: "Bangalore, Karnataka – 560066",
    contact: "+91 98765 43210",
  },
];

type CartItem = { name: string; qty: number; pricePerKg: number };

// Two-step checkout: "cart" shows items, "delivery" shows address + time
type Step = "cart" | "delivery";

export default function Cart() {
  const location = useLocation();
  const initial: CartItem[] = location.state?.cart ?? [];
  const [items, setItems] = useState<CartItem[]>(initial);
  const [step, setStep] = useState<Step>("cart");
  const [selectedAddress, setSelectedAddress] = useState("default");
  const [timeSlot, setTimeSlot] = useState<string | null>(null);
  const minDateStr = new Date(TODAY.getTime() + 2 * 86400000).toISOString().split("T")[0];
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState(minDateStr);

  const subtotal = items.reduce((sum, c) => sum + c.qty * c.pricePerKg, 0);
  const deliveryFee = subtotal > 0 ? 12 : 0;
  const platformFee = subtotal > 0 ? 3 : 0;
  const tax = subtotal * 0.05;
  const total = subtotal + deliveryFee + platformFee + tax;

  function updateQty(name: string, raw: string) {
    const v = Number(raw.replace(/\D/g, ""));
    setItems((prev) => prev.map((c) => c.name === name ? { ...c, qty: v || 0 } : c));
  }

  function removeItem(name: string) {
    setItems((prev) => prev.filter((c) => c.name !== name));
  }

  return (
    <div className="-m-4 sm:-m-6 flex flex-col overflow-hidden" style={{ height: "100dvh" }}>

      {/* Header */}
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex h-11 items-center gap-2 px-4 sm:px-6">
          <Link to="/buyer/produce" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Browse Produce
          </Link>
          <ChevronRight size={13} className="shrink-0 text-slate-300" />
          {step === "delivery" ? (
            <>
              <button
                onClick={() => setStep("cart")}
                className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
              >
                Cart
              </button>
              <ChevronRight size={13} className="shrink-0 text-slate-300" />
              <span className="text-sm font-medium text-slate-900">Delivery</span>
            </>
          ) : (
            <span className="text-sm font-medium text-slate-900">Cart</span>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-[860px] px-6 pt-10 pb-16">

          <h1 className="text-2xl font-bold text-slate-950 mb-8">
            {step === "cart" ? "Your order" : "Delivery details"}
          </h1>

          <div className="flex gap-12">

            {/* Left column */}
            <div className="flex-1 min-w-0">

              {/* ── STEP 1: Cart items ── */}
              {step === "cart" && (
                <div>
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                      <p className="text-sm font-semibold text-slate-500">Your cart is empty</p>
                      <Link to="/buyer/produce" className="text-xs font-semibold text-green-700 hover:underline">
                        Browse produce
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {items.map((c) => {
                        const img = produceImages[c.name];
                        const maxQty = produceMaxQty[c.name] ?? 500;
                        return (
                          <div
                            key={c.name}
                            className="overflow-hidden rounded-2xl border border-slate-100"
                            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
                          >
                            <div className="flex">
                              <div className="w-28 shrink-0 p-2">
                                {img ? (
                                  <img src={img} alt={c.name} className="h-full w-full object-cover rounded-xl" />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-3xl">
                                    {produceEmoji[c.name] ?? "🌿"}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-1 min-w-0 flex-col py-3 pl-1 pr-4">
                                <div className="flex items-baseline justify-between gap-2">
                                  <p className="text-base font-semibold text-slate-900">{c.name}</p>
                                  <p className="shrink-0 text-base font-bold text-slate-900">
                                    ${(c.qty * c.pricePerKg).toFixed(2)}
                                  </p>
                                </div>
                                <ul className="mt-2 flex flex-col gap-1.5">
                                  <li className="flex items-center gap-2 text-sm text-slate-600">
                                    <span className="flex h-[13px] w-[13px] shrink-0 items-center justify-center">
                                      <span
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: produceGrade[c.name] === "A" ? "#4A7C20" : "#d97706" }}
                                      />
                                    </span>
                                    Grade {produceGrade[c.name] ?? "A"}
                                  </li>
                                  <li className="flex items-center gap-2 text-sm text-slate-600">
                                    <Wheat size={13} className="shrink-0 text-slate-400" />
                                    {harvestLabel(c.name)}
                                  </li>
                                  <li className="flex items-center gap-2 text-sm text-slate-600">
                                    <Hash size={13} className="shrink-0 text-slate-400" />
                                    <span className="text-slate-500">QTY</span>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={c.qty || ""}
                                      onChange={(e) => updateQty(c.name, e.target.value)}
                                      className="w-16 rounded-md border border-slate-300 px-2 py-0.5 text-sm font-medium text-slate-900 text-center outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                    />
                                    <span className="text-slate-400">kg</span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2">
                              <span className="text-xs text-slate-400">
                                ${c.pricePerKg}/kg &nbsp;|&nbsp; {maxQty}kg is max limit
                              </span>
                              <button
                                onClick={() => removeItem(c.name)}
                                className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 2: Delivery details ── */}
              {step === "delivery" && (
                <div className="flex flex-col gap-8">

                  {/* Address section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Delivery address</p>
                      <button className="text-xs font-semibold text-green-700 hover:underline">
                        + Add new address
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      {ADDRESSES.map((addr) => {
                        const selected = selectedAddress === addr.id;
                        return (
                          <button
                            key={addr.id}
                            onClick={() => setSelectedAddress(addr.id)}
                            className="w-full text-left rounded-2xl bg-white p-4 transition-colors"
                            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
                          >
                            <div className="flex flex-col gap-0">
                              {/* Name row with radio inline */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                                    style={{ borderColor: selected ? "#4A7C20" : "#cbd5e1" }}
                                  >
                                    {selected && (
                                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#4A7C20" }} />
                                    )}
                                  </div>
                                  <span className="text-sm font-semibold text-slate-900">{addr.name}</span>
                                  <span className="text-xs text-slate-400">(Default)</span>
                                </div>
                                <button
                                  className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Pencil size={13} />
                                </button>
                              </div>
                              {/* Details */}
                              <div className="flex flex-col gap-1.5 pl-6 mt-0">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                  {addr.line1}<br />{addr.line2}
                                </p>
                                <p className="text-sm text-slate-500">
                                  Contact: <span className="font-semibold text-slate-700">{addr.contact}</span>
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preferred delivery date */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">
                      Preferred delivery date
                    </p>
                    <div
                      className="rounded-2xl border border-slate-100 bg-white overflow-hidden"
                      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
                    >
                      <div className="flex items-start justify-between gap-4 px-4 pt-4 pb-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">Select delivery date</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">This is an estimated date and is subject to confirmation from the platform.</p>
                        </div>
                        <input
                          type="date"
                          value={selectedDeliveryDate}
                          min={minDateStr}
                          onChange={(e) => setSelectedDeliveryDate(e.target.value)}
                          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                      <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
                        <p className="text-xs text-slate-400">Earliest available: {earliestDelivery()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Preferred time */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">
                      Preferred delivery time
                    </p>
                    <div className="flex gap-3">
                      {TIME_SLOTS.map((slot) => {
                        const active = timeSlot !== null && timeSlot === slot.id;
                        return (
                          <button
                            key={slot.id}
                            onClick={() => setTimeSlot(slot.id)}
                            className="flex-1 rounded-xl px-3 py-3 text-left transition-colors"
                            style={{
                              backgroundColor: active ? "#F7FFF3" : "#fff",
                              boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
                              border: `1.5px solid ${active ? "#4A7C20" : "transparent"}`,
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-900">
                                {slot.label}
                              </p>
                              {active && (
                                <div className="flex h-4 w-4 items-center justify-center rounded-full" style={{ backgroundColor: "#4A7C20" }}>
                                  <Check size={10} color="#fff" strokeWidth={3} />
                                </div>
                              )}
                            </div>
                            <p className="text-xs mt-0.5 text-slate-400">
                              {slot.sub}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Right column — sticky price breakdown */}
            {items.length > 0 && (
              <div className="w-[300px] shrink-0">
                <div
                  className="sticky top-6 rounded-2xl border border-slate-100 bg-white p-6"
                  style={{ boxShadow: "0 2px 40px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.03)" }}
                >
                  <p className="mb-5 text-base font-semibold text-slate-900">Price breakdown</p>

                  <div className="flex flex-col gap-3">
                    {items.map((c) => (
                      <div key={c.name} className="flex items-center justify-between text-sm text-slate-600">
                        <span>{c.name} × {c.qty} kg</span>
                        <span>${(c.qty * c.pricePerKg).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="my-4 border-t border-slate-100" />

                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Delivery fee</span>
                      <span>${deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Platform fee</span>
                      <span>${platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Tax (5%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="my-4 border-t border-slate-100" />

                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-slate-900">Estimated total</span>
                    <span className="text-base font-bold text-slate-900">${total.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={() => step === "cart" ? setStep("delivery") : undefined}
                    className="mt-5 w-full rounded-full py-3 text-sm font-bold text-white transition-colors"
                    style={{ backgroundColor: "#4A7C20" }}
                  >
                    {step === "cart" ? "Continue" : "Request order"}
                  </button>

                  <p className="mt-3 text-center text-xs text-slate-400">
                    {step === "cart"
                      ? `Earliest delivery by ${earliestDelivery()}`
                      : `Estimated delivery by ${new Date(selectedDeliveryDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`
                    }
                  </p>

                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
