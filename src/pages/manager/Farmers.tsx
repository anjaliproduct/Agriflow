import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { useAppStore } from "../../store/appStore";

export default function Farmers() {
  const farmers = useAppStore((state) => state.farmers);
  return (
    <div className="space-y-5">
      <PageHeader title="Co-op farmer network" />
      <DataTable headers={["Farmer", "Location", "Distance", "Reliability", "Crops"]} rows={farmers.map((farmer) => [farmer.name, farmer.location, `${farmer.distance} km`, `${farmer.reliability}%`, farmer.crops.join(", ")])} />
    </div>
  );
}
