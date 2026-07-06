import { BarChart3, ClipboardList, PackageCheck } from "lucide-react";
import DataTable from "../../components/DataTable";
import MetricCard from "../../components/MetricCard";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAppStore } from "../../store/appStore";
import { formatDate } from "../../utils/formatters";

const farmerName = "Green Valley Farms";
const farmerId = "f1";

export default function FarmerAllocations() {
  const orders = useAppStore((state) => state.orders);
  const inventory = useAppStore((state) => state.inventory);
  const farmerInventory = inventory.filter((item) => item.farmerId === farmerId);
  const allocationRows = orders.flatMap((order) =>
    order.allocation
      .filter((allocation) => allocation.farmerId === farmerId)
      .map((allocation) => ({ order, allocation })),
  );
  const allocatedByCrop = farmerInventory.map((item) => {
    const allocated = allocationRows
      .filter(({ order }) => order.produce === item.produce)
      .reduce((sum, { allocation }) => sum + allocation.quantity, 0);
    return {
      crop: item.produce,
      declared: item.declaredQuantity,
      reserved: item.reservedQuantity,
      allocated,
      remaining: Math.max(item.declaredQuantity - allocated, 0),
    };
  });
  const totalAllocated = allocatedByCrop.reduce((sum, crop) => sum + crop.allocated, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Quantity committed to buyer orders" description={`This view shows how much of each crop is allocated from ${farmerName}, not the full declared inventory.`} />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Allocated to buyers" value={`${totalAllocated} kg`} helper="Across active and recent orders" icon={BarChart3} />
        <MetricCard label="Buyer orders" value={String(allocationRows.length)} helper="Orders using your produce" icon={ClipboardList} />
        <MetricCard label="Crops involved" value={String(allocatedByCrop.filter((crop) => crop.allocated > 0).length)} helper="Allocated crop lines" icon={PackageCheck} />
      </div>
      <section className="card p-5">
        <h3 className="text-lg font-semibold text-slate-950">Crop allocation summary</h3>
        <p className="mt-1 text-sm text-slate-500">Allocated quantity is what the co-op has committed to buyer demand. Reserved quantity may include other holds not yet finalized.</p>
        <div className="mt-4">
          <DataTable
            headers={["Crop", "Declared total", "Reserved", "Allocated to buyers", "Unallocated balance"]}
            rows={allocatedByCrop.map((crop) => [
              crop.crop,
              `${crop.declared} kg`,
              `${crop.reserved} kg`,
              <span className="font-semibold text-slate-950">{crop.allocated} kg</span>,
              `${crop.remaining} kg`,
            ])}
          />
        </div>
      </section>
      <section className="card p-5">
        <h3 className="text-lg font-semibold text-slate-950">Buyer order allocations</h3>
        <div className="mt-4">
          <DataTable
            headers={["Order", "Buyer", "Crop", "Allocated from you", "Requested total", "Delivery", "Order status"]}
            rows={allocationRows.map(({ order, allocation }) => [
              order.id,
              order.buyer,
              order.produce,
              <span className="font-semibold text-slate-950">{allocation.quantity} kg</span>,
              `${order.quantity} kg`,
              formatDate(order.deliveryDate),
              <StatusBadge status={order.status} />,
            ])}
          />
        </div>
      </section>
    </div>
  );
}
