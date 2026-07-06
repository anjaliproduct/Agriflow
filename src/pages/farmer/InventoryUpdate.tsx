import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import PageHeader from "../../components/PageHeader";
import { useAppStore } from "../../store/appStore";
import { Grade } from "../../types";

export default function InventoryUpdate() {
  const item = useAppStore((state) => state.inventory.find((entry) => entry.farmerId === "f1"))!;
  const updateInventory = useAppStore((state) => state.updateInventory);
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(item.declaredQuantity);
  const [harvestDate, setHarvestDate] = useState(item.harvestDate);
  const [grade, setGrade] = useState<Grade>(item.estimatedGrade);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={item.produce} />
      <section className="card p-6">
        <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">This is declared inventory. Final quantity and grade will be verified at collection.</div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Info label="Currently reserved" value={`${item.reservedQuantity} kg`} />
          <Info label="Last updated" value={item.lastUpdated} />
        </div>
        <div className="mt-5 space-y-4">
          <label className="block"><span className="label">Available quantity</span><input className="input mt-1" type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label>
          <label className="block"><span className="label">Harvest / availability date</span><input className="input mt-1" type="date" value={harvestDate} onChange={(event) => setHarvestDate(event.target.value)} /></label>
          <label className="block"><span className="label">Optional self-assessed quality estimate</span><select className="input mt-1" value={grade} onChange={(event) => setGrade(event.target.value as Grade)}><option>A</option><option>B</option><option>C</option></select></label>
        </div>
        <div className="mt-5 rounded-md bg-field p-4">
          <p className="font-semibold text-slate-900">Review changes</p>
          <p className="mt-1 text-sm text-slate-600">Declared {quantity} kg, Grade {grade}, harvest date {harvestDate}. Available after reservations: {quantity - item.reservedQuantity} kg.</p>
        </div>
        <button className="btn-primary mt-6 w-full" onClick={() => { updateInventory(item.id, quantity, harvestDate, grade); navigate("/farmer/inventory"); }}><CheckCircle2 size={18} /> Submit Inventory</button>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="label">{label}</p><p className="mt-1 font-semibold text-slate-950">{value}</p></div>;
}
