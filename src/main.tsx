import React from "react";
import ReactDOM from "react-dom/client";
import { Navigate, Route, Routes } from "react-router";
import { BrowserRouter } from "react-router-dom";
import AppShell from "./components/AppShell";
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import BrowseProduce from "./pages/buyer/BrowseProduce";
import BuyerInvoices from "./pages/buyer/BuyerInvoices";
import BuyerOrders from "./pages/buyer/BuyerOrders";
import OrderReview from "./pages/buyer/OrderReview";
import ProduceDetail from "./pages/buyer/ProduceDetail";
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import FarmerAllocations from "./pages/farmer/FarmerAllocations";
import FarmerPayments from "./pages/farmer/FarmerPayments";
import FarmerPickups from "./pages/farmer/FarmerPickups";
import InventoryUpdate from "./pages/farmer/InventoryUpdate";
import MyInventory from "./pages/farmer/MyInventory";
import Finance from "./pages/manager/Finance";
import Inventory from "./pages/manager/Inventory";
import Logistics from "./pages/manager/Logistics";
import PickupRunDetail from "./pages/manager/PickupRunDetail";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import OrderWorkspace from "./pages/manager/OrderWorkspace";
import Orders from "./pages/manager/Orders";
import Farmers from "./pages/manager/Farmers";
import Buyers from "./pages/manager/Buyers";
import "./styles.css";
import "leaflet/dist/leaflet.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/manager/dashboard" replace />} />
          <Route path="manager/dashboard" element={<ManagerDashboard />} />
          <Route path="manager/orders" element={<Orders />} />
          <Route path="manager/orders/:orderId" element={<OrderWorkspace />} />
          <Route path="manager/inventory" element={<Inventory />} />
          <Route path="manager/logistics" element={<Navigate to="/manager/pickup-runs" replace />} />
          <Route path="manager/pickup-runs" element={<Logistics />} />
          <Route path="manager/pickup-runs/:runId" element={<PickupRunDetail />} />
          <Route path="manager/finance" element={<Finance />} />
          <Route path="manager/farmers" element={<Farmers />} />
          <Route path="manager/buyers" element={<Buyers />} />
          <Route path="buyer/dashboard" element={<BuyerDashboard />} />
          <Route path="buyer/produce" element={<BrowseProduce />} />
          <Route path="buyer/produce/:produceName" element={<ProduceDetail />} />
          <Route path="buyer/review" element={<OrderReview />} />
          <Route path="buyer/orders" element={<BuyerOrders />} />
          <Route path="buyer/deliveries" element={<BuyerOrders />} />
          <Route path="buyer/invoices" element={<BuyerInvoices />} />
          <Route path="farmer/dashboard" element={<FarmerDashboard />} />
          <Route path="farmer/inventory" element={<MyInventory />} />
          <Route path="farmer/inventory/update" element={<InventoryUpdate />} />
          <Route path="farmer/inventory/update/:itemId" element={<InventoryUpdate />} />
          <Route path="farmer/allocations" element={<FarmerAllocations />} />
          <Route path="farmer/pickups" element={<FarmerPickups />} />
          <Route path="farmer/payments" element={<FarmerPayments />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
