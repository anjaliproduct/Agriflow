import { Link } from "react-router-dom";
import { BarChart3, CalendarClock, Package } from "lucide-react";
import MetricCard from "../../components/MetricCard";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAppStore } from "../../store/appStore";

export default function FarmerDashboard() {
  const allInventory = useAppStore((state) => state.inventory);
  const allOrders = useAppStore((state) => state.orders);
  const pickupRuns = useAppStore((state) => state.pickupRuns);
  const inventory = allInventory.filter((item) => item.farmerId === "f1");
  const allocated = allOrders
    .flatMap((order) => order.allocation.filter((allocation) => allocation.farmerId === "f1"))
    .reduce((sum, allocation) => sum + allocation.quantity, 0);
  const pickupJobs = pickupRuns.filter((run) => run.stops.some((stop) => stop.farmName === "Green Valley Farms")).length;
  return (
    <div className="space-y-5">
      <PageHeader title="Green Valley Farms" description="Lightweight companion view for declarations, allocations, pickups, and payments." />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Declared crops" value={String(inventory.length)} helper="Editable inventory declarations" icon={Package} />
        <MetricCard label="Allocated to buyers" value={`${allocated} kg`} helper="Committed from your crops" icon={BarChart3} />
        <MetricCard label="Pickup jobs" value={String(pickupJobs)} helper="Scheduled or tracked by crop" icon={CalendarClock} />
      </div>
      <section className="card p-5">
        <div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-slate-950">Declared inventory</h3><Link className="btn-primary" to="/farmer/inventory/update">Update Inventory</Link></div>
        <p className="mt-1 text-sm text-slate-500">This section is only what you declared as available. Use Allocations for buyer commitments and Pickups for live route tracking.</p>
        <div className="mt-4 grid gap-3">
          {inventory.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div><p className="font-semibold text-slate-950">{item.produce}</p><p className="text-sm text-slate-500">Available {item.declaredQuantity - item.reservedQuantity} kg · Reserved {item.reservedQuantity} kg · Last updated {item.lastUpdated}</p></div>
              <StatusBadge status={item.freshnessStatus} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
