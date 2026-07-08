import { BarChart3, Bell, Check, ChevronDown, ClipboardList, CreditCard, LayoutDashboard, Leaf, Package, PanelLeftClose, PanelLeftOpen, Receipt, Route, ShoppingBasket, Sprout, Truck, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/appStore";
import { Role } from "../types";

const landing: Record<Role, string> = {
  manager: "/manager/orders",
  buyer: "/buyer/produce",
  farmer: "/farmer/dashboard",
};

// This prototype only wires up one module per role end-to-end; the rest are shown but locked.
export const ENABLED_HREFS: Record<Role, string[]> = {
  manager: ["/manager/orders", "/manager/finance"],
  buyer: ["/buyer/produce"],
  farmer: ["/farmer/dashboard"],
};

const roleLabels: Record<Role, string> = { manager: "Manager", buyer: "Buyer", farmer: "Farmer" };

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

// Collapsed rail: keep icons uniformly white (no dimming) for visual balance.
const collapsedNavLinkStyle = ({ isActive }: { isActive: boolean }) =>
  isActive ? activeStyle : { color: "#ffffff" };

const hoverOn = (e: React.MouseEvent<HTMLElement>) => {
  const t = e.currentTarget;
  if (!t.getAttribute("aria-current")) {
    t.style.color = "#ffffff";
    t.style.backgroundColor = "#ffffff12";
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
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roleMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setRoleMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [roleMenuOpen]);

  const isLocked = (r: Role, href: string) => !ENABLED_HREFS[r].includes(href);

  const hoverOff = (e: React.MouseEvent<HTMLElement>) => {
    const t = e.currentTarget;
    if (!t.getAttribute("aria-current")) {
      t.style.color = collapsed ? "#ffffff" : inactiveColor;
      t.style.backgroundColor = "transparent";
    }
  };

  function renderItem(label: string, href: string, Icon: React.ElementType, opts?: { end?: boolean }) {
    if (isLocked(role, href)) {
      return (
        <div
          key={href}
          title={`${label} — not available in this prototype`}
          className={collapsed
            ? "mx-auto flex h-10 w-10 items-center justify-center rounded-lg"
            : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"}
          style={{ color: collapsed ? "#ffffff" : "#ffffff40", cursor: "not-allowed" }}
        >
          <Icon size={18} />
          {!collapsed && label}
        </div>
      );
    }
    return (
      <NavLink
        key={href}
        to={href}
        end={opts?.end}
        title={collapsed ? label : undefined}
        className={collapsed
          ? "mx-auto flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
          : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"}
        style={collapsed ? collapsedNavLinkStyle : navLinkStyle}
        onMouseEnter={hoverOn}
        onMouseLeave={hoverOff}
      >
        <Icon size={18} />
        {!collapsed && label}
      </NavLink>
    );
  }

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
      {/* Logo + role switcher */}
      <div
        className={`relative flex h-14 shrink-0 items-center px-3 ${collapsed ? "justify-center" : "justify-between gap-2"}`}
        style={{ borderBottom: "1px solid #ffffff10" }}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: "#99C30C" }}>
          <Leaf size={17} className="text-white" />
        </span>
        {!collapsed && (
          <div ref={roleMenuRef} className="relative min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setRoleMenuOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: roleMenuOpen ? "#ffffff1a" : "transparent" }}
              onMouseEnter={(e) => { if (!roleMenuOpen) e.currentTarget.style.backgroundColor = "#ffffff12"; }}
              onMouseLeave={(e) => { if (!roleMenuOpen) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <span className="truncate">{roleLabels[role]}</span>
              <ChevronDown size={14} className={`shrink-0 text-white/60 transition-transform ${roleMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {roleMenuOpen && (
              <div
                className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-slate-100 bg-white py-1.5"
                style={{ boxShadow: "0 4px 6px rgba(0,0,0,0.05), 0 10px 24px rgba(0,0,0,0.12)" }}
              >
                {(Object.keys(roleLabels) as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      navigate(landing[r]);
                      setRoleMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50"
                    style={{ color: r === role ? "#324D1D" : "#334155", fontWeight: r === role ? 600 : 500 }}
                  >
                    {roleLabels[r]}
                    {r === role && <Check size={14} style={{ color: "#4A7C20" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 px-2 py-3 ${collapsed ? "space-y-2" : "space-y-0.5"}`}>

        {/* Main nav items */}
        {nav[role].map(([label, href, Icon]) => renderItem(label, href, Icon))}

        {/* Finance section — manager only */}
        {role === "manager" && (
          <div className={collapsed ? "" : "pt-3"}>
            {collapsed ? (
              <div className="space-y-2">
                <div className="mx-3 border-t" style={{ borderColor: "#ffffff18" }} />
                {financeItems.map(([label, href, Icon]) => renderItem(label, href, Icon, { end: href === "/manager/finance" }))}
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
                    {financeItems.map(([label, href, Icon]) => renderItem(label, href, Icon, { end: href === "/manager/finance" }))}
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
                {managerDirectory.map(([label, href, Icon]) => renderItem(label, href, Icon))}
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
                    {managerDirectory.map(([label, href, Icon]) => renderItem(label, href, Icon))}
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
