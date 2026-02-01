"use client";

import { usePathname, useRouter } from "next/navigation";

export default function EventManagerSidebar({ onLogout }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside
      className="
        hidden md:flex flex-col fixed left-0 top-0 h-screen w-64
        bg-card-background dark:bg-dark-background
        border-r border-light-gray-border
        shadow-soft z-40
      "
    >
      {/* TOP BRAND */}
      <div className="h-16 flex items-center px-6 border-b border-light-gray-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl 
            bg-blue-100 border border-blue-200 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">S</span>
          </div>

          <h2 className="text-base font-semibold text-dark-text">
            SGT University
          </h2>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        <SidebarLink
          label="Dashboard"
          icon="dashboard"
          active={pathname === "/event-manager"}
          onClick={() => router.push("/event-manager")}
        />

        <SidebarLink
          label="My Events"
          icon="event"
          active={
            pathname.startsWith("/event-manager/events") &&
            pathname !== "/event-manager/events/create"
          }
          onClick={() => router.push("/event-manager/events")}
        />

        <SidebarLink
          label="Create Event"
          icon="add_circle"
          active={pathname === "/event-manager/events/create"}
          onClick={() => router.push("/event-manager/events/create")}
        />

        <SidebarLink
          label="Analytics"
          icon="analytics"
          active={pathname === "/event-manager/analytics"}
          onClick={() => router.push("/event-manager/analytics")}
        />

        <SidebarLink
          label="Profile"
          icon="person"
          active={pathname === "/event-manager/profile"}
          onClick={() => router.push("/event-manager/profile")}
        />
      </div>

      {/* LOGOUT */}
      <div className="p-4 border-t border-light-gray-border">
        <button
          onClick={onLogout}
          className="
            flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium
            text-red-600 hover:bg-red-100
            transition-all
          "
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          Logout
        </button>
      </div>

      {/* USER FOOTER */}
      {/* <div className="p-4 border-t border-light-gray-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700
            flex items-center justify-center">
            <span className="material-symbols-outlined text-lg text-dark-text dark:text-gray-300">
              manage_accounts
            </span>
          </div>

          <div>
            <p className="text-sm font-semibold text-dark-text dark:text-white">
              Event Manager
            </p>
            <p className="text-xs text-gray-700 dark:text-gray-700">
              Event Management
            </p>
          </div>


          
        </div>
      </div> */}
    </aside>
  );
}


/* ----------------------------------------
   Sidebar Link Component (VARIABLE BASED)
---------------------------------------- */
function SidebarLink({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm transition-all
        ${
          active
            ? "bg-blue-100 text-primary border border-blue-200 font-semibold"
            : "text-dark-text hover:bg-gray-100"
        }
      `}
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
      {label}
    </button>
  );
}
