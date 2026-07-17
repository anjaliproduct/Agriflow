import { Outlet, NavLink } from "react-router";
import { useState } from "react";
import { ClipboardList, CreditCard, ShoppingBasket, Sprout } from "lucide-react";
import NotificationPanel from "./NotificationPanel";
import Sidebar from "./Sidebar";
import { useAppStore } from "../store/appStore";
import { Role } from "../types";

// Fixed cross-role shortcuts for the mobile bottom nav — each tab switches
// role and lands on that role's wired-up module, since mobile has no other
// way to switch roles (the role switcher lives in the desktop sidebar).
const MOBILE_NAV: { label: string; href: string; role: Role; icon: typeof Sprout }[] = [
  { label: "Farmer",  href: "/farmer/dashboard", role: "farmer",  icon: Sprout },
  { label: "Orders",  href: "/manager/orders",   role: "manager", icon: ClipboardList },
  { label: "Finance", href: "/manager/finance",  role: "manager", icon: CreditCard },
  { label: "Browse",  href: "/buyer/produce",    role: "buyer",   icon: ShoppingBasket },
];

export default function AppShell() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const setRole = useAppStore((s) => s.setRole);

  return (
    <div className="h-[100dvh] overflow-hidden" style={{ backgroundColor: "#141f14" }}>
      <div className="flex h-full overflow-hidden">
        {/* Sidebar — desktop only */}
        <div className="hidden sm:flex">
          <Sidebar notificationsOpen={notificationsOpen} onToggleNotifications={() => setNotificationsOpen((open) => !open)} />
        </div>

        {/* Main content */}
        <main className="my-2 min-w-0 flex-1 overflow-y-auto rounded-tl-xl rounded-bl-xl bg-white p-4 sm:p-6 pb-20 sm:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav — fixed cross-role shortcuts */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white flex items-stretch" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {MOBILE_NAV.map(({ label, href, role, icon: Icon }) => (
          <NavLink
            key={href}
            to={href}
            onClick={() => setRole(role)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium"
            style={({ isActive }) => ({ color: isActive ? "#99C30C" : "#64748b" })}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
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
