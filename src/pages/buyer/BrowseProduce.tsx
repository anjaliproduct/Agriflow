import { CheckSquare, ChevronRight, Heart, Minus, Plus, Search, ShoppingCart, Square, Wheat, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "../../store/appStore";

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

const producePriceMap: Record<string, number> = {
  Tomatoes: 2.40, Onions: 1.80, Potatoes: 1.60, Carrots: 2.20, Spinach: 3.50,
  Broccoli: 3.20, Capsicum: 2.80, Cucumber: 1.90, Cabbage: 1.40, Corn: 2.00, Garlic: 4.50,
};

// Store-backed produce
const STORE_PRODUCE = ["Tomatoes", "Onions", "Potatoes", "Carrots", "Spinach"];

// Extra produce with static mock data (not yet in inventory store)
const EXTRA_PRODUCE: Array<{
  name: string; available: number; farmCount: number; earliestHarvest: string;
  dominantGrade: "A" | "B"; confidence: "High" | "Medium" | "Low";
}> = [
  { name: "Broccoli",  available: 100, farmCount: 2, earliestHarvest: "2026-07-04", dominantGrade: "B", confidence: "Medium" },
  { name: "Capsicum",  available: 180, farmCount: 1, earliestHarvest: "2026-07-06", dominantGrade: "B", confidence: "Medium" },
  { name: "Cucumber",  available: 220, farmCount: 2, earliestHarvest: "2026-07-07", dominantGrade: "A", confidence: "Medium" },
  { name: "Cabbage",   available: 180, farmCount: 1, earliestHarvest: "2026-07-05", dominantGrade: "A", confidence: "Medium" },
  { name: "Corn",      available: 95,  farmCount: 1, earliestHarvest: "2026-07-06", dominantGrade: "A", confidence: "Low"    },
  { name: "Garlic",    available: 310, farmCount: 2, earliestHarvest: "2026-07-03", dominantGrade: "A", confidence: "Medium" },
];

const TODAY = new Date("2026-07-08");

function daysAgoLabel(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  const diff = Math.floor((TODAY.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Harvested today";
  if (diff === 1) return "Harvested yesterday";
  return `Harvested ${diff} days ago`;
}

type CartItem = { name: string; qty: number; pricePerKg: number };

type ProduceItem = {
  name: string; available: number; farmCount: number; earliestHarvest: string;
  dominantGrade: "A" | "B"; confidence: "High" | "Medium" | "Low";
};

function SelectQtyDrawer({
  produce,
  onClose,
  cart,
  onAddToCart,
  onAddToWishlist,
}: {
  produce: ProduceItem;
  onClose: () => void;
  cart: CartItem[];
  onAddToCart: (name: string, qty: number, pricePerKg: number) => void;
  onAddToWishlist: (name: string) => void;
}) {
  const [qty, setQty] = useState(50);
  const pricePerKg = producePriceMap[produce.name] ?? 2.40;
  const img = produceImages[produce.name];
  const total = (qty * pricePerKg).toFixed(2);
  const alreadyInCart = cart.find((c) => c.name === produce.name);

  const cartTotal = cart.reduce((sum, c) => sum + c.qty * c.pricePerKg, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/20"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Select quantity</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Produce hero */}
          <div className="px-5 py-4">
            <div className="flex gap-4 items-center">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100">
                {img ? (
                  <img src={img} alt={produce.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-100 text-3xl">
                    {produceEmoji[produce.name] ?? "🌿"}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-950">{produce.name}</h3>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: produce.dominantGrade === "A" ? "#4A7C20" : "#d97706" }}
                  />
                  <p className="text-xs text-slate-500 font-medium">Grade {produce.dominantGrade}</p>
                  <span className="text-slate-300">·</span>
                  <p className="text-xs text-slate-400">{produce.available} kg available</p>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  ${pricePerKg.toFixed(2)}<span className="text-xs font-normal text-slate-400">/kg</span>
                </p>
              </div>
            </div>

            {/* Quantity selector */}
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Quantity (kg)</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 10))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min={1}
                  max={produce.available}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Math.min(produce.available, Number(e.target.value))))}
                  className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-center text-base font-semibold text-slate-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
                <button
                  onClick={() => setQty((q) => Math.min(produce.available, q + 10))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Plus size={14} />
                </button>
                <p className="text-xs text-slate-400">kg</p>
              </div>
            </div>

            {/* Price preview */}
            <div className="mt-4 flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: "#F7FFF3" }}>
              <p className="text-sm text-slate-600">{qty} kg × ${pricePerKg.toFixed(2)}/kg</p>
              <p className="text-base font-bold text-slate-900">${total}</p>
            </div>

            {/* CTAs */}
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => { onAddToCart(produce.name, qty, pricePerKg); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: alreadyInCart ? "#5a9a2a" : "#4A7C20" }}
              >
                <ShoppingCart size={15} />
                {alreadyInCart ? "Update cart" : "Add to cart"}
              </button>
              <button
                onClick={() => onAddToWishlist(produce.name)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Heart size={15} />
                Add to wishlist
              </button>
            </div>
          </div>

          {/* Cart summary */}
          {cart.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Cart ({cart.length} {cart.length === 1 ? "item" : "items"})
              </p>
              <div className="flex flex-col gap-2">
                {cart.map((c) => {
                  const cImg = produceImages[c.name];
                  return (
                    <div key={c.name} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-100">
                          {cImg ? (
                            <img src={cImg} alt={c.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-slate-100 text-base">
                              {produceEmoji[c.name] ?? "🌿"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.qty} kg</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">
                        ${(c.qty * c.pricePerKg).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Total */}
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <p className="text-sm font-semibold text-slate-600">Total</p>
                <p className="text-base font-bold text-slate-900">${cartTotal.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default function BrowseProduce() {
  const { inventory, farmers } = useAppStore();
  const [search, setSearch]           = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [minQty, setMinQty]           = useState("");
  const [deliveryBy, setDeliveryBy]   = useState("2026-07-10");
  const [drawerProduce, setDrawerProduce] = useState<ProduceItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const storeProduce = STORE_PRODUCE.map((name) => {
    const items = inventory.filter((item) => item.produce === name);
    const available = items.reduce((sum, item) => sum + item.declaredQuantity - item.reservedQuantity, 0);
    const farmIds = [...new Set(items.map((item) => item.farmerId))];
    const farmCount = farmIds.length;
    const relevantFarmers = farmers.filter((f) => farmIds.includes(f.id));
    const avgReliability = relevantFarmers.length > 0
      ? relevantFarmers.reduce((sum, f) => sum + f.reliability, 0) / relevantFarmers.length : 0;
    const harvestDates = items.map((i) => i.harvestDate).filter(Boolean).sort();
    const earliestHarvest = harvestDates[0] ?? "";
    const grades = items.map((i) => i.estimatedGrade);
    const dominantGrade: "A" | "B" = grades.filter((g) => g === "A").length >= grades.length / 2 ? "A" : "B";
    const confidence: "High" | "Medium" | "Low" =
      available >= 500 && farmCount >= 3 && avgReliability >= 90 ? "High"
      : available >= 200 || farmCount >= 2 ? "Medium"
      : "Low";
    return { name, available, farmCount, earliestHarvest, dominantGrade, confidence };
  });

  const allProduce = [...storeProduce, ...EXTRA_PRODUCE].filter((item) => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (gradeFilter && item.dominantGrade !== gradeFilter) return false;
    if (minQty && item.available < Number(minQty)) return false;
    return true;
  });

  function handleAddToCart(name: string, qty: number, pricePerKg: number) {
    setCart((prev) => {
      const existing = prev.find((c) => c.name === name);
      if (existing) {
        return prev.map((c) => c.name === name ? { ...c, qty } : c);
      }
      return [...prev, { name, qty, pricePerKg }];
    });
  }

  function handleAddToWishlist(_name: string) {
    // wishlist hook — extend later
  }

  return (
    <div className="-m-4 sm:-m-6 flex flex-col overflow-hidden" style={{ height: "100dvh" }}>

      {/* Linear-style header */}
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex h-11 items-center justify-between gap-2 px-3 sm:px-4">
          <div className="flex items-center gap-2">
            <Link to="/buyer/dashboard" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
              Dashboard
            </Link>
            <ChevronRight size={13} className="shrink-0 text-slate-300" />
            <span className="text-sm font-medium text-slate-900">Browse Produce</span>
          </div>
          <button
            onClick={() => { setBulkMode((v) => !v); setSelected(new Set()); }}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
            style={bulkMode
              ? { borderColor: "#4A7C20", color: "#4A7C20", backgroundColor: "#F2FFEF" }
              : { borderColor: "#e2e8f0", color: "#64748b" }}
          >
            {bulkMode ? <CheckSquare size={13} /> : <Square size={13} />}
            {bulkMode ? "Cancel" : "Select multiple"}
          </button>
        </div>
      </header>

      {/* Body: sidebar + cards */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left filter sidebar */}
        <aside className="hidden md:flex w-[260px] shrink-0 flex-col gap-5 border-r border-slate-200 bg-white px-4 py-5">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Search</p>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input className="input pl-9 text-sm" placeholder="Search produce" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Grade</p>
            <select className="input text-sm" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
              <option value="">Any grade</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
            </select>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Min quantity</p>
            <select className="input text-sm" value={minQty} onChange={(e) => setMinQty(e.target.value)}>
              <option value="">No minimum</option>
              <option value="100">100 kg+</option>
              <option value="300">300 kg+</option>
              <option value="500">500 kg+</option>
            </select>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Delivery by</p>
            <input className="input text-sm" type="date" value={deliveryBy} onChange={(e) => setDeliveryBy(e.target.value)} />
          </div>
          {(search || gradeFilter || minQty) && (
            <button
              className="text-xs font-medium text-slate-400 hover:text-slate-700 text-left"
              onClick={() => { setSearch(""); setGradeFilter(""); setMinQty(""); }}
            >
              Clear filters
            </button>
          )}
        </aside>

        {/* Cards area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 px-5 py-5">
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            {allProduce.map((item) => {
              const img = produceImages[item.name];
              const pricePerKg = producePriceMap[item.name] ?? 2.40;
              const harvestLabel = daysAgoLabel(item.earliestHarvest);
              const inCart = cart.find((c) => c.name === item.name);

              return (
                <div
                  key={item.name}
                  className="flex flex-col overflow-hidden bg-white transition-shadow duration-200 hover:shadow-lg"
                  style={{
                    borderRadius: "12px",
                    border: "1px solid #e8eaed",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Image — full bleed */}
                  <div
                    className="relative shrink-0 overflow-hidden"
                    style={{ height: "180px", cursor: bulkMode ? "pointer" : "default" }}
                    onClick={bulkMode ? () => setSelected((prev) => {
                      const next = new Set(prev);
                      next.has(item.name) ? next.delete(item.name) : next.add(item.name);
                      return next;
                    }) : undefined}
                  >
                    {img ? (
                      <img src={img} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-slate-100 text-6xl">
                        {produceEmoji[item.name] ?? "🌿"}
                      </div>
                    )}
                    {/* Bulk select checkbox */}
                    {bulkMode && (
                      <div
                        className="absolute left-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors"
                        style={selected.has(item.name)
                          ? { backgroundColor: "#4A7C20", borderColor: "#4A7C20" }
                          : { backgroundColor: "rgba(0,0,0,0.25)", borderColor: "rgba(255,255,255,0.7)" }}
                      >
                        {selected.has(item.name) && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    )}
                    {/* Favourite button — hidden in bulk mode */}
                    {!bulkMode && (
                      <button
                        className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/40"
                        style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
                        aria-label="Add to favourites"
                      >
                        <Heart size={15} className="text-white" />
                      </button>
                    )}
                  </div>

                  {/* Content section — white card lifting over image */}
                  <div
                    className="relative -mt-3 flex flex-1 flex-col bg-white px-3 pb-3 pt-3"
                    style={{ borderRadius: "12px" }}
                  >
                    {/* 1. Name + Quantity — hero row */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-xl font-bold text-slate-950">{item.name}</h3>
                      <p className="shrink-0 text-base font-bold text-slate-800">
                        {item.available} <span className="text-sm font-normal text-slate-400">kg</span>
                      </p>
                    </div>

                    {/* 2. Grade dot — secondary row */}
                    <div className="mt-1.5">
                      <span
                        className="h-2 w-2 rounded-full shrink-0 inline-block mr-1.5"
                        style={{ backgroundColor: item.dominantGrade === "A" ? "#4A7C20" : "#d97706" }}
                      />
                      <span className="text-xs text-slate-500 font-medium">Grade {item.dominantGrade}</span>
                    </div>

                    {/* 3. Harvest — tertiary row */}
                    {harvestLabel && (
                      <div className="mt-1 flex items-center gap-1">
                        <Wheat size={11} className="text-slate-400 shrink-0" />
                        <p className="text-xs text-slate-400">{harvestLabel}</p>
                      </div>
                    )}

                    <div className="mt-3 border-t border-slate-100" />

                    {/* 4. Price + CTA */}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="text-base font-bold text-slate-950">
                        ${pricePerKg.toFixed(2)}<span className="text-xs font-medium text-slate-400">/kg</span>
                      </p>
                      <button
                        onClick={() => setDrawerProduce(item)}
                        className="flex items-center justify-center rounded-lg border px-4 py-1.5 text-xs font-semibold transition-colors hover:bg-green-50"
                        style={{
                          borderColor: inCart ? "#4A7C20" : "#4A7C20",
                          color: inCart ? "#fff" : "#4A7C20",
                          backgroundColor: inCart ? "#4A7C20" : "transparent",
                        }}
                      >
                        {inCart ? `${inCart.qty} kg` : "Select Qty"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bulk action bar */}
      {bulkMode && selected.size > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white px-5 py-3 flex items-center justify-between gap-4 shadow-lg">
          <p className="text-sm font-semibold text-slate-700">
            {selected.size} {selected.size === 1 ? "item" : "items"} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                selected.forEach((name) => {
                  const price = producePriceMap[name] ?? 2.40;
                  handleAddToCart(name, 50, price);
                });
                setBulkMode(false);
                setSelected(new Set());
              }}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: "#4A7C20" }}
            >
              <ShoppingCart size={14} />
              Add all to cart
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Side drawer */}
      {drawerProduce && (
        <SelectQtyDrawer
          produce={drawerProduce}
          onClose={() => setDrawerProduce(null)}
          cart={cart}
          onAddToCart={(name, qty, pricePerKg) => {
            handleAddToCart(name, qty, pricePerKg);
            setDrawerProduce(null);
          }}
          onAddToWishlist={(name) => {
            handleAddToWishlist(name);
          }}
        />
      )}
    </div>
  );
}
