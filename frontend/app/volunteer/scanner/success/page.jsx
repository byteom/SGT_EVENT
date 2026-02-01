"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useVolunteerAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

import VolunteerSidebar from "@/components/volunteer/VolunteerSidebar";
import VolunteerHeader from "@/components/volunteer/VolunteerHeader";
import VolunteerMobileNav from "@/components/volunteer/VolunteerMobileNav";

function ScanSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();

  const name = params.get("name");
  const reg = params.get("reg");
  const type = params.get("type");
  const scanCount = params.get("count");

  const [theme, setTheme] = useState("light");
  const [isIn, setIsIn] = useState(true);
  const [countdown, setCountdown] = useState(2); // Fast redirect: 2 seconds

  useEffect(() => {
    setIsIn(type === "IN");
  }, [type]);

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  // Fast auto-redirect countdown (2 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push("/volunteer/scanner");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const handleLogout = () => {
    api.post("/volunteer/logout", {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    }).finally(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("volunteer_name");
      window.location.href = "/";
    });
  };

  return (
    <div className="flex min-h-screen bg-soft-background#0d1220]">

      {/* LEFT SIDEBAR */}
      <VolunteerSidebar onLogout={handleLogout} />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <VolunteerHeader
          theme={theme}
          toggleTheme={toggleTheme}
          volunteerName={"Volunteer"}
          onLogout={handleLogout}
        />

        {/* MAIN CONTENT - Optimized for High Volume */}
        <main className="flex flex-col items-center justify-center px-4 py-12 lg:py-20">

          {/* SUCCESS CARD - Compact & Fast */}
          <div className="bg-card-background rounded-3xl p-8 lg:p-10 shadow-soft max-w-lg w-full">

            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg
                ${isIn 
                  ? "bg-green-100" 
                  : "bg-yellow-100"}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-14 h-14 ${isIn ? "text-green-600" : "text-yellow-600"}`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  {isIn ? (
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4.5-4.5 1.41-1.41L10 13.17l7.09-7.09L18.5 7.5 10 16.5z" />
                  ) : (
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  )}
                </svg>
              </div>
            </div>

            {/* Status Title */}
            <h1 className="text-3xl lg:text-4xl font-bold text-center mb-2 text-dark-text">
              {isIn ? "Checked In ✓" : "Checked Out ✓"}
            </h1>

            <p className="text-center text-gray-700 text-sm mb-6">
              Scan recorded successfully
            </p>

            {/* Student Info - Highlighted */}
            <div className="bg-soft-background#0d1220] border-2 border-primary rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-xl">person</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg text-dark-text truncate">{name}</p>
                  <p className="text-sm text-gray-700">ID: {reg}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between pt-3 border-t border-light-gray-border">
                <span className="text-sm text-gray-700">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold
                  ${isIn 
                    ? "bg-green-100 text-green-700" 
                    : "bg-yellow-100 text-yellow-700"}`}>
                  {isIn ? "INSIDE EVENT" : "EXITED EVENT"}
                </span>
              </div>

              {scanCount && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-gray-700">Total Scans</span>
                  <span className="text-sm font-bold text-primary">{scanCount}</span>
                </div>
              )}
            </div>

            {/* Auto-Redirect Progress */}
            <div className="relative mb-6">
              <div className="flex items-center justify-center gap-2 text-primary mb-2">
                <span className="material-symbols-outlined text-xl animate-spin">refresh</span>
                <span className="font-semibold text-sm">
                  Next scan in {countdown}s
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 2) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => router.push("/volunteer/scanner")}
              className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl
              shadow-soft hover:shadow-lg active:scale-95 transition-all text-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">qr_code_scanner</span>
                Scan Next
              </span>
            </button>

            {/* Secondary Action */}
            <button
              onClick={() => router.push("/volunteer")}
              className="w-full mt-3 py-3 text-gray-700 hover:text-primary font-medium transition-colors text-sm"
            >
              Back to Dashboard
            </button>

          </div>

        </main>
      </div>

      {/* MOBILE NAV */}
      <VolunteerMobileNav />
    </div>
  );
}

export default function ScanSuccessPage() {
  const { isAuthenticated, isChecking } = useVolunteerAuth();

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-soft-background#0d1220] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-dark-text">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-soft-background#0d1220] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-dark-text mt-4">Loading...</p>
        </div>
      </div>
    }>
      <ScanSuccessContent />
    </Suspense>
  );
}
