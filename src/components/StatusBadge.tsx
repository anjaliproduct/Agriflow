import { OrderStatus } from "../types";

const tones: Record<string, string> = {
  New: "bg-blue-50 text-blue-700 ring-blue-200",
  "Under Review": "bg-amber-50 text-amber-700 ring-amber-200",
  Allocated: "bg-green-50 text-green-700 ring-green-200",
  "Pickup Scheduled": "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Collected: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  "Quality Verified": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Dispatched: "bg-violet-50 text-violet-700 ring-violet-200",
  Delivered: "bg-slate-100 text-slate-700 ring-slate-300",
  Settled: "bg-leaf text-white ring-green-700",
  Scheduled: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  "In Progress": "bg-amber-50 text-amber-700 ring-amber-200",
  Returning: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  Completed: "bg-leaf text-white ring-green-700",
  Delayed: "bg-red-50 text-red-700 ring-red-200",
  Pending: "bg-slate-100 text-slate-700 ring-slate-200",
  Arrived: "bg-amber-50 text-amber-700 ring-amber-200",
  Loaded: "bg-green-50 text-green-700 ring-green-200",
  Skipped: "bg-red-50 text-red-700 ring-red-200",
  High: "bg-green-50 text-green-700 ring-green-200",
  Medium: "bg-harvest/30 text-yellow-800 ring-yellow-200",
  Low: "bg-red-50 text-red-700 ring-red-200",
};

export default function StatusBadge({ status }: { status: OrderStatus | string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tones[status] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>{status}</span>;
}
