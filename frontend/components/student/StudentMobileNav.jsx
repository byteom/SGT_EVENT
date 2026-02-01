"use client";

import { usePathname, useRouter } from "next/navigation";

export default function StudentMobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const items = [
    { icon: "home", label: "Home", path: "/student" },
    { icon: "event", label: "Events", path: "/student/events" },
    { icon: "qr_code_2", label: "My QR", path: "/student/qr" },
    { icon: "person", label: "Profile", path: "/student/profile" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-soft-background border-t border-light-gray-border shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-4 gap-1 p-2 max-w-3xl mx-auto">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center py-2 rounded-xl 
                ${
                  pathname === item.path
                    ? "text-primary font-semibold bg-blue-50"
                    : "text-gray-700"
                }
              `}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
      {/* Spacer ensures page content clears the fixed mobile nav */}
      <div className="h-24 lg:hidden pointer-events-none" aria-hidden="true" />
    </>
  );
}
