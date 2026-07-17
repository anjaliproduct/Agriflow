import { BarChart3, ChevronDown, Receipt, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "../../store/appStore";
import { formatCurrency, formatDate } from "../../utils/formatters";

const RATE = 2.4;
const COOP_FEE_RATE = 0.08;
const LOGISTICS = 180;
const QUALITY_ADJ = 35;

type Period = "week" | "month" | "quarter" | "all";

function getOrderFinancials(order: ReturnType<typeof useAppStore.getState>["orders"][number]) {
  const qty = order.items?.length ? order.items.reduce((s, i) => s + i.quantity, 0) : order.quantity;
  const gross = qty * RATE;
  const coopFee = gross * COOP_FEE_RATE;
  const logistics = ["New", "Under Review", "Allocated"].includes(order.status) ? 0 : LOGISTICS;
  const qualityAdj = ["Quality Verified", "Dispatched", "Delivered", "Settled"].includes(order.status) ? QUALITY_ADJ : 0;
  const netPayout = Math.max(gross - coopFee - logistics - qualityAdj, 0);
  const coopEarning = coopFee + qualityAdj;
  return { qty, gross, coopFee, logistics, qualityAdj, netPayout, coopEarning };
}

function invoicePaymentStatus(order: ReturnType<typeof useAppStore.getState>["orders"][number]) {
  if (order.paymentStatus === "Released" || order.paymentStatus === "Received") return "Paid";
  if (order.invoiceStatus === "Generated") return "Pending";
  if (!["New", "Under Review", "Allocated"].includes(order.status)) return "Overdue";
  return "Not due";
}

function farmerPayoutStatus(order: ReturnType<typeof useAppStore.getState>["orders"][number]) {
  if (order.status === "Settled" || order.paymentStatus === "Released") return "Paid";
  if (["Delivered", "Quality Verified", "Dispatched", "Collected", "Pickup Scheduled"].includes(order.status)) return "Pending";
  return "Not due";
}

function daysAgo(dateStr: string): number {
  const day = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((Date.now() - new Date(`${dateStr}T00:00:00`).getTime()) / day));
}

function isInPeriod(dateStr: string, period: Period): boolean {
  if (period === "all") return true;
  const date = new Date(`${dateStr}T00:00:00`).getTime();
  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;
  if (period === "week") return date >= now - 7 * day && date <= now + 7 * day;
  if (period === "month") return date >= now - 30 * day && date <= now + 30 * day;
  return date >= now - 90 * day && date <= now + 90 * day;
}

const cardShadow = { boxShadow: "0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)" };

