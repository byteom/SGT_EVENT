"use client";

import { usePathname, useRouter } from "next/navigation";

export default function VolunteerMobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const NavBtn = ({ label, icon, href }) => (
    <button
      onClick={() => router.push(href)}
      className={`flex flex-col items-center py-2 rounded-xl
        ${
          pathname === href
            ? "text-primary font-semibold bg-blue-50"
            : "text-gray-700"
        }`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="text-xs">{label}</span>
    </button>
  );

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 
    bg-soft-background 
    border-t border-light-gray-border shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">

      <div className="grid grid-cols-2 gap-1 p-2 max-w-md mx-auto">
        <NavBtn label="Home" icon="home" href="/volunteer" />
        <NavBtn label="Profile" icon="person" href="/volunteer/profile" />
      </div>
    </nav>
  );
}
