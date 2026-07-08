import { BarChart3, FileText, Receipt, TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";
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
  if (["Delivered", "Settled"].includes(order.status) && order.invoiceStatus === "Generated") return "Pending";
  if (["Delivered", "Settled"].includes(order.status)) return "Overdue";
  return "Not due";
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

export default function Finance() {
  const allOrders = useAppStore((s) => s.orders);
  const farmers = useAppStore((s) => s.farmers);
  const [period, setPeriod] = useState<Period>("all");

  const orders = allOrders.filter((o) => isInPeriod(o.deliveryDate, period));

  const activeOrders = orders.filter((o) => !["New", "Under Review"].includes(o.status));
  const settledOrders = orders.filter((o) => o.status === "Settled" || o.paymentStatus === "Released");
  const deliveredOrders = orders.filter((o) => ["Delivered", "Settled"].includes(o.status) || o.paymentStatus === "Released");

  const totalRevenue = deliveredOrders.reduce((s, o) => s + getOrderFinancials(o).gross, 0);
  const coopEarnings = settledOrders.reduce((s, o) => s + getOrderFinancials(o).coopEarning, 0);

  const pendingInvoices = activeOrders.filter((o) => { const s = invoicePaymentStatus(o); return s === "Pending" || s === "Overdue"; });
  const pendingInvoiceTotal = pendingInvoices.reduce((s, o) => s + getOrderFinancials(o).gross, 0);
  const pendingPayoutOrders = activeOrders.filter((o) => o.paymentStatus !== "Released" && ["Delivered", "Quality Verified", "Dispatched", "Collected", "Pickup Scheduled", "Allocated"].includes(o.status));
  const pendingPayoutTotal = pendingPayoutOrders.reduce((s, o) => s + getOrderFinancials(o).netPayout, 0);

  // Farmer payout aggregates
  const farmerPayouts = farmers.map((farmer) => {
    const allocs = allOrders.flatMap((o) =>
      o.allocation.filter((a) => a.farmerId === farmer.id).map((a) => ({ ...a, order: o }))
    );
    const earned = allocs.filter((a) => a.order.status === "Settled" || a.order.paymentStatus === "Released").reduce((s, a) => s + a.quantity * RATE * (1 - COOP_FEE_RATE), 0);
    const pending = allocs.filter((a) => a.order.status !== "Settled" && a.order.paymentStatus !== "Released" && ["Delivered", "Dispatched", "Quality Verified", "Collected", "Pickup Scheduled", "Allocated"].includes(a.order.status)).reduce((s, a) => s + a.quantity * RATE * (1 - COOP_FEE_RATE), 0);
    const nextRelease = allocs.find((a) => ["Delivered"].includes(a.order.status))?.order.deliveryDate;
    return { farmer, earned, pending, nextRelease };
  }).filter((f) => f.earned > 0 || f.pending > 0);

  const invoiceRows = activeOrders
    .filter((o) => invoicePaymentStatus(o) !== "Not due" || o.invoiceStatus === "Generated")
    .slice(0, 7)
    .map((o) => ({ order: o, ...getOrderFinancials(o), status: invoicePaymentStatus(o) }));

  const metrics = [
    { icon: TrendingUp, label: "Total Revenue",          value: formatCurrency(totalRevenue),        sub: `${deliveredOrders.length} orders delivered` },
    { icon: Receipt,    label: "Outstanding Invoices",   value: formatCurrency(pendingInvoiceTotal),  sub: `${pendingInvoices.length} unpaid or overdue` },
    { icon: Wallet,     label: "Farmer Payouts Due",     value: formatCurrency(pendingPayoutTotal),   sub: `${pendingPayoutOrders.length} pending settlement` },
    { icon: BarChart3,  label: "Co-op Earnings",         value: formatCurrency(coopEarnings),         sub: "fees & quality adjustments" },
  ];

  const periods: { label: string; value: Period }[] = [
    { label: "This week", value: "week" },
    { label: "This month", value: "month" },
    { label: "This quarter", value: "quarter" },
    { label: "All time", value: "all" },
  ];

  return (
    <div className="-m-4 sm:-m-6 min-h-full p-4 sm:p-6" style={{ backgroundColor: "#F7F7F7" }}>
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
                  ? { backgroundColor: "#1a1a1a", color: "#fff" }
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
          {metrics.map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="rounded-2xl bg-white px-5 py-5" style={cardShadow}>
              <div className="flex items-center gap-2">
                <Icon size={16} className="text-slate-400" />
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
              <FileText size={15} className="text-slate-400" />
            </div>
            {invoiceRows.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-slate-400">No invoices to show.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {invoiceRows.map(({ order, gross, status }) => {
                  const isPaid = status === "Paid";
                  const isOverdue = status === "Overdue";
                  const pillStyle = isPaid
                    ? "bg-green-50 text-green-700"
                    : isOverdue
                      ? "bg-red-50 text-red-600"
                      : "bg-amber-50 text-amber-700";
                  return (
                    <div key={order.id} className="flex items-center justify-between px-6 py-3.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{order.buyer}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{order.id} · {formatDate(order.deliveryDate)}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(gross)}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${pillStyle}`}>{status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Farmer payouts — scheduled payouts style */}
          <div className="rounded-2xl bg-white" style={cardShadow}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <p className="text-sm font-semibold text-slate-900">Scheduled Payouts</p>
              <Wallet size={15} className="text-slate-400" />
            </div>
            {farmerPayouts.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-slate-400">No payouts to show.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {farmerPayouts.map(({ farmer, earned, pending, nextRelease }) => (
                  <div key={farmer.id} className="flex items-center justify-between px-6 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {farmer.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{farmer.name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {nextRelease ? `Releases ${formatDate(nextRelease)}` : "Settled"}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {pending > 0 && <p className="text-sm font-semibold text-slate-900">{formatCurrency(pending)}</p>}
                      {earned > 0 && <p className="text-xs text-slate-400">{formatCurrency(earned)} settled</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Order financials table */}
        <div className="rounded-2xl bg-white overflow-hidden" style={cardShadow}>
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <p className="text-sm font-semibold text-slate-900">Order Financials</p>
            <FileText size={15} className="text-slate-400" />
          </div>
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
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${order.invoiceStatus === "Generated" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                        {order.invoiceStatus === "Generated" ? "Sent" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isSettled ? "bg-green-50 text-green-700" : isOverdue ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                        {pymtStatus}
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
        </div>

      </div>
    </div>
  );
}
