// "use client";

// import { usePathname, useRouter } from "next/navigation";

// export default function AdminSidebar({ onLogout }) {
//   const pathname = usePathname();
//   const router = useRouter();

//   return (
//     <aside className="hidden lg:flex flex-col w-64 
//       bg-card-light dark:bg-card-dark 
//       border-r border-light-gray-border dark:border-gray-800 p-6">

//       {/* LOGO */}
//       <div className="flex items-center justify-center gap-2 mb-10">
//         <h2 className="font-bold text-xl text-primary">Admin Panel</h2>
//       </div>

//       <SidebarLink
//         label="Dashboard"
//         icon="dashboard"
//         active={pathname === "/admin"}
//         onClick={() => router.push("/admin")}
//       />

//       <SidebarLink
//         label="Volunteers"
//         icon="group"
//         active={pathname === "/admin/volunteers"}
//         onClick={() => router.push("/admin/volunteers")}
//       />

//       <SidebarLink
//         label="Students"
//         icon="school"
//         active={pathname === "/admin/students"}
//         onClick={() => router.push("/admin/students")}
//       />

//       <SidebarLink
//         label="Stalls"
//         icon="store"
//         active={pathname === "/admin/stalls"}
//         onClick={() => router.push("/admin/stalls")}
//       />

//       <SidebarLink
//         label="Scan Logs"
//         icon="qr_code_scanner"
//         active={pathname === "/admin/logs"}
//         onClick={() => router.push("/admin/logs")}
//       />

//       {/* LOGOUT */}
//       <div className="mt-auto">
//         <SidebarLink
//           label="Logout"
//           icon="logout"
//           danger
//           onClick={onLogout}
//         />
//       </div>
//     </aside>
//   );
// }

// function SidebarLink({ label, icon, active, danger, onClick }) {
//   return (
//     <button
//       onClick={onClick}
//       className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition
//       ${
//         danger
//           ? "text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
//           : active
//           ? "bg-blue-100 text-primary dark:bg-blue-900/30 dark:text-blue-300"
//           : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
//       }`}
//     >
//       <span className="material-symbols-outlined">{icon}</span>
//       {label}
//     </button>
//   );
// }





"use client";

import { usePathname, useRouter } from "next/navigation";

export default function AdminSidebar({ onLogout }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside
      className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0
      bg-card-background border-r border-light-gray-border z-40"
    >
      {/* TOP BRAND */}
      <div className="h-16 flex items-center px-6 border-b border-light-gray-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl
            bg-blue-100 border border-blue-200 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">S</span>
          </div>

          <h2 className="text-base font-semibold text-dark-text dark:text-white">
            SGT University
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">

        <SidebarLink
          label="Dashboard"
          icon="home"
          active={pathname === "/admin"}
          onClick={() => router.push("/admin")}
        />

        <SidebarLink
          label="Events"
          icon="event"
          active={pathname === "/admin/events"}
          onClick={() => router.push("/admin/events")}
        />

        <SidebarLink
          label="Event Managers"
          icon="manage_accounts"
          active={pathname === "/admin/event-managers"}
          onClick={() => router.push("/admin/event-managers")}
        />

        <SidebarLink
          label="Volunteers"
          icon="groups"
          active={pathname === "/admin/volunteers"}
          onClick={() => router.push("/admin/volunteers")}
        />

        <SidebarLink
          label="Students"
          icon="school"
          active={pathname === "/admin/students"}
          onClick={() => router.push("/admin/students")}
        />

        <SidebarLink
          label="Stalls"
          icon="store"
          active={pathname === "/admin/stalls"}
          onClick={() => router.push("/admin/stalls")}
        />

        <SidebarLink
          label="Analytics"
          icon="analytics"
          active={pathname === "/admin/analytics"}
          onClick={() => router.push("/admin/analytics")}
        />

        <SidebarLink
          label="Profile"
          icon="person"
          active={pathname === "/admin/settings"}
          onClick={() => router.push("/admin/settings")}
        />
      </div>

      {/* LOGOUT BUTTON */}
      <div className="px-3 pb-4">
        <SidebarLink
          label="Logout"
          icon="logout"
          danger
          onClick={onLogout}
        />
      </div>
    </aside>
  );
}

function SidebarLink({ label, icon, active, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 w-full px-4 py-2.5 rounded-lg mb-1 transition-all text-sm
        ${danger
          ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
          : active
          ? "bg-blue-50 text-primary dark:bg-blue-900/30 dark:text-blue-300 font-medium"
          : "text-dark-text hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50"}
      `}
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
