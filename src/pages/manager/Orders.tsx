import { Navigate } from "react-router-dom";
import { useAppStore } from "../../store/appStore";

// Order queue table is out of scope for this prototype — land directly on the order detail workflow.
export default function Orders() {
  const orders = useAppStore((state) => state.orders);
  const firstOrderId = orders[0]?.id;
  if (!firstOrderId) return null;
  return <Navigate to={`/manager/orders/${firstOrderId}`} replace />;
}
