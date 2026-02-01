"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useStudentAuth } from "@/hooks/useAuth";

// NEW COMPONENTS
import StudentSidebar from "@/components/student/StudentSidebar";
import StudentHeader from "@/components/student/StudentHeader";
import StudentMobileNav from "@/components/student/StudentMobileNav";

export default function StudentDashboardPage() {
  const { isAuthenticated, isChecking } = useStudentAuth();
  const router = useRouter();
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  const handleLogout = async () => {
    try {
      await api.post("/student/logout");
    } catch (error) {
      // Logout even if API call fails
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/";
    }
  };

  const goTo = (path) => router.push(path);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-soft-background flex items-center justify-center">
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
    <div className="bg-soft-background font-sans text-dark-text antialiased min-h-screen flex">

      {/* LEFT SIDEBAR */}
      <StudentSidebar onLogout={handleLogout} />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">

        {/* TOP HEADER */}
        <StudentHeader theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} />

        {/* BODY CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 pb-32 sm:p-6 lg:p-8 lg:pb-10">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* 🌟 CONTEST RULES HERO */}
            <section className="bg-blue-100 rounded-3xl overflow-hidden shadow-soft border border-blue-200">
              <div className="p-8 flex flex-col items-start gap-5">

                <div className="flex items-center gap-4">
                  <div className="flex w-14 h-14 items-center justify-center rounded-full bg-white ring-1 ring-blue-200">
                    <span
                      className="material-symbols-outlined text-primary"
                      style={{ fontSize: "40px", fontVariationSettings: "'FILL' 1, 'wght' 500" }}
                    >
                      military_tech
                    </span>
                  </div>

                  <div>
                    <h2 className="font-display text-3xl font-bold tracking-[-0.02em] text-gray-800">
                      Contest Rules
                    </h2>
                    <p className="text-sm text-gray-600">
                      How to be eligible for prizes
                    </p>
                  </div>
                </div>

                <ul className="text-gray-700 text-sm font-medium space-y-3 mt-4">
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                    <span>Visit a minimum of 10 stalls and get your QR code scanned.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                    <span>Submit feedback for at least 5 stalls you visited.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                    <span>Rank your top 3 favorite stalls before the event ends.</span>
                  </li>
                </ul>

              </div>
            </section>

            {/* 🎴 CARDS */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              <div className="bg-card-background border border-light-gray-border rounded-2xl p-8 shadow-soft hover:shadow-md hover:-translate-y-1 transition">
                <div className="flex items-center gap-5">
                  <div className="bg-blue-100 w-14 h-14 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary !text-3xl">rate_review</span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold">Stall Feedback</h3>
                    <p className="text-gray-700 mt-1">Share your experience about the stalls you visited.</p>
                  </div>
                </div>

                <button
                  onClick={() => goTo("/student/stall-scan")}
                  className="mt-8 w-full font-semibold py-3 px-6 rounded-xl bg-blue-100 text-primary border border-blue-200 hover:bg-blue-200 transition"
                >
                  Give Feedback
                </button>
              </div>

              <div className="bg-card-background border border-light-gray-border rounded-2xl p-8 shadow-soft hover:shadow-md hover:-translate-y-1 transition">
                <div className="flex items-center gap-5">
                  <div className="bg-blue-100 w-14 h-14 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary !text-3xl">emoji_events</span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold">Stall Ranking</h3>
                    <p className="text-gray-700 mt-1">Vote for your favorite stalls to help them win.</p>
                  </div>
                </div>

                <button
                  onClick={() => goTo("/student/ranking")}
                  className="mt-8 w-full font-semibold py-3 px-6 rounded-xl bg-blue-100 text-primary border border-blue-200 hover:bg-blue-200 transition"
                >
                  Start Ranking
                </button>
              </div>

            </section>
          </div>
        </main>
      </div>

      {/* 📱 MOBILE NAV */}
      <StudentMobileNav />

    </div>
  );
}
