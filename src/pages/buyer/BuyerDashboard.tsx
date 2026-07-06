import { ClipboardList, PackageSearch, Receipt, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import MetricCard from "../../components/MetricCard";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAppStore } from "../../store/appStore";
import { formatOrderProduce, formatOrderQuantity } from "../../utils/formatters";

export default function BuyerDashboard() {
  const allOrders = useAppStore((state) => state.orders);
  const orders = allOrders.filter((order) => order.buyer === "Adam's Grocery");
  return (
    <div className="space-y-6">
      <PageHeader title="Adam’s Grocery dashboard" />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Open orders" value={String(orders.length)} helper="Across review and fulfillment" icon={ClipboardList} />
        <MetricCard label="Catalogue" value="5 crops" helper="Estimated availability" icon={PackageSearch} />
        <MetricCard label="Deliveries" value={String(orders.filter((order) => order.status === "Dispatched").length)} helper="In transit" icon={Truck} />
        <MetricCard label="Invoices" value={String(orders.filter((order) => order.invoiceStatus === "Generated").length)} helper="Ready to pay" icon={Receipt} />
      </div>
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-950">Recent orders</h3>
          <Link className="btn-primary" to="/buyer/produce">Place Bulk Order</Link>
        </div>
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div><p className="font-semibold text-slate-950">{order.id} · {formatOrderQuantity(order)} {formatOrderProduce(order)}</p><p className="text-sm text-slate-500">May be fulfilled by multiple farms. Subject to verification.</p></div>
              <StatusBadge status={order.status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
