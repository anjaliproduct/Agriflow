import { ClipboardCheck, PackageCheck, Truck, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import MetricCard from "../../components/MetricCard";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAppStore } from "../../store/appStore";
import { formatDate, formatOrderRequest } from "../../utils/formatters";

export default function ManagerDashboard() {
  const orders = useAppStore((state) => state.orders);
  const inventory = useAppStore((state) => state.inventory);
  return (
    <div className="space-y-6">
      <PageHeader title="Today’s coordination workspace" />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Incoming orders" value={String(orders.filter((order) => order.status === "New").length)} helper="Need review and allocation" icon={ClipboardCheck} />
        <MetricCard label="Declared stock" value={`${inventory.reduce((sum, item) => sum + item.declaredQuantity, 0)} kg`} helper="Not yet fully verified" icon={PackageCheck} />
        <MetricCard label="Pickup ready" value={String(orders.filter((order) => order.status === "Allocated").length)} helper="Awaiting schedule" icon={Truck} />
        <MetricCard label="Finance queue" value={String(orders.filter((order) => order.status === "Delivered").length)} helper="Delivered orders to invoice" icon={Wallet} />
      </div>
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-950">Priority orders</h3>
          <Link className="text-sm font-semibold text-leaf" to="/manager/orders">View all</Link>
        </div>
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} to={`/manager/orders/${order.id}`} className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
              <div>
                <p className="font-semibold text-slate-950">{order.id} · {order.buyer}</p>
                <p className="text-sm text-slate-500">{formatOrderRequest(order)}, delivery {formatDate(order.deliveryDate)}</p>
              </div>
              <StatusBadge status={order.status} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
