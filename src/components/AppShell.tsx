import { Outlet, NavLink } from "react-router";
import { useState } from "react";
import { BarChart3, Bell, ClipboardList, CreditCard, LayoutDashboard, Package, Route, Receipt, ShoppingBasket, Sprout, Truck, Users } from "lucide-react";
import NotificationPanel from "./NotificationPanel";
import Sidebar, { ENABLED_HREFS } from "./Sidebar";
import { useAppStore } from "../store/appStore";

const bottomNav = {
  manager: [
    ["Dashboard", "/manager/dashboard", LayoutDashboard],
    ["Orders",    "/manager/orders",    ClipboardList],
    ["Runs",      "/manager/pickup-runs", Truck],
    ["Finance",   "/manager/finance",   CreditCard],
  ],
  buyer: [
    ["Dashboard", "/buyer/dashboard",   LayoutDashboard],
    ["Browse",    "/buyer/produce",     ShoppingBasket],
    ["Orders",    "/buyer/orders",      ClipboardList],
    ["Track delivery","/buyer/deliveries",  Route],
    ["Invoices",  "/buyer/invoices",    Receipt],
  ],
  farmer: [
    ["Dashboard", "/farmer/dashboard",  LayoutDashboard],
    ["Inventory", "/farmer/inventory",  Package],
    ["Allocations","/farmer/allocations", BarChart3],
    ["Pickups",   "/farmer/pickups",    Truck],
    ["Payments",  "/farmer/payments",   CreditCard],
  ],
} as const;

export default function AppShell() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const role = useAppStore((s) => s.role);
  const notice = useAppStore((s) => s.notice);
  const tabs = bottomNav[role];

  return (
    <div className="h-[100dvh] overflow-hidden" style={{ backgroundColor: "#ffffff" }}>
      <div className="flex h-full overflow-hidden">
        {/* Sidebar — desktop only */}
        <div className="hidden sm:flex">
          <Sidebar notificationsOpen={notificationsOpen} onToggleNotifications={() => setNotificationsOpen((open) => !open)} />
          <div className="w-px shrink-0 bg-slate-200" />
        </div>

        {/* Main content */}
        <main className="min-w-0 flex-1 overflow-y-auto bg-white p-4 sm:p-6 pb-20 sm:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white flex items-stretch" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {/* Bell tab */}
        <button
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium relative"
          style={{ color: notificationsOpen ? "#99C30C" : "#64748b" }}
          onClick={() => setNotificationsOpen((o) => !o)}
        >
          <Bell size={20} />
          <span>Alerts</span>
          {notice && <span className="absolute top-2 right-1/2 ml-3 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#FE8B02" }} />}
        </button>
        {tabs.map(([label, href, Icon]) => {
          const isLocked = !ENABLED_HREFS[role].includes(href);
          if (isLocked) {
            return (
              <div
                key={href}
                title={`${label} — not available in this prototype`}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium"
                style={{ color: "#cbd5e1", cursor: "not-allowed" }}
              >
                <Icon size={20} />
                <span>{label}</span>
              </div>
            );
          }
          return (
            <NavLink
              key={href}
              to={href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium"
              style={({ isActive }) => ({ color: isActive ? "#99C30C" : "#64748b" })}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Notifications panel */}
      {notificationsOpen ? (
        <div className="fixed inset-0 z-40">
          <button
            className="absolute inset-0 cursor-default bg-slate-950/10"
            aria-label="Close notifications"
            onClick={() => setNotificationsOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-sm border-l border-slate-200 bg-white p-4 shadow-2xl">
            <NotificationPanel onClose={() => setNotificationsOpen(false)} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
