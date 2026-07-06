import { Link } from "react-router-dom";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { useAppStore } from "../../store/appStore";
import { formatDate } from "../../utils/formatters";

export default function MyInventory() {
  const allInventory = useAppStore((state) => state.inventory);
  const inventory = allInventory.filter((item) => item.farmerId === "f1");
  return (
    <div className="space-y-5">
      <PageHeader title="Declared inventory" description="Final quantity and grade will be verified at collection." action={<Link className="btn-primary" to="/farmer/inventory/update">Update Inventory</Link>} />
      <DataTable headers={["Produce", "Declared", "Reserved", "Available", "Harvest date", "Self-assessed quality", "Last updated"]} rows={inventory.map((item) => [item.produce, `${item.declaredQuantity} kg`, `${item.reservedQuantity} kg`, `${item.declaredQuantity - item.reservedQuantity} kg`, formatDate(item.harvestDate), `Grade ${item.estimatedGrade} · ${item.qualityEstimate}`, item.lastUpdated])} />
    </div>
  );
}
