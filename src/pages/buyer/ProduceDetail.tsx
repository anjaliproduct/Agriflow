import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAppStore } from "../../store/appStore";
import { Grade } from "../../types";

export default function ProduceDetail() {
  const { produceName = "Tomatoes" } = useParams();
  const navigate = useNavigate();
  const { inventory, setDraft } = useAppStore();
  const [quantity, setQuantity] = useState(600);
  const [grade, setGrade] = useState<Grade>("A");
  const [deliveryDate, setDeliveryDate] = useState("2026-07-10");
  const [notes, setNotes] = useState("Deliver to loading dock before noon.");
  const available = inventory.filter((item) => item.produce === produceName).reduce((sum, item) => sum + item.declaredQuantity - item.reservedQuantity, 0);
  const confidence = quantity <= available * 0.75 ? "High" : quantity <= available ? "Medium" : "Low";
  return (
    <div className="space-y-5">
      <PageHeader title={produceName} description="Estimated availability, subject to collection center verification." />
      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <section
          className="rounded-2xl border border-slate-100 bg-white p-6"
          style={{ boxShadow: "0 2px 40px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.03)" }}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Info label="Available to promise" value={`${available} kg`} />
            <Info label="Fulfillment confidence" value={confidence} />
            <Info label="Fulfillment model" value="Multiple farms possible" />
          </div>
          <div className="mt-5 rounded-md bg-amber-50 p-4 text-sm text-amber-800">This is estimated availability, not guaranteed inventory. Final quantity and grade will be confirmed after collection center verification.</div>
        </section>
        <section
          className="rounded-2xl border border-slate-100 bg-white p-6"
          style={{ boxShadow: "0 2px 40px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.03)" }}
        >
          <h3 className="text-lg font-semibold text-slate-950">Place bulk order</h3>
          <div className="mt-4 space-y-4">
            <label className="block"><span className="label">Required quantity</span><input className="input mt-1" type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label>
            <label className="block"><span className="label">Preferred grade</span><select className="input mt-1" value={grade} onChange={(event) => setGrade(event.target.value as Grade)}><option>A</option><option>B</option><option>C</option></select></label>
            <label className="block"><span className="label">Delivery date</span><input className="input mt-1" type="date" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} /></label>
            <label className="block"><span className="label">Delivery notes</span><textarea className="input mt-1 min-h-24" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
            <div className="flex items-center justify-between rounded-md bg-field p-3"><span className="text-sm font-medium text-slate-700">Expected fulfillment confidence</span><StatusBadge status={confidence} /></div>
            <button className="btn-primary w-full" onClick={() => { setDraft({ produce: produceName, quantity, grade, deliveryDate, notes }); navigate("/buyer/review"); }}>Review Order <ArrowRight size={17} /></button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="label">{label}</p><p className="mt-1 text-xl font-semibold text-slate-950">{value}</p></div>;
}
