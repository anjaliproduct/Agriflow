import { ArrowLeft, Camera, CheckCircle2, ChevronRight, Mic, PenLine } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";
import { useAppStore } from "../../store/appStore";
import { formatDate } from "../../utils/formatters";
import type { Grade } from "../../types";

const FARMER_ID = "f1";

const freshnessStyles: Record<string, string> = {
  Fresh: "bg-green-50 text-green-700",
  Good:  "bg-blue-50 text-blue-600",
  Watch: "bg-amber-50 text-amber-600",
  Stale: "bg-red-50 text-red-500",
};

const produceEmoji: Record<string, string> = {
  Tomatoes: "🍅", Onions: "🧅", Lettuce: "🥬", Spinach: "🥬",
  Carrots: "🥕", Potatoes: "🥔", Corn: "🌽", Peppers: "🌶️",
  Capsicum: "🫑", Cabbage: "🥬", Broccoli: "🥦", Cucumber: "🥒",
};

const mockInventory = [
  { id: "m1", farmerId: FARMER_ID, produce: "Carrots",  category: "Root crops",   unit: "kg", declaredQuantity: 420, verifiedQuantity: 0, reservedQuantity: 120, harvestDate: "2026-07-10", estimatedGrade: "A" as Grade, freshnessStatus: "Fresh", qualityEstimate: "Washed bunches",  lastUpdated: "Today" },
  { id: "m2", farmerId: FARMER_ID, produce: "Capsicum", category: "Vegetables",   unit: "kg", declaredQuantity: 180, verifiedQuantity: 0, reservedQuantity: 0,   harvestDate: "2026-07-12", estimatedGrade: "B" as Grade, freshnessStatus: "Good",  qualityEstimate: "Mixed sizing",    lastUpdated: "1 day ago" },
  { id: "m3", farmerId: FARMER_ID, produce: "Cabbage",  category: "Leafy greens", unit: "kg", declaredQuantity: 260, verifiedQuantity: 0, reservedQuantity: 80,  harvestDate: "2026-07-08", estimatedGrade: "A" as Grade, freshnessStatus: "Watch", qualityEstimate: "Needs attention", lastUpdated: "3 days ago" },
  { id: "m4", farmerId: FARMER_ID, produce: "Broccoli", category: "Vegetables",   unit: "kg", declaredQuantity: 140, verifiedQuantity: 0, reservedQuantity: 40,  harvestDate: "2026-07-14", estimatedGrade: "B" as Grade, freshnessStatus: "Good",  qualityEstimate: "Firm heads",      lastUpdated: "2 days ago" },
  { id: "m5", farmerId: FARMER_ID, produce: "Cucumber", category: "Vegetables",   unit: "kg", declaredQuantity: 310, verifiedQuantity: 0, reservedQuantity: 100, harvestDate: "2026-07-09", estimatedGrade: "A" as Grade, freshnessStatus: "Fresh", qualityEstimate: "Uniform sizing",  lastUpdated: "Today" },
];

