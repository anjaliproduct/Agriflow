import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAppStore } from "../../store/appStore";
import { formatCurrency } from "../../utils/formatters";

export default function BuyerInvoices() {
  const allOrders = useAppStore((state) => state.orders);
  const orders = allOrders.filter((order) => order.buyer === "Adam's Grocery");
  return (
    <div className="space-y-5">
      <PageHeader title="Buyer invoices" />
      <DataTable headers={["Invoice", "Order", "Amount", "Payment status"]} rows={orders.map((order) => [`INV-${order.id.replace("ORD-", "")}`, order.id, formatCurrency(order.quantity * 2.4), <StatusBadge status={order.invoiceStatus} />])} />
    </div>
  );
}
