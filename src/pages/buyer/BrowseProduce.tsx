import { ChevronLeft, Heart, Search, ShoppingCart, Wheat } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../../store/appStore";


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

const producePriceMap: Record<string, number> = {
  Tomatoes: 2.40, Onions: 1.80, Potatoes: 1.60, Carrots: 2.20, Spinach: 3.50,
  Broccoli: 3.20, Capsicum: 2.80, Cucumber: 1.90, Cabbage: 1.40, Corn: 2.00,
  Blueberry: 6.50, Lemon: 2.90, Pomegranate: 4.20,
};

// Store-backed produce
const STORE_PRODUCE = ["Tomatoes", "Onions", "Potatoes", "Carrots", "Spinach"];

// Extra produce with static mock data (not yet in inventory store)
const EXTRA_PRODUCE: Array<{
  name: string; available: number; farmCount: number; earliestHarvest: string;
  dominantGrade: "A" | "B"; confidence: "High" | "Medium" | "Low";
}> = [
  { name: "Broccoli",    available: 100, farmCount: 2, earliestHarvest: "2026-07-04", dominantGrade: "B", confidence: "Medium" },
  { name: "Capsicum",    available: 180, farmCount: 1, earliestHarvest: "2026-07-06", dominantGrade: "B", confidence: "Medium" },
  { name: "Blueberry",   available: 60,  farmCount: 1, earliestHarvest: "2026-07-08", dominantGrade: "A", confidence: "Medium" },
  { name: "Lemon",       available: 140, farmCount: 2, earliestHarvest: "2026-07-05", dominantGrade: "A", confidence: "Medium" },
  { name: "Cabbage",     available: 180, farmCount: 1, earliestHarvest: "2026-07-05", dominantGrade: "A", confidence: "Medium" },
  { name: "Cucumber",    available: 220, farmCount: 2, earliestHarvest: "2026-07-07", dominantGrade: "A", confidence: "Medium" },
  { name: "Corn",        available: 95,  farmCount: 1, earliestHarvest: "2026-07-06", dominantGrade: "A", confidence: "Low"    },
  { name: "Pomegranate", available: 90,  farmCount: 1, earliestHarvest: "2026-07-02", dominantGrade: "B", confidence: "Low"    },
];

const TODAY = new Date("2026-07-08");

