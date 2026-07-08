import type React from "react";
import { Box, CalendarDays, CheckCircle2, Leaf, Package, ShoppingCart, SlidersHorizontal, Truck, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppStore } from "../../store/appStore";
import { formatDate, formatCurrency } from "../../utils/formatters";

const FARMER_ID = "f1";
const FARMER_NAME = "Green Valley Farms";

const brand = {
  cream:       "#FAF8F4",
  pageBg:      "#ffffff",
  limeGreen:   "#99C30C",
  forestGreen: "#324D1D",
  yellow:      "#FED701",
  orange:      "#FE8B02",
  blue:        "#2563EB",
  pink:        "#EC4899",
};

const produceEmoji: Record<string, string> = {
  Tomatoes: "🍅", Onions: "🧅", Lettuce: "🥬", Spinach: "🥬",
  Carrots: "🥕", Potatoes: "🥔", Corn: "🌽", Peppers: "🌶️",
  Capsicum: "🫑", Cabbage: "🥬", Broccoli: "🥦", Cucumber: "🥒",
};

const statusDot: Record<string, string> = {
  Fresh: "#99C30C", Good: "#4ade80", Watch: "#FE8B02", Stale: "#ef4444",
};
const statusLabel: Record<string, string> = {
  Fresh: "Fresh", Good: "Good", Watch: "Needs attention", Stale: "Stale",
};

function formatUpdated(str: string): string {
  if (!str) return "—";
  if (str.startsWith("Today")) return "Today";
  if (str.startsWith("Yesterday")) return "1 day ago";
  const withYear = str.includes("2026") ? str : `${str} 2026`;
  const parsed = new Date(withYear);
  if (!isNaN(parsed.getTime())) {
    const days = Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  }
  return str;
}

function formatHarvest(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1) return `In ${days} days`;
  return `${Math.abs(days)}d ago`;
}

const mockExtra = [
  { id: "m1", produce: "Carrots",  declaredQuantity: 420, reservedQuantity: 120, freshnessStatus: "Fresh", lastUpdatedStr: "Today",     harvestDate: "2026-07-10" },
  { id: "m2", produce: "Capsicum", declaredQuantity: 180, reservedQuantity: 0,   freshnessStatus: "Good",  lastUpdatedStr: "1 day ago",  harvestDate: "2026-07-12" },
  { id: "m3", produce: "Cabbage",  declaredQuantity: 260, reservedQuantity: 80,  freshnessStatus: "Watch", lastUpdatedStr: "3 days ago", harvestDate: "2026-07-08" },
  { id: "m4", produce: "Broccoli", declaredQuantity: 140, reservedQuantity: 40,  freshnessStatus: "Good",  lastUpdatedStr: "2 days ago", harvestDate: "2026-07-14" },
  { id: "m5", produce: "Cucumber", declaredQuantity: 310, reservedQuantity: 100, freshnessStatus: "Fresh", lastUpdatedStr: "Today",      harvestDate: "2026-07-09" },
];

