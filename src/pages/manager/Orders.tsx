import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAppStore } from "../../store/appStore";
import { formatDate, formatOrderRequest } from "../../utils/formatters";

export default function Orders() {
  const orders = useAppStore((state) => state.orders);
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <PageHeader title="Buyer order queue" />
      <div className="flex gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input className="input pl-10" placeholder="Search by buyer, produce, or order id" />
        </div>
        <select className="input max-w-48"><option>All statuses</option><option>New</option><option>Allocated</option></select>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-cream text-xs uppercase text-slate-500">
            <tr>
              {["Order", "Buyer", "Request", "Delivery", "Confidence", "Status"].map((header) => (
                <th key={header} className="px-4 py-3 font-semibold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => navigate(`/manager/orders/${order.id}`)}
              >
                <td className="px-4 py-3 font-semibold text-slate-950">{order.id}</td>
                <td className="px-4 py-3 text-slate-700">{order.buyer}</td>
                <td className="px-4 py-3 text-slate-700">{formatOrderRequest(order)}</td>
                <td className="px-4 py-3 text-slate-700">{formatDate(order.deliveryDate)}</td>
                <td className="px-4 py-3"><StatusBadge status={order.confidence} /></td>
                <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
