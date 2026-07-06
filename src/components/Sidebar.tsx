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
    <aside className="h-full w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-100 p-4">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-leaf text-white">
            <Leaf size={17} />
          </span>
          <select
            className="min-w-0 bg-transparent text-sm font-semibold text-slate-800 outline-none"
            value={role}
            onChange={(event) => {
              const next = event.target.value as Role;
              setRole(next);
              navigate(landing[next]);
            }}
          >
            <option value="manager">Manager</option>
            <option value="buyer">Buyer</option>
            <option value="farmer">Farmer</option>
          </select>
        </div>
        <button
          className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-slate-700 hover:bg-white ${notificationsOpen ? "border-leaf bg-field text-leaf" : "border-slate-200 bg-slate-50"}`}
          aria-label={notificationsOpen ? "Close notifications" : "Open notifications"}
          onClick={onToggleNotifications}
        >
          <Bell size={17} />
          {notice ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-harvest ring-2 ring-white" /> : null}
        </button>
      </div>
      <nav className="space-y-1">
        {nav[role].map(([label, href, Icon]) => (
          <NavLink key={href} to={href} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${isActive ? "bg-field text-leaf" : "text-slate-600 hover:bg-slate-50"}`}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        {role === "manager" ? (
          <div className="pt-4">
            <button
              className="mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold uppercase text-slate-500 hover:bg-slate-50"
              type="button"
              aria-expanded={directoryOpen}
              onClick={() => setDirectoryOpen((open) => !open)}
            >
              Directory
              <ChevronDown size={14} className={directoryOpen ? "" : "-rotate-90"} />
            </button>
            {directoryOpen ? (
              <div className="space-y-1">
                {managerDirectory.map(([label, href, Icon]) => (
                  <NavLink key={href} to={href} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${isActive ? "bg-field text-leaf" : "text-slate-600 hover:bg-slate-50"}`}>
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
