import { BarChart3, Bell, ChevronDown, ClipboardList, CreditCard, LayoutDashboard, Leaf, Package, PanelLeftClose, PanelLeftOpen, Receipt, Route, ShoppingBasket, Sprout, Truck, Users } from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  ],
  buyer: [
    ["Dashboard", "/buyer/dashboard", LayoutDashboard],
    ["Browse Produce", "/buyer/produce", ShoppingBasket],
    ["My Orders", "/buyer/orders", ClipboardList],
    ["Track delivery", "/buyer/deliveries", Route],
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

const activeStyle = { backgroundColor: "#ffffff18", color: "#ffffff", fontWeight: 600 };
const inactiveColor = "#ffffffcc";

const navLinkStyle = ({ isActive }: { isActive: boolean }) =>
  isActive ? activeStyle : { color: inactiveColor };

const hoverOn = (e: React.MouseEvent<HTMLElement>) => {
  const t = e.currentTarget;
  if (!t.getAttribute("aria-current")) {
    t.style.color = "#ffffff";
    t.style.backgroundColor = "#ffffff12";
  }
};
const hoverOff = (e: React.MouseEvent<HTMLElement>) => {
  const t = e.currentTarget;
  if (!t.getAttribute("aria-current")) {
    t.style.color = inactiveColor;
    t.style.backgroundColor = "transparent";
  }
};

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
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(true);
  const [directoryOpen, setDirectoryOpen] = useState(true);
  const [financeOpen, setFinanceOpen] = useState(true);

  const managerDirectory = [
    ["Inventory", "/manager/inventory", Package],
    ["Farmers", "/manager/farmers", Sprout],
    ["Buyers", "/manager/buyers", Users],
  ] as const;

  const financeItems = [
    ["Overview", "/manager/finance", LayoutDashboard],
    ["Invoices", "/manager/finance/invoices", Receipt],
    ["Payouts", "/manager/finance/payouts", CreditCard],
  ] as const;

  const isOnFinance = location.pathname.startsWith("/manager/finance");

  return (
    <aside
      className="relative flex h-full shrink-0 flex-col overflow-y-auto overflow-x-hidden transition-all duration-200"
      style={{ width: collapsed ? 72 : 220, backgroundColor: "#141f14" }}
    >
      {/* Logo + role selector */}
      <div
        className={`flex h-14 shrink-0 items-center px-3 ${collapsed ? "justify-center" : "justify-between gap-2"}`}
        style={{ borderBottom: "1px solid #ffffff10" }}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "#99C30C" }}>
          <Leaf size={17} className="text-white" />
        </span>
        {!collapsed && (
          <select
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none"
            value={role}
            onChange={(e) => {
              const next = e.target.value as Role;
              setRole(next);
              navigate(landing[next]);
            }}
          >
            <option value="manager" style={{ color: "#000", backgroundColor: "#fff" }}>Manager</option>
            <option value="buyer" style={{ color: "#000", backgroundColor: "#fff" }}>Buyer</option>
            <option value="farmer" style={{ color: "#000", backgroundColor: "#fff" }}>Farmer</option>
          </select>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 px-2 py-3 ${collapsed ? "space-y-2" : "space-y-0.5"}`}>

        {/* Main nav items */}
        {nav[role].map(([label, href, Icon]) => (
          <NavLink
            key={href}
            to={href}
            title={collapsed ? label : undefined}
            className={collapsed
              ? "mx-auto flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
              : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"}
            style={navLinkStyle}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}
          >
            <Icon size={18} />
            {!collapsed && label}
          </NavLink>
        ))}

        {/* Finance section — manager only */}
        {role === "manager" && (
          <div className={collapsed ? "" : "pt-3"}>
            {collapsed ? (
              <div className="space-y-2">
                <div className="mx-3 border-t" style={{ borderColor: "#ffffff18" }} />
                {financeItems.map(([label, href, Icon]) => (
                  <NavLink
                    key={href}
                    to={href}
                    end={href === "/manager/finance"}
                    title={label}
                    className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
                    style={navLinkStyle}
                    onMouseEnter={hoverOn}
                    onMouseLeave={hoverOff}
                  >
                    <Icon size={18} />
                  </NavLink>
                ))}
              </div>
            ) : (
              <>
                <button
                  className="mb-0.5 flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors"
                  style={{ color: "#ffffff66" }}
                  type="button"
                  onClick={() => setFinanceOpen((o) => !o)}
                >
                  Finance
                  <ChevronDown size={13} className={financeOpen ? "" : "-rotate-90"} />
                </button>
                {financeOpen && (
                  <div className="space-y-0.5">
                    {financeItems.map(([label, href, Icon]) => (
                      <NavLink
                        key={href}
                        to={href}
                        end={href === "/manager/finance"}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                        style={navLinkStyle}
                        onMouseEnter={hoverOn}
                        onMouseLeave={hoverOff}
                      >
                        <Icon size={18} />
                        {label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Directory section — manager only */}
        {role === "manager" && (
          <div className={collapsed ? "" : "pt-3"}>
            {collapsed ? (
              <div className="space-y-2">
                <div className="mx-3 border-t" style={{ borderColor: "#ffffff18" }} />
                {managerDirectory.map(([label, href, Icon]) => (
                  <NavLink
                    key={href}
                    to={href}
                    title={label}
                    className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
                    style={navLinkStyle}
                    onMouseEnter={hoverOn}
                    onMouseLeave={hoverOff}
                  >
                    <Icon size={18} />
                  </NavLink>
                ))}
              </div>
            ) : (
              <>
                <button
                  className="mb-0.5 flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors"
                  style={{ color: "#ffffff66" }}
                  type="button"
                  onClick={() => setDirectoryOpen((o) => !o)}
                >
                  Directory
                  <ChevronDown size={13} className={directoryOpen ? "" : "-rotate-90"} />
                </button>
                {directoryOpen && (
                  <div className="space-y-0.5">
                    {managerDirectory.map(([label, href, Icon]) => (
                      <NavLink
                        key={href}
                        to={href}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                        style={navLinkStyle}
                        onMouseEnter={hoverOn}
                        onMouseLeave={hoverOff}
                      >
                        <Icon size={18} />
                        {label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 px-2 py-2" style={{ borderTop: "1px solid #ffffff10" }}>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={`flex w-full items-center gap-3 rounded-lg py-2 text-sm transition-colors ${collapsed ? "justify-center px-0" : "px-3"}`}
          style={{ color: "#ffffff66" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#ffffff"; e.currentTarget.style.backgroundColor = "#ffffff12"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#ffffff33"; e.currentTarget.style.backgroundColor = "transparent"; }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /><span className="text-xs">Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
