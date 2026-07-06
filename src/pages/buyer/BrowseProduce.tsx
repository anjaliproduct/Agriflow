import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAppStore } from "../../store/appStore";

export default function BrowseProduce() {
  const inventory = useAppStore((state) => state.inventory);
  const produce = ["Tomatoes", "Onions", "Potatoes", "Carrots", "Spinach"].map((name) => {
    const items = inventory.filter((item) => item.produce === name);
    const available = items.reduce((sum, item) => sum + item.declaredQuantity - item.reservedQuantity, 0);
    return { name, available, grade: items[0]?.estimatedGrade ?? "A", freshness: items[0]?.freshnessStatus ?? "Good" };
  });
  return (
    <div className="space-y-5">
      <PageHeader title="Estimated availability catalogue" description="Availability is subject to collection center verification." />
      <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_180px]">
        <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={18} /><input className="input pl-10" placeholder="Search produce" /></div>
        <select className="input"><option>Any grade</option><option>Grade A</option><option>Grade B</option></select>
        <select className="input"><option>Any availability</option><option>Available this week</option></select>
        <input className="input" type="date" defaultValue="2026-07-10" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {produce.map((item) => (
          <Link key={item.name} to={`/buyer/produce/${item.name}`} className="card p-5 hover:border-green-300">
            <div className="flex items-start justify-between">
              <div><h3 className="text-xl font-semibold text-slate-950">{item.name}</h3><p className="text-sm text-slate-500">Estimated availability</p></div>
              <StatusBadge status={item.available > 500 ? "High" : item.available > 200 ? "Medium" : "Low"} />
            </div>
            <p className="mt-5 text-3xl font-semibold text-slate-900">{item.available} kg</p>
            <p className="mt-2 text-sm text-slate-600">Preferred grade around {item.grade}. May be fulfilled by multiple farms.</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