function FilterDropdown<T extends string>({ value, options, onChange }: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center rounded-lg bg-slate-100 py-1.5 pl-2 pr-7 text-xs font-medium text-slate-700"
      >
        {current?.label}
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-[130px] overflow-hidden rounded-lg border border-slate-100 bg-white py-1" style={cardShadow}>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className="block w-full px-3 py-1.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Finance() {
  const allOrders = useAppStore((s) => s.orders);
  const farmers = useAppStore((s) => s.farmers);
  const [period, setPeriod] = useState<Period>("week");

  const orders = allOrders.filter((o) => isInPeriod(o.deliveryDate, period));

  const activeOrders = orders.filter((o) => !["New", "Under Review"].includes(o.status));
  const settledOrders = orders.filter((o) => ["Dispatched", "Delivered", "Settled"].includes(o.status) || o.paymentStatus === "Released");
  const deliveredOrders = orders.filter((o) => ["Dispatched", "Delivered", "Settled"].includes(o.status) || o.paymentStatus === "Released");

  const totalRevenue = deliveredOrders.reduce((s, o) => s + getOrderFinancials(o).gross, 0);
  const coopEarnings = settledOrders.reduce((s, o) => s + getOrderFinancials(o).coopEarning, 0);

  const pendingInvoices = activeOrders.filter((o) => { const s = invoicePaymentStatus(o); return s === "Overdue" || s === "Pending"; });
  const pendingInvoiceTotal = pendingInvoices.reduce((s, o) => s + getOrderFinancials(o).gross, 0);
  const pendingPayoutOrders = activeOrders.filter((o) => o.paymentStatus !== "Released" && ["Delivered", "Quality Verified", "Dispatched", "Collected", "Pickup Scheduled", "Allocated"].includes(o.status));
  const pendingPayoutTotal = pendingPayoutOrders.reduce((s, o) => s + getOrderFinancials(o).netPayout, 0);

  // Farmer payout aggregates
  const farmerPayouts = farmers.map((farmer) => {
    const allocs = allOrders.flatMap((o) =>
      o.allocation.filter((a) => a.farmerId === farmer.id).map((a) => ({ ...a, order: o }))
    );
    const earned = allocs.filter((a) => a.order.status === "Settled" || a.order.paymentStatus === "Released").reduce((s, a) => s + a.quantity * RATE * (1 - COOP_FEE_RATE), 0);
    const pendingAllocs = allocs.filter((a) => a.order.status !== "Settled" && a.order.paymentStatus !== "Released" && ["Delivered", "Dispatched", "Quality Verified", "Collected", "Pickup Scheduled", "Allocated"].includes(a.order.status));
    const pending = pendingAllocs.reduce((s, a) => s + a.quantity * RATE * (1 - COOP_FEE_RATE), 0);
    const nextRelease = allocs.find((a) => ["Delivered"].includes(a.order.status))?.order.deliveryDate;
    const status = pending === 0 ? "Settled" : nextRelease ? "To release" : "Pending";
    const earliestPending = [...pendingAllocs].sort((a, b) => a.order.deliveryDate.localeCompare(b.order.deliveryDate))[0];
    const pendingDescription = earliestPending ? `${earliestPending.order.id} · Due ${daysAgo(earliestPending.order.deliveryDate)} days ago` : "";
    return { farmer, earned, pending, nextRelease, status, pendingDescription };
  }).filter((f) => f.earned > 0 || f.pending > 0);

  const invoiceRows = activeOrders
    .slice(0, 7)
    .map((o) => ({ order: o, ...getOrderFinancials(o), status: invoicePaymentStatus(o) }));

  const [financeView, setFinanceView] = useState<"buyer" | "farmer">("farmer");
  const [invoiceFilter, setInvoiceFilter] = useState<"all" | "Overdue" | "Paid" | "Not due">("Overdue");
  const [payoutFilter, setPayoutFilter] = useState<"To release" | "Settled" | "Pending">("Pending");

  const filteredInvoiceRows = invoiceRows.filter((r) => invoiceFilter === "all" || r.status === invoiceFilter);
  const filteredFarmerPayouts = farmerPayouts.filter((f) => f.status === payoutFilter);

  const farmerRows = orders.flatMap((order) =>
    order.allocation.map((alloc) => {
      const gross = alloc.quantity * RATE;
      const coopFee = gross * COOP_FEE_RATE;
      const netPayout = Math.max(gross - coopFee, 0);
      return { order, alloc, gross, coopFee, netPayout, status: farmerPayoutStatus(order) };
    })
  );

  const metrics = [
    { icon: TrendingUp, iconBg: "#99C30C26", iconColor: "#546B07", label: "Total Revenue",        value: formatCurrency(totalRevenue),        sub: `${deliveredOrders.length} orders fulfilled` },
    { icon: Receipt,    iconBg: "#FE8B0226", iconColor: "#8C4C01", label: "Outstanding Invoices", value: String(pendingInvoices.length),       sub: `${formatCurrency(pendingInvoiceTotal)} unpaid or overdue` },
    { icon: Wallet,     iconBg: "#2563EB26", iconColor: "#1E3A8A", label: "Farmer Payouts Due",   value: formatCurrency(pendingPayoutTotal),   sub: `${pendingPayoutOrders.length} pending settlement` },
    { icon: BarChart3,  iconBg: "#EC489926", iconColor: "#9D174D", label: "Co-op Earnings",       value: formatCurrency(coopEarnings),         sub: "fees & quality adjustments" },
  ];

  const periods: { label: string; value: Period }[] = [
    { label: "This week", value: "week" },
    { label: "This month", value: "month" },
    { label: "This quarter", value: "quarter" },
    { label: "All time", value: "all" },
  ];

  return (
    <div className="-m-4 sm:-m-6 min-h-full bg-white p-4 sm:p-6">
      <div className="space-y-5">

        {/* Header + period filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Finance</h1>
            <p className="mt-0.5 text-sm text-slate-500">Track invoices, farmer payouts, and co-op earnings</p>
          </div>
          {/* Period filter pills */}
          <div className="flex items-center gap-1 rounded-xl bg-white p-1" style={cardShadow}>
            {periods.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className="rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors"
                style={period === p.value
                  ? { backgroundColor: "#2F7D51", color: "#fff" }
                  : { color: "#64748b" }
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metric cards — no green wrapper, direct on #F7F7F7 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {metrics.map(({ icon: Icon, iconBg, iconColor, label, value, sub }) => (
            <div key={label} className="rounded-2xl bg-white px-5 py-5" style={cardShadow}>
              <div className="flex items-center gap-2">
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
            </div>
          ))}
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Buyer invoices — transaction list style */}
          <div className="rounded-2xl bg-white" style={cardShadow}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <p className="text-sm font-semibold text-slate-900">Buyer Invoices</p>
              <FilterDropdown
                value={invoiceFilter}
                onChange={setInvoiceFilter}
                options={[
                  { label: "All statuses", value: "all" },
                  { label: "Overdue", value: "Overdue" },
                  { label: "Received", value: "Paid" },
                  { label: "Not due", value: "Not due" },
                ]}
              />
            </div>
            <div className="h-[272px] overflow-y-auto">
              {filteredInvoiceRows.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-slate-400">No invoices to show.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredInvoiceRows.map(({ order, gross, status }) => {
                    const isPaid = status === "Paid";
                    return (
                      <div key={order.id} className="flex items-center justify-between px-6 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                            {order.buyer.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{order.buyer}</p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {order.id} · Due {daysAgo(order.deliveryDate)} days ago
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <p className="text-sm font-semibold text-slate-900">{formatCurrency(gross)}</p>
                          {isPaid ? (
                            <Link to={`/manager/orders/${order.id}`} className="text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline">
                              View invoice
                            </Link>
                          ) : (
                            <Link
                              to={`/manager/orders/${order.id}`}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              {status === "Overdue" ? "Remind" : "Create Invoice"}
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Farmer payouts — scheduled payouts style */}
          <div className="rounded-2xl bg-white" style={cardShadow}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <p className="text-sm font-semibold text-slate-900">Farmer Payouts</p>
              <FilterDropdown
                value={payoutFilter}
                onChange={setPayoutFilter}
                options={[
                  { label: "To release", value: "To release" },
                  { label: "Settled", value: "Settled" },
                  { label: "Pending", value: "Pending" },
                ]}
              />
            </div>
            <div className="h-[272px] overflow-y-auto">
              {filteredFarmerPayouts.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-slate-400">No payouts to show.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredFarmerPayouts.map(({ farmer, earned, pending, nextRelease, status, pendingDescription }) => (
                    <div key={farmer.id} className="flex items-center justify-between px-6 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {farmer.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{farmer.name}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {status === "To release" ? `Releases ${formatDate(nextRelease!)}` : status === "Pending" ? pendingDescription : status}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          {pending > 0 && <p className="text-sm font-semibold text-slate-900">{formatCurrency(pending)}</p>}
                          {earned > 0 && <p className="text-xs text-slate-400">{formatCurrency(earned)} settled</p>}
                        </div>
                        {status === "Pending" && (
                          <Link
                            to="/manager/farmers"
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            Release
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Order financials table */}
        <div className="rounded-2xl bg-white overflow-hidden" style={cardShadow}>
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <p className="text-sm font-semibold text-slate-900">Order Financials</p>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(["farmer", "buyer"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFinanceView(v)}
                  className="rounded-md px-3 py-1 text-xs font-medium transition-colors"
                  style={financeView === v
                    ? { backgroundColor: "#2F7D51", color: "#fff" }
                    : { color: "#64748b" }
                  }
                >
                  {v === "farmer" ? "Farmer" : "Buyer"}
                </button>
              ))}
            </div>
          </div>

          {financeView === "buyer" ? (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50">
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-slate-400">Order</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Buyer</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Revenue</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Co-op Fee</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Logistics</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Net Payout</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-slate-400">Invoice</th>
                    <th className="px-6 py-2.5 text-center text-xs font-medium text-slate-400">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const { gross, coopFee, logistics, netPayout } = getOrderFinancials(order);
                    const pymtStatus = invoicePaymentStatus(order);
                    const isSettled = pymtStatus === "Paid";
                    const isOverdue = pymtStatus === "Overdue";
                    return (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3.5">
                          <Link className="text-sm font-medium text-slate-900 hover:underline" to={`/manager/orders/${order.id}`}>{order.id}</Link>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-600">{order.buyer}</td>
                        <td className="px-4 py-3.5 text-right text-sm font-medium text-slate-900">{formatCurrency(gross)}</td>
                        <td className="px-4 py-3.5 text-right text-sm text-slate-400">−{formatCurrency(coopFee)}</td>
                        <td className="px-4 py-3.5 text-right text-sm text-slate-400">{logistics > 0 ? `−${formatCurrency(logistics)}` : "—"}</td>
                        <td className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900">{formatCurrency(netPayout)}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-700">
                            <span className={`h-1.5 w-1.5 rounded-full ${order.invoiceStatus === "Generated" ? "bg-green-500" : "bg-slate-400"}`} />
                            {order.invoiceStatus === "Generated" ? "Sent" : "Draft"}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-700">
                            <span className={`h-1.5 w-1.5 rounded-full ${isSettled ? "bg-green-500" : isOverdue ? "bg-red-500" : pymtStatus === "Pending" ? "bg-amber-400" : "bg-slate-400"}`} />
                            {isSettled ? "Received" : pymtStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
                <p className="text-xs text-slate-400">Net payout after co-op fee, logistics, and quality adjustments</p>
                <p className="text-xs text-slate-400">{orders.length} orders</p>
              </div>
            </>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50">
                    <th className="px-6 py-2.5 text-left text-xs font-medium text-slate-400">Order</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-400">Farmer</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Quantity</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Gross</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Co-op Fee</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-400">Net Payout</th>
                    <th className="px-6 py-2.5 text-center text-xs font-medium text-slate-400">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {farmerRows.map(({ order, alloc, gross, coopFee, netPayout, status }) => {
                    const isSettled = status === "Paid";
                    return (
                      <tr key={`${order.id}-${alloc.farmerId}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3.5">
                          <Link className="text-sm font-medium text-slate-900 hover:underline" to={`/manager/orders/${order.id}`}>{order.id}</Link>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-600">{alloc.farmerName}</td>
                        <td className="px-4 py-3.5 text-right text-sm text-slate-600">{alloc.quantity.toLocaleString()} kg</td>
                        <td className="px-4 py-3.5 text-right text-sm font-medium text-slate-900">{formatCurrency(gross)}</td>
                        <td className="px-4 py-3.5 text-right text-sm text-slate-400">−{formatCurrency(coopFee)}</td>
                        <td className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900">{formatCurrency(netPayout)}</td>
                        <td className="px-6 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-700">
                            <span className={`h-1.5 w-1.5 rounded-full ${isSettled ? "bg-green-500" : status === "Pending" ? "bg-amber-400" : "bg-slate-400"}`} />
                            {isSettled ? "Received" : status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
                <p className="text-xs text-slate-400">Net payout after co-op fee</p>
                <p className="text-xs text-slate-400">{farmerRows.length} allocations</p>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
