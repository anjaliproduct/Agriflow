import { ChevronRight, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

const produceImages: Record<string, string> = {
  Tomatoes: "/tomato-front.png",
  Onions:    "/Onion.png",
  Potatoes:  "/Potato.png",
  Carrots:   "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&h=400&fit=crop&auto=format",
  Spinach:   "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&h=400&fit=crop&auto=format",
  Broccoli:  "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&h=400&fit=crop&auto=format",
  Capsicum:  "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&h=400&fit=crop&auto=format",
  Cucumber:  "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=600&h=400&fit=crop&auto=format",
  Cabbage:   "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&h=400&fit=crop&auto=format",
  Corn:      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=400&fit=crop&auto=format",
  Garlic:    "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600&h=400&fit=crop&auto=format",
};

const produceEmoji: Record<string, string> = {
  Tomatoes: "🍅", Onions: "🧅", Potatoes: "🥔", Carrots: "🥕", Spinach: "🥬",
  Broccoli: "🥦", Capsicum: "🫑", Cucumber: "🥒", Cabbage: "🥬", Corn: "🌽", Garlic: "🧄",
};

const produceGrade: Record<string, "A" | "B"> = {
  Tomatoes: "A", Onions: "A", Potatoes: "B", Carrots: "A", Spinach: "A",
  Broccoli: "B", Capsicum: "B", Cucumber: "A", Cabbage: "A", Corn: "A", Garlic: "A",
};

const produceHarvest: Record<string, string> = {
  Tomatoes: "2026-07-03", Onions: "2026-07-03", Potatoes: "2026-07-05", Carrots: "2026-07-04",
  Spinach: "2026-07-06", Broccoli: "2026-07-04", Capsicum: "2026-07-06", Cucumber: "2026-07-07",
  Cabbage: "2026-07-05", Corn: "2026-07-06", Garlic: "2026-07-03",
};

const produceMaxQty: Record<string, number> = {
  Tomatoes: 700, Onions: 500, Potatoes: 600, Carrots: 400, Spinach: 200,
  Broccoli: 300, Capsicum: 250, Cucumber: 350, Cabbage: 450, Corn: 300, Garlic: 150,
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
function deliveryLabel() {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + 2);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

type CartItem = { name: string; qty: number; pricePerKg: number };

export default function Cart() {
  const location = useLocation();
  const initial: CartItem[] = location.state?.cart ?? [];
  const [items, setItems] = useState<CartItem[]>(initial);

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
          <span className="text-sm font-medium text-slate-900">Cart</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-[860px] px-6 pt-10 pb-16">

          <h1 className="text-2xl font-bold text-slate-950 mb-8">Your order</h1>

          <div className="flex gap-12">

          {/* Left column */}
          <div className="flex-1 min-w-0">

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
                        {/* Main row */}
                        <div className="flex">
                          {/* Thumbnail — fills full height */}
                          <div className="w-28 shrink-0 p-2">
                            {img ? (
                              <img src={img} alt={c.name} className="h-full w-full object-cover rounded-xl" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-3xl">
                                {produceEmoji[c.name] ?? "🌿"}
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex flex-1 min-w-0 flex-col p-4">
                            {/* Name + total */}
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="text-base font-semibold text-slate-900">{c.name}</p>
                              <p className="shrink-0 text-base font-bold text-slate-900">
                                ${(c.qty * c.pricePerKg).toFixed(2)}
                              </p>
                            </div>

                            {/* Bullet list */}
                            <ul className="mt-2 flex flex-col gap-1.5">
                              <li className="flex items-center gap-2 text-sm text-slate-600">
                                <span className="h-1 w-1 rounded-full shrink-0 bg-slate-400" />
                                Grade {produceGrade[c.name] ?? "A"}
                              </li>
                              <li className="flex items-center gap-2 text-sm text-slate-600">
                                <span className="h-1 w-1 rounded-full shrink-0 bg-slate-400" />
                                {harvestLabel(c.name)}
                              </li>
                              <li className="flex items-center gap-2 text-sm text-slate-600">
                                <span className="h-1 w-1 rounded-full shrink-0 bg-slate-400" />
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

                        {/* Footer strip */}
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

          </div>

          {/* Right column — sticky */}
          {items.length > 0 && (
            <div className="w-[320px] shrink-0">
              <div className="sticky top-6 flex flex-col gap-3">

                {/* Delivery card */}
                <div
                  className="rounded-2xl border border-slate-100 bg-white p-4"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "#EAF3DA" }}
                    >
                      <MapPin size={18} style={{ color: "#4A7C20" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">Earliest delivery</p>
                      <p className="text-xs text-slate-500 mt-0.5">{deliveryLabel()} · 14 Orchard Lane</p>
                    </div>
                    <button className="shrink-0 text-xs font-semibold rounded-full border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50 transition-colors">
                      Change
                    </button>
                  </div>
                </div>

                {/* Price breakdown card */}
                <div
                  className="rounded-2xl border border-slate-100 bg-white p-6"
                  style={{ boxShadow: "0 2px 40px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.03)" }}
                >
                  <p className="mb-5 text-base font-semibold text-slate-900">Price breakdown</p>

                  {/* Line items */}
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
                    className="mt-5 w-full rounded-full py-3 text-sm font-bold text-white transition-colors"
                    style={{ backgroundColor: "#4A7C20" }}
                  >
                    Request order
                  </button>

                  <p className="mt-3 text-center text-xs text-slate-400">
                    Estimated delivery by {deliveryLabel()}
                  </p>
                </div>

              </div>
            </div>
          )}

          </div>
        </div>
      </div>
    </div>
  );
}
