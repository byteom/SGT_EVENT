"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function VolunteerHeader({ theme, toggleTheme, volunteerName, onLogout }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const goToProfile = () => {
    router.push("/volunteer/profile");
    setMenuOpen(false);
  };

  const handleLogoutClick = () => {
    setMenuOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-card-background border-b border-light-gray-border flex items-center justify-between h-20 px-6 lg:px-10">

      <div className="flex items-center gap-4">
        <Image
          src="/images/SGT-Logo.png"
          width={48}
          height={48}
          alt="Logo"
          className="rounded-full"
        />

        <div>
          <h2 className="font-bold text-xl lg:text-2xl">
            Welcome, {volunteerName}
          </h2>
          <p className="text-sm text-gray-700">Event Volunteer – SGT University</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="p-2 bg-blue-100 border border-blue-200 rounded-lg hover:bg-blue-200 transition"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined text-primary">notifications</span>
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card-background border border-light-gray-border text-sm font-semibold text-dark-text hover:bg-gray-50 transition"
          >
            <span className="material-symbols-outlined text-primary">account_circle</span>
            <span className="hidden sm:inline">Profile</span>
            <span className="material-symbols-outlined text-base">expand_more</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-light-gray-border bg-card-background shadow-soft overflow-hidden">
              <button
                onClick={goToProfile}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-dark-text hover:bg-gray-50 transition"
              >
                <span className="material-symbols-outlined text-primary">person</span>
                Profile
              </button>
              <button
                onClick={handleLogoutClick}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 transition"
              >
                <span className="material-symbols-outlined">logout</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

    </header>
  );
}
