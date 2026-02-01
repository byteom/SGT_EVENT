"use client";

import { usePathname, useRouter } from "next/navigation";

export default function VolunteerSidebar({ onLogout }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside
      className="hidden lg:flex lg:sticky lg:top-0 lg:self-start w-64 min-h-screen flex-col
      bg-card-background border-r border-light-gray-border p-6"
    >
      {/* TOP TITLE */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <h2 className="font-bold text-xl text-center text-primary">
          Volunteer Panel
        </h2>
      </div>

      {/* NAV LINKS */}
      <SidebarLink
        label="Dashboard"
        icon="home"
        active={pathname === "/volunteer"}
        onClick={() => router.push("/volunteer")}
      />

      <SidebarLink
        label="Scan"
        icon="qr_code_scanner"
        active={pathname === "/volunteer/scanner"}
        onClick={() => router.push("/volunteer/scanner")}
      />

      <SidebarLink
        label="Profile"
        icon="person"
        active={pathname === "/volunteer/profile"}
        onClick={() => router.push("/volunteer/profile")}
      />

      {/* LOGOUT FIXED AT BOTTOM */}
      <div className="mt-auto w-full">
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

/* ------------------------------------------
      Sidebar Link Component
------------------------------------------- */
function SidebarLink({ label, icon, active, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition
        ${
          danger
            ? "text-red-500 hover:bg-red-100"
            : active
            ? "bg-blue-100 text-primary border border-blue-200"
            : "text-gray-700 hover:bg-gray-100"
        }
      `}
    >
      <span className="material-symbols-outlined">{icon}</span>
      {label}
    </button>
  );
}
