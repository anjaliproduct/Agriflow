import { Bell, X } from "lucide-react";
import { useAppStore } from "../store/appStore";

export default function NotificationPanel({ onClose }: { onClose?: () => void }) {
  const notice = useAppStore((state) => state.notice);
  const clearNotice = useAppStore((state) => state.clearNotice);
  return (
    <div className="h-full">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Bell size={16} className="text-leaf" />
          Notifications
        </div>
        {onClose ? (
          <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Close notifications" onClick={onClose}>
            <X size={18} />
          </button>
        ) : null}
      </div>
      <div className="mt-4 rounded-md bg-field p-3 text-sm text-slate-700">
        {notice ?? "No urgent updates. Allocation, pickup, invoice, and payment events will appear here."}
      </div>
      {notice ? (
        <button className="mt-3 text-sm font-semibold text-leaf" onClick={clearNotice}>
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
