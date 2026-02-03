"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useStudentAuth } from "@/hooks/useAuth";

import StudentSidebar from "@/components/student/StudentSidebar";
import StudentHeader from "@/components/student/StudentHeader";
import StudentMobileNav from "@/components/student/StudentMobileNav";

export default function MyVisitsPage() {
  const { isAuthenticated, isChecking } = useStudentAuth();
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(true);

  const [visits, setVisits] = useState([]);
  const [totalEventVisits, setTotalEventVisits] = useState(0);
  const [totalFeedbacks, setTotalFeedbacks] = useState(0);

  // ---------------------- THEME ----------------------
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  // ---------------------- LOGOUT ----------------------
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

  // ---------------------- API LOAD ----------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/student/my-visits", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (res.data?.success) {
          setTotalEventVisits(res.data.data.total_event_visits || 0);
          setTotalFeedbacks(res.data.data.total_feedbacks || 0);
          setVisits(res.data.data.visits || []);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
      setLoading(false);
    }

    load();
  }, []);

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

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="flex bg-soft-background font-sans text-dark-text antialiased">

      {/* ---------------- FIXED SIDEBAR ---------------- */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-64">
        <StudentSidebar onLogout={handleLogout} />
      </div>

      {/* ---------------- RIGHT CONTENT AREA ---------------- */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* FIXED HEADER */}
        <div className="sticky top-0 z-40">
          <StudentHeader theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} />
        </div>

        {/* ONLY MAIN CONTENT SCROLLS */}
        <main className="flex-1 overflow-y-auto p-4 pb-32 sm:p-6 lg:p-8 lg:pb-10">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* PAGE TITLE */}
            <h1 className="text-3xl text-center font-display font-bold tracking-tight">
              My Visits
            </h1>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              <SummaryCard
                title="Events Visited"
                value={totalEventVisits}
                icon="event_available"
                iconColor="text-primary"
                bgColor="bg-blue-100"
              />

              <SummaryCard
                title="Total Feedback Given"
                value={totalFeedbacks}
                icon="rate_review"
                iconColor="text-green-600"
                bgColor="bg-green-100"
              />

            </div>

            {/* VISITS LIST */}
            <div className="space-y-4">
              {visits.length === 0 && (
                <p className="text-gray-700 text-lg">No event visits yet. Get checked in by a volunteer to start!</p>
              )}

              {visits.map((event, i) => (
                <EventVisitCard key={i} event={event} />
              ))}
            </div>

          </div>
        </main>

        {/* MOBILE NAV */}
        <StudentMobileNav />

      </div>
    </div>
  );
}

/* --------------------------------------------------------
   COMPONENTS
-------------------------------------------------------- */

function SummaryCard({ title, value, icon, iconColor, bgColor }) {
  return (
    <div className="bg-white border border-light-gray-border p-6 rounded-2xl shadow-soft hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-700 font-medium">{title}</h3>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>

        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bgColor}`}>
          <span className={`material-symbols-outlined text-3xl ${iconColor}`}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

function EventVisitCard({ event }) {
  return (
    <div className="bg-white border border-light-gray-border rounded-2xl p-6 shadow-soft hover:shadow-md transition">

      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900">{event.event_name}</h2>
          
          <div className="mt-3 space-y-1">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">login</span>
              Checked in: {new Date(event.check_in_time).toLocaleString()}
            </p>
            
            {event.start_date && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-gray-500">calendar_today</span>
                {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="ml-4 text-center bg-green-50 rounded-xl px-4 py-3 border border-green-200">
          <p className="text-2xl font-bold text-green-600">{event.feedback_count}</p>
          <p className="text-xs text-gray-600 mt-1">Feedbacks</p>
        </div>
      </div>

    </div>
  );
}
