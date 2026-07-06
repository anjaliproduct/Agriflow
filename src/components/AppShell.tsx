import { Outlet } from "react-router";
import { useState } from "react";
import NotificationPanel from "./NotificationPanel";
import Sidebar from "./Sidebar";

export default function AppShell() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-slate-100">
      <div className="flex h-screen overflow-hidden">
        <Sidebar notificationsOpen={notificationsOpen} onToggleNotifications={() => setNotificationsOpen((open) => !open)} />
        <main className="min-w-0 flex-1 overflow-y-auto bg-white p-6">
          <Outlet />
        </main>
      </div>
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