function daysAgoLabel(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  const diff = Math.floor((TODAY.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}

type CartItem = { name: string; qty: number; pricePerKg: number };

type ProduceItem = {
  name: string; available: number; farmCount: number; earliestHarvest: string;
  dominantGrade: "A" | "B"; confidence: "High" | "Medium" | "Low";
};

export default function BrowseProduce() {
  const navigate = useNavigate();
  const { inventory, farmers } = useAppStore();
  const [gradeFilter, setGradeFilter] = useState("");
  const [deliveryBy, setDeliveryBy]   = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingQty, setEditingQty] = useState<Record<string, number>>({});
  const [produceType, setProduceType] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [activeSegment, setActiveSegment] = useState<null | "type" | "grade" | "delivery">(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;
    function handleClickOutside(e: MouseEvent) {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setExpanded(false);
        setActiveSegment(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expanded]);

  const produceTypeLabels: Record<string, string> = {
    "": "All types", leafy: "Leafy greens", root: "Root vegetables", fruit_veg: "Fruit vegetables", brassica: "Brassicas", fruits: "Fruits",
  };
  const gradeLabels: Record<string, string> = { "": "Any grade", A: "Grade A", B: "Grade B" };
  const deliveryLabel = deliveryBy
    ? new Date(`${deliveryBy}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Add date";

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
  const ROOT = ["Potatoes", "Carrots", "Onions"];
  const FRUIT_VEG = ["Tomatoes", "Capsicum", "Cucumber", "Corn"];
  const BRASSICA = ["Broccoli", "Cabbage"];
  const FRUITS = ["Blueberry", "Lemon", "Pomegranate"];

  const allProduce = [...storeProduce, ...EXTRA_PRODUCE].filter((item) => {
    if (gradeFilter && item.dominantGrade !== gradeFilter) return false;
    if (produceType === "leafy" && !LEAFY.includes(item.name)) return false;
    if (produceType === "root" && !ROOT.includes(item.name)) return false;
    if (produceType === "fruit_veg" && !FRUIT_VEG.includes(item.name)) return false;
    if (produceType === "brassica" && !BRASSICA.includes(item.name)) return false;
    if (produceType === "fruits" && !FRUITS.includes(item.name)) return false;
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
          <button
            onClick={() => navigate("/buyer/cart", { state: { cart } })}
            className="relative flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
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
      </header>

      {/* Body: cards */}
      <div className="flex flex-1 overflow-hidden">

        {/* Cards area */}
        <div className="relative flex flex-col flex-1 overflow-hidden">

          {/* Catalogue subheader — grows 40px top + 40px bottom when expanded */}
          <div
            className="relative z-50 flex shrink-0 items-center justify-center bg-white px-5 transition-[height] duration-200"
            style={{ height: expanded ? "152px" : "72px", boxShadow: "0 1px 12px rgba(0,0,0,0.07)" }}
          >
            <div ref={filterBarRef} className="flex items-center gap-2">
              {!expanded ? (
                /* Collapsed — single line, plain values only */
                <button
                  onClick={() => setExpanded(true)}
                  className="flex h-12 items-center gap-3 rounded-full border border-slate-200 bg-white pl-6 pr-1.5 text-sm font-semibold text-slate-900 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span>{produceTypeLabels[produceType]}</span>
                  <span className="h-4 w-px bg-slate-200" />
                  <span>{gradeLabels[gradeFilter]}</span>
                  <span className="h-4 w-px bg-slate-200" />
                  <span>{deliveryLabel}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full text-white" style={{ backgroundColor: "#4A7C20" }}>
                    <Search size={15} />
                  </span>
                </button>
              ) : (
                /* Expanded — centered within the now-taller subheader */
                <div
                  className="flex items-center rounded-full border border-slate-200 bg-white p-2 shadow-xl"
                  style={{ minWidth: "560px" }}
                >
                  {/* Produce type segment */}
                  <label
                    className="flex h-16 flex-1 cursor-pointer flex-col justify-center rounded-full px-6 transition-colors"
                    style={{ backgroundColor: activeSegment === "type" ? "#f2f2f2" : "transparent" }}
                  >
                    <span className="text-xs font-bold text-slate-900">What</span>
                    <select
                      autoFocus
                      className="w-full cursor-pointer appearance-none truncate bg-transparent text-sm text-slate-600 outline-none"
                      value={produceType}
                      onFocus={() => setActiveSegment("type")}
                      onChange={(e) => { setProduceType(e.target.value); setActiveSegment("type"); }}
                    >
                      <option value="">All types</option>
                      <option value="leafy">Leafy greens</option>
                      <option value="root">Root vegetables</option>
                      <option value="fruit_veg">Fruit vegetables</option>
                      <option value="brassica">Brassicas</option>
                      <option value="fruits">Fruits</option>
                    </select>
                  </label>

                  <div className="h-8 w-px shrink-0 bg-slate-200" style={{ opacity: activeSegment === "type" || activeSegment === "grade" ? 0 : 1 }} />

                  {/* Grade segment */}
                  <label
                    className="flex h-16 flex-1 cursor-pointer flex-col justify-center rounded-full px-6 transition-colors"
                    style={{ backgroundColor: activeSegment === "grade" ? "#f2f2f2" : "transparent" }}
                  >
                    <span className="text-xs font-bold text-slate-900">Grade</span>
                    <select
                      className="w-full cursor-pointer appearance-none truncate bg-transparent text-sm text-slate-600 outline-none"
                      value={gradeFilter}
                      onFocus={() => setActiveSegment("grade")}
                      onChange={(e) => { setGradeFilter(e.target.value); setActiveSegment("grade"); }}
                    >
                      <option value="">Any grade</option>
                      <option value="A">Grade A</option>
                      <option value="B">Grade B</option>
                    </select>
                  </label>

                  <div className="h-8 w-px shrink-0 bg-slate-200" style={{ opacity: activeSegment === "grade" || activeSegment === "delivery" ? 0 : 1 }} />

                  {/* Delivery date segment — custom label text, native icon/placeholder hidden */}
                  <label
                    className="relative flex h-16 flex-1 cursor-pointer flex-col justify-center rounded-full px-6 transition-colors"
                    style={{ backgroundColor: activeSegment === "delivery" ? "#f2f2f2" : "transparent" }}
                  >
                    <span className="text-xs font-bold text-slate-900">When</span>
                    <span className="truncate text-sm text-slate-600">{deliveryLabel}</span>
                    <input
                      type="date"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      value={deliveryBy}
                      onFocus={() => setActiveSegment("delivery")}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      onChange={(e) => { setDeliveryBy(e.target.value); setActiveSegment("delivery"); }}
                    />
                  </label>

                  <button
                    onClick={() => { setExpanded(false); setActiveSegment(null); }}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#4A7C20" }}
                    aria-label="Apply filters"
                  >
                    <Search size={17} />
                  </button>
                </div>
              )}

              {!expanded && (gradeFilter || produceType || deliveryBy) && (
                <button
                  className="shrink-0 text-xs font-medium text-slate-400 hover:text-slate-700"
                  onClick={() => { setGradeFilter(""); setProduceType(""); setDeliveryBy(""); }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white px-5 py-5">
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            {allProduce.map((item) => {
              const img = produceImages[item.name];
              const zoomedOut = item.name === "Lemon" || item.name === "Pomegranate";
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
                  <div className="relative shrink-0 overflow-hidden" style={{ height: "180px" }}>
                    {img ? (
                      <img
                        src={img}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        style={zoomedOut ? { transform: "scale(0.72)" } : undefined}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-slate-100 text-6xl">
                        {produceEmoji[item.name] ?? "🌿"}
                      </div>
                    )}
                    <button
                      className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/40"
                      style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
                      aria-label="Add to favourites"
                    >
                      <Heart size={15} className="text-white" />
                    </button>
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
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                          <span
                            className="h-2 w-2 rounded-full inline-block"
                            style={{ backgroundColor: item.dominantGrade === "A" ? "#4A7C20" : "#d97706" }}
                          />
                        </span>
                        <span className="text-sm text-slate-500">Grade {item.dominantGrade}</span>
                      </div>
                      {harvestLabel && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                            <Wheat size={14} className="text-slate-400" />
                          </span>
                          <p className="text-sm text-slate-400">{harvestLabel}</p>
                        </div>
                      )}
                      <div className="mt-3 border-t border-slate-100" />
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="text-base font-bold text-slate-950">
                          ${pricePerKg.toFixed(2)}<span className="text-xs font-medium text-slate-400">/kg</span>
                        </p>
                        <button
                          onClick={() => setEditingQty((prev) => ({ ...prev, [item.name]: inCart?.qty ?? 1 }))}
                          className="flex h-7 w-24 items-center justify-center rounded-lg border text-xs font-semibold transition-colors hover:bg-green-50"
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
                            className="h-7 w-24 rounded-lg text-xs font-semibold text-white transition-colors"
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
                            className="h-7 w-24 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-40"
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

          {/* Dim overlay on the produce grid while the filter bar is expanded */}
          {expanded && (
            <div
              className="absolute inset-x-0 bottom-0 z-40 transition-opacity"
              style={{ top: "152px", backgroundColor: "rgba(0,0,0,0.35)" }}
              onClick={() => { setExpanded(false); setActiveSegment(null); }}
            />
          )}
        </div>

      </div>

    </div>
  );
}
