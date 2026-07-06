import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useAppStore } from "../../store/appStore";
import type { PickupRun, PickupRunStatus } from "../../types";
import { formatDate } from "../../utils/formatters";

const ONGOING: PickupRunStatus[] = ["In Progress", "Returning", "Delayed"];
const UPCOMING: PickupRunStatus[] = ["Scheduled"];
const PAST: PickupRunStatus[] = ["Completed"];

export default function Logistics() {
  const pickupRuns = useAppStore((s) => s.pickupRuns);
  const [open, setOpen] = useState({ ongoing: true, upcoming: false, past: false });

  const ongoing = pickupRuns.filter((r) => ONGOING.includes(r.status));
  const upcoming = pickupRuns.filter((r) => UPCOMING.includes(r.status));
  const past = pickupRuns.filter((r) => PAST.includes(r.status));

  const toggle = (key: keyof typeof open) =>
    setOpen((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="space-y-6">
      <PageHeader title="Runs" description="Farm collection and buyer delivery — all transport in one place." />
      <div className="space-y-4">
        <Group label="Ongoing" runs={ongoing} open={open.ongoing} onToggle={() => toggle("ongoing")} />
        <Group label="Upcoming" runs={upcoming} open={open.upcoming} onToggle={() => toggle("upcoming")} />
        <Group label="Past" runs={past} open={open.past} onToggle={() => toggle("past")} />
      </div>
    </div>
  );
}

function Group({ label, runs, open, onToggle }: {
  label: string;
  runs: PickupRun[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="mb-1 flex items-center gap-1.5 text-left"
      >
        <ChevronDown
          size={13}
          className={`shrink-0 text-slate-400 transition-transform duration-150 ${open ? "" : "-rotate-90"}`}
        />
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="text-xs text-slate-400">{runs.length}</span>
      </button>

      {open && (
        <>
          {runs.length === 0 ? (
            <p className="py-2 pl-5 text-sm text-slate-400">No {label.toLowerCase()} runs.</p>
          ) : (
            <table className="w-full text-sm">
              <colgroup>
                <col className="w-24" />
                <col />
                <col className="w-28" />
                <col className="w-16" />
                <col className="w-28" />
              </colgroup>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-b border-slate-100 last:border-0 hover:bg-white">
                    <td className="py-2.5 pl-5 pr-3 font-medium text-slate-900 whitespace-nowrap">
                      <Link to={`/manager/pickup-runs/${run.id}`} className="hover:text-leaf">{run.id}</Link>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">
                      <Link to={`/manager/pickup-runs/${run.id}`} className="hover:text-slate-900">{run.routeName}</Link>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">{formatDate(run.date)}</td>
                    <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">{run.stops.length} stops</td>
                    <td className="py-2.5 pl-3 pr-1 text-right">
                      <RunStatusChip status={run.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
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
