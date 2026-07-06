import { CheckCircle2 } from "lucide-react";
import { Navigate, useNavigate } from "react-router";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAppStore } from "../../store/appStore";
import { formatDate } from "../../utils/formatters";

export default function OrderReview() {
  const { draft, placeOrder } = useAppStore();
  const navigate = useNavigate();
  if (!draft) return <Navigate to="/buyer/produce" replace />;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Confirm bulk order request" />
      <section className="card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Info label="Produce" value={draft.produce} />
          <Info label="Quantity" value={`${draft.quantity} kg`} />
          <Info label="Preferred grade" value={`Grade ${draft.grade}`} />
          <Info label="Delivery date" value={formatDate(draft.deliveryDate)} />
        </div>
        <div className="mt-5 rounded-md bg-field p-4">
          <p className="font-semibold text-slate-900">Order may be fulfilled by multiple farms</p>
          <p className="mt-1 text-sm text-slate-600">Manager will approve a farmer allocation before pickup. Final quantity and grade are subject to collection center verification.</p>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-md border border-slate-200 p-4">
          <span className="font-medium text-slate-700">Expected fulfillment confidence</span>
          <StatusBadge status={draft.quantity > 700 ? "Medium" : "High"} />
        </div>
        <button className="btn-primary mt-6 w-full" onClick={() => { placeOrder(); navigate("/buyer/orders"); }}><CheckCircle2 size={18} /> Place Order</button>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="label">{label}</p><p className="mt-1 text-lg font-semibold text-slate-950">{value}</p></div>;
}
