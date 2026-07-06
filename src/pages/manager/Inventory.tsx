import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAppStore } from "../../store/appStore";

export default function Inventory() {
  const { inventory, farmers } = useAppStore();
  return (
    <div className="space-y-5">
      <PageHeader title="Declared vs verified stock" description="Final quantity and grade will be verified at collection." />
      <DataTable
        headers={["Produce", "Farmer", "Declared", "Reserved", "Verified", "Grade", "Freshness", "Last updated"]}
        rows={inventory.map((item) => [
          item.produce,
          farmers.find((farmer) => farmer.id === item.farmerId)?.name,
          `${item.declaredQuantity} kg`,
          `${item.reservedQuantity} kg`,
          item.verifiedQuantity ? `${item.verifiedQuantity} kg` : "Pending",
          `Est. ${item.estimatedGrade}${item.verifiedGrade ? ` / Verified ${item.verifiedGrade}` : ""}`,
          <StatusBadge status={item.freshnessStatus} />,
          item.lastUpdated,
        ])}
      />
    </div>
  );
}