// ── Crop picker shown when no itemId ──
function CropPicker({ farmerInventory, from }: { farmerInventory: typeof mockInventory; from: string }) {
  return (
    <div className="-m-4 sm:-m-6 flex flex-col overflow-hidden" style={{ height: "100dvh" }}>
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex h-11 items-center gap-2 sm:gap-3 px-3 sm:px-4">
          <Link to={from} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={14} />
            <span>Back</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-900">Update Inventory</span>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-[860px] space-y-4 px-4 sm:px-6 py-5 sm:py-6">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-950">Update Inventory</h1>
            <p className="mt-1 text-sm text-slate-500">Select a crop to update its committed quantity and details.</p>
          </div>
          <div
            className="overflow-hidden rounded-2xl border border-slate-100 bg-white divide-y divide-slate-100"
            style={{ boxShadow: "0 2px 40px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.03)" }}
          >
            {farmerInventory.map((row) => (
              <Link
                key={row.id}
                to={`/farmer/inventory/update/${row.id}`}
                state={{ from }}
                className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl" style={{ backgroundColor: "#FAF8F4" }}>
                  {produceEmoji[row.produce] ?? "🌿"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{row.produce}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {row.declaredQuantity} kg committed · {row.declaredQuantity - row.reservedQuantity} kg available
                  </p>
                </div>
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${freshnessStyles[row.freshnessStatus] ?? "bg-slate-100 text-slate-500"}`}>
                  {row.freshnessStatus}
                </span>
                <ChevronRight size={16} className="shrink-0 text-slate-300" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Update form ──
function UpdateForm({ item, from }: { item: typeof mockInventory[0]; from: string }) {
  const updateInventory = useAppStore((s) => s.updateInventory);
  const navigate = useNavigate();

  const [mode, setMode] = useState<"image" | "voice" | "manual" | null>(null);

  const [imageEstimate, setImageEstimate] = useState("");
  const [imagesUploaded, setImagesUploaded] = useState(false);

  const mockImages = [
    { label: "Front", src: "/tomato-front.png" },
    { label: "Side",  src: "/tomato-side.png" },
    { label: "Top",   src: "/tomato-top.png" },
  ];

  const [quantity, setQuantity] = useState(item.declaredQuantity);
  const [harvestDate, setHarvestDate] = useState(item.harvestDate);
  const [grade, setGrade] = useState<Grade>(item.estimatedGrade as Grade);
  const [qualityNotes, setQualityNotes] = useState(item.qualityEstimate);

  const inputCls = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#99C30C] focus:ring-2 focus:ring-[#99C30C]/20 transition-all";
  const labelCls = "text-xs font-semibold uppercase tracking-wide text-slate-400";

  const methods = [
    { key: "image" as const, label: "Image Capture", icon: Camera, description: "Upload photos for quantity & grade." },
    { key: "voice" as const,  label: "Voice Capture",  icon: Mic,    description: "Speak your quantity and grade aloud." },
    { key: "manual" as const, label: "Enter Manually", icon: PenLine, description: "Fill in details using the form." },
  ];

  return (
    <div className="-m-4 sm:-m-6 flex flex-col overflow-hidden" style={{ height: "100dvh" }}>
      {/* Header */}
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex h-11 items-center gap-2 sm:gap-3 px-3 sm:px-4">
          <Link to={from} state={{ from }} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <span className="text-slate-300">/</span>
          <Link
            to="/farmer/inventory/update"
            state={{ from }}
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            Update Inventory
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-900 truncate">{item.produce}</span>
          <div className="flex-1" />
          <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${freshnessStyles[item.freshnessStatus] ?? "bg-slate-100 text-slate-500"}`}>
            {item.freshnessStatus}
          </span>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-[860px] space-y-4 sm:space-y-5 px-4 sm:px-6 py-5 sm:py-6">

          {/* Produce hero card */}
          <div
            className="overflow-hidden rounded-2xl border border-slate-100 bg-white"
            style={{ boxShadow: "0 2px 40px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.03)" }}
          >
            <div className="flex items-start gap-4 sm:gap-5 p-5">
              {/* Emoji icon holder */}
              <div
                className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-xl text-3xl sm:text-4xl"
                style={{ backgroundColor: "#F2FFEF" }}
              >
                {produceEmoji[item.produce] ?? "🌿"}
              </div>
              {/* Name + category + freshness */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-950">{item.produce}</h1>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${freshnessStyles[item.freshnessStatus] ?? "bg-slate-100 text-slate-500"}`}>
                    {item.freshnessStatus}
                  </span>
                </div>
                {/* Meta stats */}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Committed</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">{item.declaredQuantity} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Available</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">{item.declaredQuantity - item.reservedQuantity} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Grade</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">Grade {item.estimatedGrade}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Last Updated</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">{item.lastUpdated}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs sm:text-sm text-amber-800">
            Committed quantity and grade will be verified at collection. Enter your best estimate.
          </div>

          {/* Entry method selector */}
          <div
            className="overflow-hidden rounded-2xl border border-slate-100 bg-white"
            style={{ boxShadow: "0 2px 40px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.03)" }}
          >
            <p className="border-b border-slate-100 px-4 sm:px-5 py-3 text-sm font-semibold text-slate-950">Select a method to update inventory</p>
            {/* Three method options */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
              {methods.map(({ key, label, icon: Icon, description }) => {
                const active = mode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className="relative flex flex-col items-start gap-2.5 px-4 sm:px-5 py-4 sm:py-5 text-left transition-colors"
                    style={{ backgroundColor: active ? "#F7FFF3" : "transparent" }}
                    onClick={() => setMode(active ? null : key)}
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: active ? "#E6FFD9" : "#F2FFEF" }}
                    >
                      <Icon size={17} style={{ color: "#4A7C20" }} />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold" style={{ color: active ? "#324D1D" : "#0f172a" }}>{label}</p>
                      <p className="mt-0.5 text-xs text-slate-400 hidden sm:block">{description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active mode content */}
            <div className={mode ? "min-h-[280px] flex flex-col justify-center" : ""}>
            {mode === "image" && (
              <div className="px-4 sm:px-5 py-5 space-y-4">
                {!imagesUploaded ? (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: "#F2FFEF" }}>
                      <Camera size={26} style={{ color: "#4A7C20" }} />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Upload photos of your produce</p>
                    <p className="text-xs text-slate-400 max-w-xs">Add front, side, and top views to help estimate quantity and grade.</p>
                    <button
                      type="button"
                      className="mt-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#324D1D" }}
                      onClick={() => setImagesUploaded(true)}
                    >
                      Upload image
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Mock image previews */}
                    <div className="flex gap-3">
                      {mockImages.map(({ label, src }) => (
                        <div key={label} className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                          <img
                            src={src}
                            alt={`${item.produce} — ${label} view`}
                            className="w-full rounded-lg object-cover"
                            style={{ height: "200px" }}
                          />
                          <p className="mt-2 pb-0.5 flex items-center justify-center gap-1 text-xs font-medium text-slate-500">
                            <CheckCircle2 size={11} style={{ color: "#99C30C" }} />
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Review section */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-950">Review</p>
                      <div className="flex divide-x divide-slate-100 px-0">
                        <div className="flex-1 px-4 py-3">
                          <p className="text-xs font-medium text-slate-500">Estimated range</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{Math.round(item.declaredQuantity * 0.88)}–{Math.round(item.declaredQuantity * 1.12)} kg</p>
                        </div>
                        <div className="flex-1 px-4 py-3">
                          <p className="text-xs font-medium text-slate-500">AI confidence</p>
                          <p className="mt-1 text-sm font-semibold" style={{ color: "#324D1D" }}>High — 87%</p>
                        </div>
                        <div className="flex-1 px-4 py-3">
                          <p className="text-xs font-medium text-slate-500">Current stock</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{item.declaredQuantity - item.reservedQuantity} kg</p>
                        </div>
                        <div className="flex-1 px-4 py-3">
                          <p className="text-xs font-medium text-slate-500">Updated stock</p>
                          <p className="mt-1 text-sm font-semibold" style={{ color: "#324D1D" }}>{item.declaredQuantity} kg</p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#324D1D" }}
                      onClick={() => {
                        updateInventory(item.id, Math.round(item.declaredQuantity * 1.0), item.harvestDate, item.estimatedGrade as Grade);
                        navigate(from);
                      }}
                    >
                      <CheckCircle2 size={16} /> Submit Update
                    </button>
                  </>
                )}
              </div>
            )}

            {mode === "voice" && (
              <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: "#F2FFEF" }}>
                  <Mic size={26} style={{ color: "#4A7C20" }} />
                </div>
                <p className="text-sm font-semibold text-slate-900">Tap to speak</p>
                <p className="text-xs text-slate-400 max-w-xs">Say the quantity and grade — e.g. "350 kilograms, Grade A".</p>
                <button
                  type="button"
                  className="mt-2 flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#324D1D" }}
                >
                  <Mic size={14} /> Start speaking
                </button>
              </div>
            )}

            {mode === "manual" && (
              <>
                <div className="space-y-4 sm:space-y-5 px-4 sm:px-5 py-4 sm:py-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <label className="block">
                      <span className={labelCls}>Committed quantity (kg)</span>
                      <input className={inputCls} type="number" min={0} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
                    </label>
                    <label className="block">
                      <span className={labelCls}>Harvest / availability date</span>
                      <input className={inputCls} type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <label className="block">
                      <span className={labelCls}>Self-assessed grade</span>
                      <select className={inputCls} value={grade} onChange={(e) => setGrade(e.target.value as Grade)}>
                        <option value="A">Grade A — Premium</option>
                        <option value="B">Grade B — Standard</option>
                        <option value="C">Grade C — Below standard</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className={labelCls}>Quality notes</span>
                      <input className={inputCls} type="text" placeholder="e.g. Firm, uniform red" value={qualityNotes} onChange={(e) => setQualityNotes(e.target.value)} />
                    </label>
                  </div>
                </div>
                <div className="border-t border-slate-100 px-4 sm:px-5 py-4">
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#324D1D" }}
                    onClick={() => {
                      updateInventory(item.id, quantity, harvestDate, grade);
                      navigate(from);
                    }}
                  >
                    <CheckCircle2 size={16} /> Submit Update
                  </button>
                </div>
              </>
            )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ──
export default function InventoryUpdate() {
  const { itemId } = useParams();
  const allInventory = useAppStore((s) => s.inventory);
  const location = useLocation();
  const from = (location.state as any)?.from ?? "/farmer/inventory";

  const farmerInventory = allInventory.filter((i) => i.farmerId === FARMER_ID);
  const pickerList = [
    ...farmerInventory.map((inv) => ({
      id: inv.id, farmerId: inv.farmerId, produce: inv.produce, category: (inv as any).category ?? "Vegetables",
      unit: "kg", declaredQuantity: inv.declaredQuantity, verifiedQuantity: inv.verifiedQuantity ?? 0,
      reservedQuantity: inv.reservedQuantity, harvestDate: inv.harvestDate ?? "",
      estimatedGrade: inv.estimatedGrade, freshnessStatus: inv.freshnessStatus,
      qualityEstimate: (inv as any).qualityEstimate ?? "", lastUpdated: (inv as any).lastUpdated ?? "",
    })),
    ...mockInventory,
  ];

  if (!itemId) {
    return <CropPicker farmerInventory={pickerList} from={from} />;
  }

  const item = pickerList.find((i) => i.id === itemId) ?? null;

  if (!item) return <Navigate to="/farmer/inventory" replace />;

  return <UpdateForm item={item} from={from} />;
}
