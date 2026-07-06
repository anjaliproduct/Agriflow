import { Link } from "react-router-dom";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAppStore } from "../../store/appStore";
import { formatCurrency } from "../../utils/formatters";

export default function Finance() {
  const orders = useAppStore((state) => state.orders);
  const delivered = orders.filter((order) => ["Delivered", "Settled"].includes(order.status));
  return (
    <div className="space-y-5">
      <PageHeader title="Invoices and farmer payment breakdowns" />
      <DataTable
        headers={["Order", "Buyer", "Buyer invoice", "Payment breakdown", "Farmer payout", "Status", ""]}
        rows={delivered.map((order) => {
          const gross = order.quantity * 2.4;
          return [
            order.id,
            order.buyer,
            `${formatCurrency(gross)} · ${order.invoiceStatus}`,
            `Co-op fee ${formatCurrency(gross * 0.08)}, logistics ${formatCurrency(180)}, quality adjustment ${formatCurrency(35)}`,
            order.paymentStatus,
            <StatusBadge status={order.status} />,
            <Link className="font-semibold text-leaf" to={`/manager/orders/${order.id}`}>Open</Link>,
          ];
        })}
      />
    </div>
  );
}
