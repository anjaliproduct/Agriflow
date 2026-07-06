import { Clock, MapPin, Route, Truck } from "lucide-react";
import DataTable from "../../components/DataTable";
import MetricCard from "../../components/MetricCard";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAppStore } from "../../store/appStore";
import { formatDate } from "../../utils/formatters";

const farmerName = "Green Valley Farms";

export default function FarmerPickups() {
  const runs = useAppStore((state) => state.pickupRuns);
  const farmerRuns = runs
    .map((run) => ({
      run,
      stops: run.stops.filter((stop) => stop.farmName === farmerName),
    }))
    .filter((entry) => entry.stops.length > 0);
  const scheduled = farmerRuns.filter(({ run }) => ["Scheduled", "In Progress", "Returning"].includes(run.status)).length;
  const collected = farmerRuns.reduce((sum, { stops }) => sum + stops.reduce((stopSum, stop) => stopSum + (stop.status === "Loaded" ? stop.quantity : 0), 0), 0);
  const expected = farmerRuns.reduce((sum, { stops }) => sum + stops.reduce((stopSum, stop) => stopSum + stop.quantity, 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Pickup schedule and live tracking" description="Track each crop pickup from schedule through collection, verification, dispatch, and delivery." />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Pickup jobs" value={String(farmerRuns.length)} helper="For Green Valley Farms" icon={Truck} />
        <MetricCard label="Scheduled/open" value={String(scheduled)} helper="Awaiting pickup or route assignment" icon={Clock} />
        <MetricCard label="Expected load" value={`${expected} kg`} helper="Declared for pickup" icon={Route} />
        <MetricCard label="Collected" value={`${collected} kg`} helper="Verified or delivered" icon={MapPin} />
      </div>
      <section className="card p-5">
        <h3 className="text-lg font-semibold text-slate-950">Crop pickup tracker</h3>
        <p className="mt-1 text-sm text-slate-500">This is pickup status per crop and order. It is separate from declared inventory.</p>
        <div className="mt-4">
          <DataTable
            headers={["Crop", "Pickup Run", "Ready time", "Driver / vehicle", "Scheduled quantity", "Loaded", "Live status"]}
            rows={farmerRuns.flatMap(({ run, stops }) =>
              stops.map((stop) => [
                stop.produce,
                run.id,
                `${formatDate(run.date)}, ${stop.readyTime}`,
                `${run.driver} · ${run.vehicle}`,
                `${stop.quantity} kg`,
                stop.status === "Loaded" ? `${stop.quantity} kg` : "Pending",
                <StatusBadge status={stop.status} />,
              ]),
            )}
          />
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        {farmerRuns.map(({ run, stops }) => {
          const stop = stops[0];
          return (
            <section key={run.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="label">{run.id}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">{stop.produce} pickup</h3>
                  <p className="text-sm text-slate-500">{run.routeName}</p>
                </div>
                <StatusBadge status={run.status} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Info label="Ready time" value={`${formatDate(run.date)}, ${stop.readyTime}`} />
                <Info label="Stop status" value={stop.status} />
                <Info label="Driver" value={run.driver} />
                <Info label="Vehicle" value={run.vehicle} />
                <Info label="Collection center" value={run.collectionCenter} />
                <Info label="Pickup quantity" value={`${stop.quantity} kg scheduled${stop.status === "Loaded" ? `, ${stop.quantity} kg loaded` : ""}`} />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
