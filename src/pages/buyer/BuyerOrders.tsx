import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAppStore } from "../../store/appStore";
import { formatDate, formatOrderProduce, formatOrderQuantity } from "../../utils/formatters";

export default function BuyerOrders() {
  const allOrders = useAppStore((state) => state.orders);
  const orders = allOrders.filter((order) => order.buyer === "Adam's Grocery");
  return (
    <div className="space-y-5">
      <PageHeader title="Order and delivery tracking" />
      <DataTable headers={["Order", "Produce", "Quantity", "Delivery", "Invoice", "Status"]} rows={orders.map((order) => [order.id, formatOrderProduce(order), formatOrderQuantity(order), formatDate(order.deliveryDate), order.invoiceStatus, <StatusBadge status={order.status} />])} />
    </div>
  );
}
