import { LucideIcon } from "lucide-react";

export default function MetricCard({ label, value, helper, icon: Icon }: { label: string; value: string; helper: string; icon: LucideIcon }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="label">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        <span className="rounded-md bg-field p-2 text-leaf">
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-500">{helper}</p>
    </div>
  );
}
