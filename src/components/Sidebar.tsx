import { BarChart3, Bell, ChevronDown, ClipboardList, CreditCard, LayoutDashboard, Leaf, Package, Receipt, Route, ShoppingBasket, Sprout, Truck, Users } from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/appStore";
import { Role } from "../types";

const landing: Record<Role, string> = {
  manager: "/manager/dashboard",
  buyer: "/buyer/dashboard",
  farmer: "/farmer/dashboard",
};

const nav = {
  manager: [
    ["Dashboard", "/manager/dashboard", LayoutDashboard],
    ["Orders", "/manager/orders", ClipboardList],
    ["Runs", "/manager/pickup-runs", Truck],
    ["Finance", "/manager/finance", CreditCard],
  ],
  buyer: [
    ["Dashboard", "/buyer/dashboard", LayoutDashboard],
    ["Browse Produce", "/buyer/produce", ShoppingBasket],
    ["My Orders", "/buyer/orders", ClipboardList],
    ["Deliveries", "/buyer/deliveries", Route],
    ["Invoices", "/buyer/invoices", Receipt],
  ],
  farmer: [
    ["Dashboard", "/farmer/dashboard", LayoutDashboard],
    ["My Inventory", "/farmer/inventory", Package],
    ["Allocations", "/farmer/allocations", BarChart3],
    ["Pickups", "/farmer/pickups", Truck],
    ["Payments", "/farmer/payments", CreditCard],
  ],
} as const;

export default function Sidebar({
  notificationsOpen,
  onToggleNotifications,
}: {
  notificationsOpen: boolean;
  onToggleNotifications: () => void;
}) {
  const role = useAppStore((state) => state.role);
  const notice = useAppStore((state) => state.notice);
  const setRole = useAppStore((state) => state.setRole);
  const navigate = useNavigate();
  const [directoryOpen, setDirectoryOpen] = useState(true);
  const managerDirectory = [
    ["Inventory", "/manager/inventory", Package],
    ["Farmers", "/manager/farmers", Sprout],
    ["Buyers", "/manager/buyers", Users],
  ] as const;

  return (
    <aside className="h-full w-64 shrink-0 overflow-y-auto p-4" style={{ backgroundColor: "#162810" }}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "#99C30C" }}>
            <Leaf size={17} className="text-white" />
          </span>
          <select
            className="min-w-0 bg-transparent text-sm font-semibold outline-none"
            style={{ color: "#ffffff" }}
            value={role}
            onChange={(event) => {
              const next = event.target.value as Role;
              setRole(next);
              navigate(landing[next]);
            }}
          >
            <option value="manager" style={{ color: "#000", backgroundColor: "#fff" }}>Manager</option>
            <option value="buyer" style={{ color: "#000", backgroundColor: "#fff" }}>Buyer</option>
            <option value="farmer" style={{ color: "#000", backgroundColor: "#fff" }}>Farmer</option>
          </select>
        </div>
        <button
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors"
          style={{
            backgroundColor: notificationsOpen ? "#99C30C30" : "transparent",
            color: notificationsOpen ? "#99C30C" : "#ffffff99",
            border: notificationsOpen ? "1px solid #99C30C44" : "1px solid #ffffff22",
          }}
          aria-label={notificationsOpen ? "Close notifications" : "Open notifications"}
          onClick={onToggleNotifications}
        >
          <Bell size={17} />
          {notice ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full ring-2" style={{ backgroundColor: "#FE8B02" }} /> : null}
        </button>
      </div>
      <nav className="space-y-0.5">
        {nav[role].map(([label, href, Icon]) => (
          <NavLink
            key={href}
            to={href}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "" : ""
              }`
            }
            style={({ isActive }) =>
              isActive
                ? { backgroundColor: "#99C30C30", color: "#ffffff", fontWeight: 600 }
                : { color: "#ffffffaa" }
            }
            onMouseEnter={(e) => {
              const target = e.currentTarget;
              if (!target.getAttribute("aria-current")) {
                target.style.color = "#ffffff";
                target.style.backgroundColor = "#ffffff15";
              }
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget;
              if (!target.getAttribute("aria-current")) {
                target.style.color = "#ffffffaa";
                target.style.backgroundColor = "transparent";
              }
            }}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        {role === "manager" ? (
          <div className="pt-4">
            <button
              className="mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold uppercase transition-colors"
              style={{ color: "#ffffff55" }}
              type="button"
              aria-expanded={directoryOpen}
              onClick={() => setDirectoryOpen((open) => !open)}
            >
              Directory
              <ChevronDown size={14} className={directoryOpen ? "" : "-rotate-90"} />
            </button>
            {directoryOpen ? (
              <div className="space-y-0.5">
                {managerDirectory.map(([label, href, Icon]) => (
                  <NavLink
                    key={href}
                    to={href}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "" : ""}`
                    }
                    style={({ isActive }) =>
                      isActive
                        ? { backgroundColor: "#99C30C30", color: "#ffffff", fontWeight: 600 }
                        : { color: "#ffffffaa" }
                    }
                    onMouseEnter={(e) => {
                      const target = e.currentTarget;
                      if (!target.getAttribute("aria-current")) {
                        target.style.color = "#ffffff";
                        target.style.backgroundColor = "#ffffff15";
                      }
                    }}
                    onMouseLeave={(e) => {
                      const target = e.currentTarget;
                      if (!target.getAttribute("aria-current")) {
                        target.style.color = "#ffffffaa";
                        target.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <Icon size={18} />
                    {label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </nav>
    </aside>
  );
}
