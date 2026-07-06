import { ArrowLeft, Check, Navigation, PanelRight, Phone, RefreshCw } from "lucide-react";
import { formatDate } from "../../utils/formatters";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import RouteMap from "../../components/RouteMap";
import { useAppStore } from "../../store/appStore";
import type { PickupRunStatus } from "../../types";

export default function PickupRunDetail() {
  const { runId } = useParams();
  const pickupRuns = useAppStore((s) => s.pickupRuns);
  const run = pickupRuns.find((r) => r.id === runId);
  const [timelineOpen, setTimelineOpen] = useState(false);

  if (!run) return <Navigate to="/manager/pickup-runs" replace />;

  return (
    <div className="-m-6 flex h-[calc(100vh)] flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex h-11 items-center gap-3 px-4">
          <Link
            to="/manager/pickup-runs"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={14} />
            Runs
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-900">{run.id}</span>
          <div className="flex-1" />
          <RunStatusChip status={run.status} />
          <button
            type="button"
            onClick={() => setTimelineOpen((o) => !o)}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
              timelineOpen
                ? "border-leaf bg-field text-leaf"
                : "border-slate-200 bg-white text-slate-500 hover:text-slate-900"
            }`}
          >
            <PanelRight size={13} />
            Timeline
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[820px] space-y-5 px-6 py-5">
            {/* Run summary */}
            <div>
              <h1 className="text-xl font-bold text-slate-950">{run.routeName}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                <span>{run.id}</span>
                <span className="text-slate-300">·</span>
                <span>{formatDate(run.date)}</span>
                <span className="text-slate-300">·</span>
                <span>{run.driver}</span>
                <span className="text-slate-300">·</span>
                <span>{run.vehicle}</span>
                <span className="text-slate-300">·</span>
                <span>ETA {run.eta}</span>
                <span className="text-slate-300">·</span>
                <span>{run.collectionCenter}</span>
                {run.linkedOrders.map((id) => (
                  <Link
                    key={id}
                    to={`/manager/orders/${id}`}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                  >
                    {id}
                  </Link>
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-sm font-semibold text-slate-950">Route</p>
                <button className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                  <Navigation size={12} /> Re-optimize
                </button>
              </div>
              <div className="px-4 pb-4">
                <RouteMap
                  stops={run.stops.map((s) => ({ farmName: s.farmName, time: s.readyTime, status: s.status, produce: s.produce, quantity: s.quantity }))}
                  collectionCenter={run.collectionCenter}
                  eta={run.eta}
                  height={280}
                />
              </div>
            </div>

            {/* Stops */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-950">Stops</p>
              <div className="divide-y divide-slate-100">
                {run.stops.map((stop, i) => (
                  <div key={stop.id} className="flex items-center gap-3 px-4 py-3">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${stop.status === "Loaded" ? "bg-leaf text-white" : stop.status === "Arrived" ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {stop.status === "Loaded" ? <Check size={12} strokeWidth={3} /> : i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-900">{stop.farmName}</span>
                      <span className="ml-2 text-xs text-slate-400">{stop.location} · {stop.readyTime} · {stop.produce} · {stop.quantity} kg</span>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:text-slate-700" title="Contact">
                        <Phone size={13} />
                      </button>
                      <button className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:text-slate-700" title="Reschedule">
                        <RefreshCw size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3 bg-green-50 px-4 py-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf text-xs font-bold text-white">★</span>
                  <div>
                    <span className="text-sm font-medium text-slate-900">{run.collectionCenter}</span>
                    <span className="ml-2 text-xs text-slate-400">Unload, weigh, and verify</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible timeline sidebar */}
        {timelineOpen && (
          <aside className="w-72 shrink-0 overflow-y-auto border-l border-slate-200 bg-white px-4 py-5">
            <p className="mb-1 text-sm font-semibold text-slate-950">Run timeline</p>
            <p className="mb-5 text-xs text-slate-400">Chronological movement and loading events.</p>
            <div>
              {run.timeline.map((event, i) => (
                <div key={`${event.time}-${event.event}`} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < run.timeline.length - 1 && (
                    <span className="absolute left-[9px] top-5 h-full w-px bg-slate-200" />
                  )}
                  <span className={`relative z-10 mt-0.5 h-5 w-5 shrink-0 rounded-full ring-4 ring-white ${
                    event.status === "Done" ? "bg-leaf"
                    : event.status === "Current" ? "bg-amber-400"
                    : "bg-slate-200"
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{event.event}</p>
                    <p className="text-xs text-slate-400">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function RunStatusChip({ status }: { status: PickupRunStatus }) {
  const styles: Record<PickupRunStatus, string> = {
    "In Progress": "bg-blue-50 text-blue-600",
    "Returning":   "bg-violet-50 text-violet-600",
    "Delayed":     "bg-red-50 text-red-500",
    "Scheduled":   "bg-amber-50 text-amber-600",
    "Completed":   "bg-green-50 text-green-600",
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}
