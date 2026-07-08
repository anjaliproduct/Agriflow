import { ArrowUpDown, CheckSquare, ChevronLeft, ChevronRight, Heart, Search, ShoppingCart, Square, Wheat } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export default function BrowseProduce() {
  const navigate = useNavigate();
  const { inventory, farmers } = useAppStore();
  const [search, setSearch]           = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [minQty, setMinQty]           = useState("");
  const [deliveryBy, setDeliveryBy]   = useState("2026-07-10");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingQty, setEditingQty] = useState<Record<string, number>>({});
  const [produceType, setProduceType] = useState("");

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

  const LEAFY = ["Spinach", "Cabbage"];
  const ROOT = ["Potatoes", "Carrots", "Garlic", "Onions"];
  const FRUIT_VEG = ["Tomatoes", "Capsicum", "Cucumber", "Corn"];
  const BRASSICA = ["Broccoli", "Cabbage"];

  const allProduce = [...storeProduce, ...EXTRA_PRODUCE].filter((item) => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (gradeFilter && item.dominantGrade !== gradeFilter) return false;
    if (minQty && item.available < Number(minQty)) return false;
    if (produceType === "leafy" && !LEAFY.includes(item.name)) return false;
    if (produceType === "root" && !ROOT.includes(item.name)) return false;
    if (produceType === "fruit_veg" && !FRUIT_VEG.includes(item.name)) return false;
    if (produceType === "brassica" && !BRASSICA.includes(item.name)) return false;
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
          <span className="text-sm font-medium text-slate-900">Browse Produce</span>
        </div>
      </header>

      {/* Body: sidebar + cards */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left filter sidebar */}
        <aside className="hidden md:flex w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-6 gap-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Produce type</p>
            <div className="relative">
              <select
                className="input text-sm w-full appearance-none"
                style={{ borderRadius: "8px", paddingRight: "2rem" }}
                value={produceType}
                onChange={(e) => setProduceType(e.target.value)}
              >
                <option value="">All types</option>
                <option value="leafy">Leafy greens</option>
                <option value="root">Root vegetables</option>
                <option value="fruit_veg">Fruit vegetables</option>
                <option value="brassica">Brassicas</option>
              </select>
              <ChevronRight size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400" />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Grade</p>
            <div className="relative">
              <select
                className="input text-sm w-full appearance-none"
                style={{ borderRadius: "8px", paddingRight: "2rem" }}
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
              >
                <option value="">Any grade</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
              </select>
              <ChevronRight size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400" />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Min quantity</p>
            <input
              type="text"
              inputMode="numeric"
              className="input text-sm w-full"
              style={{ borderRadius: "12px" }}
              placeholder="e.g. 100"
              value={minQty}
              onChange={(e) => setMinQty(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Delivery by</p>
            <input
              className="input text-sm w-full"
              style={{ borderRadius: "12px" }}
              type="date"
              value={deliveryBy}
              onChange={(e) => setDeliveryBy(e.target.value)}
            />
          </div>
          {(gradeFilter || minQty || produceType) && (
            <button
              className="text-xs font-medium text-slate-400 hover:text-slate-700 text-left"
              onClick={() => { setGradeFilter(""); setMinQty(""); setProduceType(""); }}
            >
              Clear filters
            </button>
          )}
        </aside>

        {/* Cards area */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Catalogue subheader */}
          <div className="flex h-[72px] shrink-0 items-center gap-3 px-5" style={{ backgroundColor: "#f8f8f8", boxShadow: "0 1px 12px rgba(0,0,0,0.07)" }}>
            {/* Left: Select multiple */}
            <button
              onClick={() => { setBulkMode((v) => !v); setSelected(new Set()); }}
              className="flex h-9 items-center gap-1.5 border px-3 text-xs font-semibold transition-colors shrink-0"
              style={bulkMode
                ? { borderRadius: "24px", borderColor: "#4A7C20", color: "#4A7C20", backgroundColor: "#F2FFEF" }
                : { borderRadius: "24px", borderColor: "#e2e8f0", color: "#64748b", backgroundColor: "#ffffff" }}
            >
              {bulkMode ? <CheckSquare size={13} /> : <Square size={13} />}
              {bulkMode ? "Cancel" : "Select multiple"}
            </button>

            {/* Center: Search + Sort */}
            <div className="flex items-center gap-2 mx-auto">
              <div className="relative w-[360px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  className="input pl-9 py-2 text-sm w-full"
                  style={{ borderRadius: "24px" }}
                  placeholder="Search produce"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shrink-0 rounded-full">
                <ArrowUpDown size={15} />
              </button>
            </div>

            {/* Right: Cart */}
            <button
              onClick={() => navigate("/buyer/cart", { state: { cart } })}
              className="relative flex h-9 items-center gap-1.5 border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shrink-0 rounded-full"
            >
              <ShoppingCart size={13} />
              Cart
              {cart.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: "#4A7C20" }}>
                  {cart.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-white px-5 py-5">
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

                  {/* Content section — slides between info and qty panels */}
                  <div
                    className="relative -mt-3 overflow-hidden bg-white"
                    style={{ borderRadius: "12px" }}
                  >
                    {/* Info panel */}
                    <div
                      className="flex flex-col px-3 pb-3 pt-3 transition-transform duration-300 ease-in-out"
                      style={{ transform: editingQty[item.name] !== undefined ? "translateX(-100%)" : "translateX(0)" }}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-xl font-bold text-slate-950">{item.name}</h3>
                        <p className="shrink-0 text-base font-bold text-slate-800">
                          {item.available} <span className="text-sm font-normal text-slate-400">kg</span>
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-slate-400 text-xs">·</span>
                        <span
                          className="h-1.5 w-1.5 rounded-full inline-block"
                          style={{ backgroundColor: item.dominantGrade === "A" ? "#4A7C20" : "#d97706" }}
                        />
                        <span className="text-xs text-slate-500">Grade {item.dominantGrade}</span>
                      </div>
                      {harvestLabel && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-slate-400 text-xs">·</span>
                          <Wheat size={10} className="text-slate-400 shrink-0" />
                          <p className="text-xs text-slate-400">{harvestLabel}</p>
                        </div>
                      )}
                      <div className="mt-3 border-t border-slate-100" />
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="text-base font-bold text-slate-950">
                          ${pricePerKg.toFixed(2)}<span className="text-xs font-medium text-slate-400">/kg</span>
                        </p>
                        <button
                          onClick={() => setEditingQty((prev) => ({ ...prev, [item.name]: inCart?.qty ?? 1 }))}
                          className="flex h-7 w-24 items-center justify-center rounded-full border text-xs font-semibold transition-colors hover:bg-green-50"
                          style={{
                            borderColor: "#4A7C20",
                            color: inCart ? "#fff" : "#4A7C20",
                            backgroundColor: inCart ? "#4A7C20" : "transparent",
                          }}
                        >
                          {inCart ? `${inCart.qty} kg` : "Select Qty"}
                        </button>
                      </div>
                    </div>

                    {/* Qty panel — slides in from right */}
                    <div
                      className="absolute inset-0 flex flex-col px-3 pb-3 pt-3 bg-white transition-transform duration-300 ease-in-out"
                      style={{ transform: editingQty[item.name] !== undefined ? "translateX(0)" : "translateX(100%)" }}
                    >
                      {/* Header row */}
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => setEditingQty((prev) => { const n = { ...prev }; delete n[item.name]; return n; })}
                          className="text-slate-500 hover:text-slate-800 transition-colors shrink-0"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <p className="text-base font-bold text-slate-900">Select Qty</p>
                      </div>

                      {/* Input row */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Enter value"
                          value={editingQty[item.name] || ""}
                          onChange={(e) => {
                            const v = Number(e.target.value.replace(/\D/g, ""));
                            setEditingQty((prev) => ({ ...prev, [item.name]: Math.min(item.available, v) }));
                          }}
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        />
                        <span className="text-sm text-slate-500 font-medium shrink-0">kg</span>
                      </div>

                      <div className="mt-3 border-t border-slate-100" />

                      {/* Total + Add to cart */}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-700">
                          Total:{" "}
                          <span className="text-slate-950">
                            {editingQty[item.name] ? `$${(editingQty[item.name] * pricePerKg).toFixed(2)}` : "—"}
                          </span>
                        </p>
                        {inCart ? (
                          <button
                            onClick={() => navigate("/buyer/cart", { state: { cart } })}
                            className="h-7 w-24 rounded-full text-xs font-semibold text-white transition-colors"
                            style={{ backgroundColor: "#4A7C20" }}
                          >
                            View cart
                          </button>
                        ) : (
                          <button
                            disabled={!editingQty[item.name]}
                            onClick={() => {
                              handleAddToCart(item.name, editingQty[item.name], pricePerKg);
                            }}
                            className="h-7 w-24 rounded-full text-xs font-semibold text-white transition-colors disabled:opacity-40"
                            style={{ backgroundColor: "#4A7C20" }}
                          >
                            Add to cart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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

    </div>
  );
}
