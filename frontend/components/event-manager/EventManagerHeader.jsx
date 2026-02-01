"use client";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function EventManagerHeader({ managerName, onLogout }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    // Apply theme to document immediately
    const html = document.documentElement;
    if (savedTheme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const currentTheme = html.classList.contains("dark") ? "dark" : "light";
    const next = currentTheme === "light" ? "dark" : "light";

    // Update state
    setTheme(next);

    // Update localStorage
    localStorage.setItem("theme", next);

    // Apply theme to document immediately
    if (next === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    // Force a re-render by dispatching a custom event
    window.dispatchEvent(new Event("themechange"));
  };

  // Sync theme with DOM on mount and theme changes
  useEffect(() => {
    if (!mounted) return;

    const updateTheme = () => {
      const html = document.documentElement;
      const isDark = html.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    };

    // Initial sync
    updateTheme();

    // Listen for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    window.addEventListener("themechange", updateTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener("themechange", updateTheme);
    };
  }, [mounted]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleProfileClick = () => {
    router.push("/event-manager/profile");
    setShowProfileMenu(false);
  };

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    } else {
      try {
        const { default: api } = await import("@/lib/api");
        await api.post("/event-manager/logout");
      } catch(e){}
      localStorage.removeItem("event_manager_token");
      localStorage.removeItem("event_manager_name");
      localStorage.removeItem("event_manager_email");
      router.replace("/");
    }
    setShowProfileMenu(false);
  };

  if (!mounted) {
    // Prevent hydration mismatch by showing default
    return (
      <header className="fixed top-0 right-0 left-0 md:left-64 h-20 flex items-center bg-card-background dark:bg-[#0d1117] border-b border-light-gray-border z-30">
        <div className="w-full flex items-center justify-between px-4 sm:px-6 xl:px-8 gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="w-10 h-10 bg-gray-200 animate-pulse rounded-xl" />
        </div>
      </header>
    );
  }

  return (
    <header
      className="
        fixed top-0 right-0 left-0 md:left-64
        h-16 flex items-center
        bg-card-background dark:bg-[#0d1117]
        border-b border-light-gray-border dark:border-gray-800
        z-30
      "
    >
      <div className="w-full flex items-center justify-between px-4 sm:px-6 gap-2 sm:gap-4">
        {/* LEFT - PAGE TITLE */}
        {/* <div className="flex-1 min-w-0"> */}
<div className="flex items-center gap-4">

          <Image
                    src="/images/SGT-Logo.png"
                    alt="SGT"
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
          <h1 className="text-lg sm:text-xl font-semibold text-dark-text dark:text-white truncate">
            {getPageTitle(pathname)}
          </h1>
        </div>

{/* 
<div className="flex items-center gap-4">
        <Image
          src="/images/SGT-Logo.png"
          alt="SGT"
          width={48}
          height={48}
          className="rounded-full object-cover"
        />
        <h2 className="font-display font-bold text-xl lg:text-2xl">{pageTitle}</h2>
      </div> */}



        {/* RIGHT - ACTIONS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Button */}
          <button
            className="
              bg-blue-100 border border-blue-200 text-primary
              hover:bg-blue-200
              p-2 rounded-lg transition
            "
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">notifications</span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-light-gray-border hover:opacity-80 transition"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-primary text-xs sm:text-sm font-semibold">
                {managerName ? managerName.charAt(0).toUpperCase() : "EM"}
              </div>
              <span className="text-xs sm:text-sm font-medium text-dark-text hidden lg:block">
                {managerName || "Event Manager"}
              </span>
              <span className="material-symbols-outlined text-lg text-dark-text hidden lg:block">
                {showProfileMenu ? "expand_less" : "expand_more"}
              </span>
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card-background rounded-lg border border-light-gray-border shadow-soft z-50 overflow-hidden">
                <button
                  onClick={handleProfileClick}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-dark-text hover:bg-blue-50 transition text-left"
                >
                  <span className="material-symbols-outlined text-lg text-primary">person</span>
                  <span>Profile</span>
                </button>
                <div className="border-t border-light-gray-border"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-dark-text hover:bg-blue-50 transition text-left"
                >
                  <span className="material-symbols-outlined text-lg text-primary">logout</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function getPageTitle(pathname) {
  const titles = {
    "/event-manager": "Dashboard Overview",
    "/event-manager/events": "My Events",
    "/event-manager/events/create": "Create New Event",
    "/event-manager/volunteers": "Volunteer Management",
    "/event-manager/registrations": "Event Registrations",
    "/event-manager/analytics": "Analytics & Insights",
    "/event-manager/profile": "Profile & Settings",
  };

  // Handle dynamic routes (e.g., /event-manager/events/123)
  if (pathname.startsWith("/event-manager/events/") && pathname.split("/").length === 4) {
    return "Event Details";
  }

  return titles[pathname] || "Dashboard Overview";
}
