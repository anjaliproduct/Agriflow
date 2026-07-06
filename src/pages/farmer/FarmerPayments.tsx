import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAppStore } from "../../store/appStore";
import { formatCurrency } from "../../utils/formatters";

export default function FarmerPayments() {
  const allOrders = useAppStore((state) => state.orders);
  const orders = allOrders.filter((order) => order.allocation.some((allocation) => allocation.farmerId === "f1"));
  return (
    <div className="space-y-5">
      <PageHeader title="Estimated earnings and final breakdown" />
      <DataTable
        headers={["Order", "Allocation", "Estimated earnings", "Payment breakdown", "Status"]}
        rows={orders.map((order) => {
          const allocation = order.allocation.find((entry) => entry.farmerId === "f1")!;
          const gross = allocation.quantity * 1.65;
          return [order.id, `${allocation.quantity} kg ${order.produce}`, formatCurrency(gross), `Co-op fee ${formatCurrency(gross * 0.08)}, logistics ${formatCurrency(45)}, quality adjustment ${order.verifiedQuantity ? formatCurrency(10) : "pending"}`, <StatusBadge status={order.paymentStatus} />];
        })}
      />
    </div>
  );
}
