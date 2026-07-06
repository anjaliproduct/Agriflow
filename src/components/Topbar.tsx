import { Bell, ChevronDown, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/appStore";
import { Role } from "../types";

const landing: Record<Role, string> = {
  manager: "/manager/dashboard",
  buyer: "/buyer/dashboard",
  farmer: "/farmer/dashboard",
};

export default function Topbar({
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
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-slate-100 px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-leaf text-white">
          <Leaf size={20} />
        </span>
        <div>
          <h1 className="text-base font-semibold text-slate-950">AgriFlow</h1>
          <p className="text-xs text-slate-500">Reduce coordination, not just digitize it.</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          className={`relative flex h-10 w-10 items-center justify-center rounded-md border text-slate-700 hover:bg-slate-50 ${notificationsOpen ? "border-leaf bg-field text-leaf" : "border-slate-200 bg-white"}`}
          aria-label={notificationsOpen ? "Close notifications" : "Open notifications"}
          onClick={onToggleNotifications}
        >
          <Bell size={18} />
          {notice ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-harvest ring-2 ring-white" /> : null}
        </button>
        <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-cream px-3 py-2 text-sm font-medium text-slate-700">
          Role
          <select
            className="bg-transparent font-semibold outline-none"
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
          <ChevronDown size={14} />
        </label>
      </div>
    </header>
  );
}