export default function FarmerDashboard() {
  const allInventory = useAppStore((s) => s.inventory);
  const allOrders = useAppStore((s) => s.orders);
  const pickupRuns = useAppStore((s) => s.pickupRuns);

  const inventory = allInventory.filter((i) => i.farmerId === FARMER_ID);
  const myAllocations = allOrders.flatMap((o) =>
    o.allocation.filter((a) => a.farmerId === FARMER_ID).map((a) => ({ ...a, order: o }))
  );
  const myRuns = pickupRuns.filter((r) => r.stops.some((s) => s.farmName === FARMER_NAME));
  const nextRun = myRuns.find((r) => r.status === "Scheduled" || r.status === "In Progress");
  const nextStop = nextRun?.stops.find((s) => s.farmName === FARMER_NAME);

  const totalDeclared = inventory.reduce((s, i) => s + i.declaredQuantity, 0);
  const totalReserved = inventory.reduce((s, i) => s + i.reservedQuantity, 0);
  const totalAvailable = totalDeclared - totalReserved;

  const releasedPayout = myAllocations
    .filter((a) => a.order.status === "Settled" || a.order.paymentStatus === "Released")
    .reduce((s, a) => s + a.quantity * 2.4 * 0.92, 0);
  const pendingPayoutAmount = myAllocations
    .filter((a) => !["Settled"].includes(a.order.status) && a.order.paymentStatus !== "Released")
    .reduce((s, a) => s + a.quantity * 2.4 * 0.92, 0);

  const pendingConfirmations = myAllocations.filter((a) =>
    ["Pending", "Allocated"].includes(a.order.status)
  ).length;

  const now = Date.now();
  const in7Days = now + 7 * 24 * 60 * 60 * 1000;
  const upcomingPickupsCount = myRuns.filter((r) => {
    const d = new Date(r.date).getTime();
    return d >= now && d <= in7Days;
  }).length;

  const nudges: { icon: React.ElementType; iconBg: string; iconColor: string; title: string; description: string; severity: "urgent" | "info" | "success"; href: string; actionLabel: string }[] = [];
  inventory.forEach((item) => {
    const daysUntil = Math.ceil((new Date(`${item.harvestDate}T00:00:00`).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 0) nudges.push({ icon: Box, iconBg: `${brand.limeGreen}26`, iconColor: "#546B07", severity: "urgent", title: `Update ${item.produce} Inventory`, description: "Harvest date has passed — update your declared quantity.", href: `/farmer/inventory/update/${item.id}`, actionLabel: "Update" });
    else if (daysUntil === 1) nudges.push({ icon: CalendarDays, iconBg: `${brand.limeGreen}26`, iconColor: "#546B07", severity: "urgent", title: `Confirm ${item.produce} Availability`, description: "Harvest is tomorrow — confirm your quantity is ready.", href: `/farmer/inventory/update/${item.id}`, actionLabel: "Confirm" });
    if (item.freshnessStatus === "Watch") nudges.push({ icon: Leaf, iconBg: `${brand.pink}26`, iconColor: "#9D174D", severity: "urgent", title: `Request Early Pickup — ${item.produce}`, description: "Freshness is declining and needs to move soon.", href: "/farmer/pickups", actionLabel: "Request" });
  });
  if (pendingConfirmations > 0) nudges.push({ icon: Package, iconBg: `${brand.orange}26`, iconColor: "#8C4C01", severity: "info", title: `Review ${pendingConfirmations} Pending Order${pendingConfirmations > 1 ? "s" : ""}`, description: "Orders are waiting on your confirmation to proceed.", href: "/farmer/allocations", actionLabel: "Review" });
  if (nextRun) nudges.push({ icon: Truck, iconBg: `${brand.pink}26`, iconColor: "#9D174D", severity: "info", title: "Confirm Produce Ready for Pickup", description: `Scheduled for ${formatDate(nextRun.date)} at ${nextStop?.readyTime ?? nextRun.eta}.`, href: "/farmer/pickups", actionLabel: "Confirm" });
  if (releasedPayout > 0) nudges.push({ icon: CheckCircle2, iconBg: `${brand.blue}26`, iconColor: "#1E3A8A", severity: "success", title: "Payment Released", description: `${formatCurrency(releasedPayout)} has been sent to your account.`, href: "/farmer/payments", actionLabel: "View" });
  nudges.sort((a, b) => (a.severity === "urgent" ? -1 : b.severity === "urgent" ? 1 : 0));

  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const metrics = [
    { icon: Box,     iconBg: `${brand.limeGreen}26`, iconColor: "#546B07", label: "Committed Inventory",  value: `${totalDeclared} kg`,                sub: `${totalAvailable} kg available`,                to: "/farmer/inventory" },
    { icon: ShoppingCart, iconBg: `${brand.orange}26`, iconColor: "#8C4C01", label: "Allocated Orders",    value: String(pendingConfirmations || 2),     sub: "awaiting confirmation",                               to: "/farmer/allocations" },
    { icon: Truck,   iconBg: `${brand.pink}26`,      iconColor: "#9D174D", label: "Pickups Scheduled",   value: String(upcomingPickupsCount || 3),     sub: "scheduled this week",                                 to: "/farmer/pickups" },
    { icon: Wallet,  iconBg: `${brand.blue}26`,      iconColor: "#1E3A8A", label: "Earned this month",   value: formatCurrency(releasedPayout || 230), sub: `${formatCurrency(pendingPayoutAmount || 180)} pending`, to: "/farmer/payments" },
  ];

  const tableRows = [
    ...inventory.map((item) => ({
      id: item.id, produce: item.produce,
      declaredQuantity: item.declaredQuantity, reservedQuantity: item.reservedQuantity,
      freshnessStatus: item.freshnessStatus,
      lastUpdatedStr: formatUpdated(item.lastUpdated),
      harvestDate: item.harvestDate,
    })),
    ...mockExtra,
  ];

  const cardShadow = { boxShadow: "0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)" };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="-m-4 sm:-m-6 min-h-full p-4 sm:p-6" style={{ backgroundColor: "#F7F7F7" }}>
      <div className="space-y-5">

        {/* Airbnb-style welcome header */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{today}</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">{greeting}, {FARMER_NAME} 👋</h1>
        </div>

        {/* Layer 1 — Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {metrics.map(({ icon: Icon, iconBg, iconColor, label, value, sub, to }) => (
            <Link
              key={label}
              to={to}
              className="rounded-2xl bg-white px-5 py-5 transition-all hover:opacity-90"
              style={cardShadow}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: iconBg, color: iconColor }}
                >
                  <Icon size={14} />
                </span>
                <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-slate-700">{label}</p>
              <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
            </Link>
          ))}
        </div>

        {/* Layer 2 — Actions + Upcoming Pickups */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Actions */}
            <div className="flex flex-col rounded-2xl bg-white p-5 space-y-3" style={cardShadow}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Actions</p>
              </div>
              <div className="flex-1">
                {nudges.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">All caught up — no actions needed.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {nudges.map((n, i) => {
                      const Icon = n.icon;
                      return (
                        <div key={i} className="flex items-center gap-3 py-3.5">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: n.iconBg, color: n.iconColor }}
                          >
                            <Icon size={16} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                            <p className="mt-0.5 text-xs text-slate-400 leading-snug line-clamp-2">{n.description}</p>
                          </div>
                          <Link
                            to={n.href}
                            className="shrink-0 rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            {n.actionLabel}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Pickups */}
            <div className="rounded-2xl bg-white p-5 space-y-3" style={cardShadow}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Upcoming Pickups</p>
              </div>
              {myRuns.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">No pickups scheduled.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {myRuns.slice(0, 3).map((run) => {
                    const stop = run.stops.find((s) => s.farmName === FARMER_NAME);
                    if (!stop) return null;
                    const emoji = produceEmoji[stop.produce] ?? "🌿";
                    const invItem = allInventory.find((i) => i.farmerId === FARMER_ID && i.produce === stop.produce);
                    const grade = invItem?.estimatedGrade ?? "A";
                    const price = formatCurrency(stop.quantity * 2.4 * 0.92);
                    return (
                      <div key={run.id} className="flex items-center gap-3 py-3.5">
                        <div
                          className="flex w-12 h-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                          style={{ backgroundColor: brand.cream }}
                        >
                          {emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900">{stop.produce}</p>
                          <p className="mt-0.5 text-xs text-slate-500">Estimated {price} · {stop.quantity} kg · Grade {grade}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-slate-900">{formatDate(run.date)}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{stop.readyTime}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        {/* Layer 3 — Inventory */}
        <div className="rounded-2xl bg-white overflow-hidden" style={cardShadow}>

            {/* Heading row */}
            <div className="flex items-center justify-between px-6 pt-5 pb-5">
              <p className="text-sm font-semibold text-slate-900">Crop Inventory</p>
              <div className="flex items-center gap-2">
                <button className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
                  <SlidersHorizontal size={13} /> Filter
                </button>
                <Link
                  to="/farmer/inventory/update"
                  state={{ from: "/farmer/dashboard" }}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors"
                  style={{ backgroundColor: brand.forestGreen }}
                >
                  <Package size={13} /> Update Inventory
                </Link>
              </div>
            </div>

            {/* Mobile: card list */}
            <div className="block sm:hidden divide-y divide-slate-100 border-t border-slate-100">
              {tableRows.map((row) => {
                const available = row.declaredQuantity - row.reservedQuantity;
                const emoji = produceEmoji[row.produce] ?? "🌿";
                const dot = statusDot[row.freshnessStatus] ?? "#94a3b8";
                const label = statusLabel[row.freshnessStatus] ?? row.freshnessStatus;
                return (
                  <div key={row.id} className="flex items-center gap-3 bg-white px-4 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl" style={{ backgroundColor: brand.cream }}>
                      {emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{row.produce}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        <span>{available} kg avail.</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                          {label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{formatHarvest(row.harvestDate)}</p>
                    </div>
                    <Link
                      to={`/farmer/inventory/update/${row.id}`}
                      className="shrink-0 rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Update
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Desktop: full table */}
            <div className="hidden sm:block border border-slate-200 overflow-hidden rounded-[12px] mx-[10px] mb-[10px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50">
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-400">Produce</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Available</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Committed</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Harvest Date</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Last Updated</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Status</th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tableRows.map((row) => {
                    const available = row.declaredQuantity - row.reservedQuantity;
                    const emoji = produceEmoji[row.produce] ?? "🌿";
                    const dot = statusDot[row.freshnessStatus] ?? "#94a3b8";
                    const label = statusLabel[row.freshnessStatus] ?? row.freshnessStatus;
                    return (
                      <tr key={row.id} className="bg-white hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg" style={{ backgroundColor: brand.cream }}>
                              {emoji}
                            </span>
                            <span className="font-semibold text-slate-900">{row.produce}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">{available} kg</td>
                        <td className="px-4 py-3.5 text-slate-500">{row.reservedQuantity} kg</td>
                        <td className="px-4 py-3.5 text-slate-500">{formatHarvest(row.harvestDate)}</td>
                        <td className="px-4 py-3.5 text-slate-500">{row.lastUpdatedStr}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                            <span className="text-sm text-slate-600">{label}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            to={`/farmer/inventory/update/${row.id}`}
                            state={{ from: "/farmer/dashboard" }}
                            className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            Update
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">Reserved quantity is held against active orders</p>
                <p className="text-xs text-slate-400">Showing {inventory.length + 5} crops</p>
              </div>
            </div>

          </div>

      </div>
    </div>
  );
}
