import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { useAppStore } from "../../store/appStore";

export default function Buyers() {
  const buyers = useAppStore((state) => state.buyers);
  return (
    <div className="space-y-5">
      <PageHeader title="Bulk buyer accounts" />
      <DataTable headers={["Buyer", "Location", "Payment terms"]} rows={buyers.map((buyer) => [buyer.name, buyer.location, buyer.paymentTerms])} />
    </div>
  );
}
