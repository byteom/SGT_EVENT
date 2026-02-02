"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import api from "@/lib/api";
import { useVolunteerAuth } from "@/hooks/useAuth";

// SHARED COMPONENTS
import VolunteerSidebar from "@/components/volunteer/VolunteerSidebar";
import VolunteerHeader from "@/components/volunteer/VolunteerHeader";
import VolunteerMobileNav from "@/components/volunteer/VolunteerMobileNav";

export default function VolunteerDashboard() {
  const { isAuthenticated, isChecking } = useVolunteerAuth();
  const router = useRouter();

  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(true);
  const [volunteerName, setVolunteerName] = useState("Volunteer");

  const [totalScans, setTotalScans] = useState(0);
  const [history, setHistory] = useState([]);
  const [assignedEvents, setAssignedEvents] = useState([]);

  // ------------------ FETCH ASSIGNED EVENTS ------------------
  async function loadAssignedEvents() {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/volunteer/assigned-events", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        const events = res.data.data?.events || [];
        setAssignedEvents(events);
        console.log("🎯 Assigned Events:", events);
      }
    } catch (err) {
      console.error("Failed to load assigned events:", err);
      setAssignedEvents([]);
    }
  }

  // ------------------ FETCH HISTORY ------------------
  async function loadHistory() {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await api.get("/volunteer/history", {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => ({ 
        data: { 
          success: false,
          data: { 
            volunteer_name: "Volunteer",
            total_scans: 0, 
            history: [] 
          } 
        } 
      }));

      const data = res.data?.data;

      if (data) {
        setVolunteerName(data.volunteer_name || "Volunteer");
        // Backend returns total_scans which is the count of history records
        setTotalScans(data.total_scans || 0);
        setHistory(data.history || []);
        
        console.log("📊 Volunteer Stats:", {
          name: data.volunteer_name,
          totalScans: data.total_scans,
          historyCount: data.history?.length || 0
        });
      } else {
        setVolunteerName("Volunteer");
        setTotalScans(0);
        setHistory([]);
      }
    } catch (err) {
      console.error("History error → ", err);
      setVolunteerName("Volunteer");
      setTotalScans(0);
      setHistory([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      loadHistory();
      loadAssignedEvents();
    }
  }, [isChecking, isAuthenticated]);

  // Refresh data when returning from scanner
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        console.log("🔄 Page became visible, refreshing data...");
        loadHistory();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isAuthenticated]);

  // ------------------ LOAD THEME ------------------
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

  // ------------------ LOGOUT ------------------

const handleLogout = () => {
  api.post("/volunteer/logout", {}, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  }).finally(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("volunteer_name");

    window.location.href = "/";
  });
};

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
    <div className="flex min-h-screen bg-soft-background">

      {/* LEFT SIDEBAR */}
      <VolunteerSidebar onLogout={handleLogout} />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col">

        {/* TOP HEADER */}
        <VolunteerHeader
          theme={theme}
          toggleTheme={toggleTheme}
          volunteerName={volunteerName}
          onLogout={handleLogout}
        />

        {/* MAIN BODY */}
        {/* <main className="p-6 lg:p-10 max-w-7xl mx-auto"> */}
        <main className="p-6 lg:p-10 max-w-7xl">

          {/* ---------- STATS SECTION ---------- */}
          <section id="stats-section">
            <h3 className="font-display text-2xl text-center font-bold mb-6">
              Today's Activity Stats
            </h3>

            {loading ? (
              <div className="text-gray-700">Loading stats...</div>
            ) : (
              <div className="max-w-sm mx-auto">
                <StatCard
                  title="Total Scans"
                  value={totalScans}
                  icon="qr_code_scanner"
                  color="blue"
                />
              </div>
            )}
          </section>

          {/* ---------- ASSIGNED EVENTS SECTION ---------- */}
          <section id="events-section" className="mt-12">
            <h3 className="font-display text-2xl font-bold mb-6">
              Your Assigned Events
            </h3>

            {loading ? (
              <div className="text-gray-700">Loading events...</div>
            ) : assignedEvents.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <span className="material-symbols-outlined text-6xl text-yellow-600 mb-4">
                  event_busy
                </span>
                <p className="text-yellow-800 font-medium mb-2">
                  No Events Assigned
                </p>
                <p className="text-yellow-700 text-sm">
                  You are not currently assigned to any events. Please contact your event manager.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assignedEvents.map((event) => (
                  <EventCard key={event.event_id} event={event} router={router} />
                ))}
              </div>
            )}
          </section>

          {/* ---------- SCAN BUTTON (REMOVED - Now event-specific) ---------- */}

          {/* ---------- HISTORY SECTION ---------- */}
          <section id="history-section" className="mt-12">
            <h3 className="font-display text-center text-2xl font-bold mb-6">Your Past Scan Log</h3>

            <div className="bg-card-light rounded-xl shadow-soft overflow-hidden">

              {loading ? (
                <div className="p-6 text-center text-gray-700">
                  Loading history...
                </div>
              ) : history.length === 0 ? (
                <div className="p-6 text-center text-gray-700">
                  No scans yet.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {history.map((item, idx) => (
                    <HistoryItem
                      key={idx}
                      name={item.student_name}
                      type={item.scan_type}
                      reg={item.registration_no}
                      time={item.scanned_at}
                    />
                  ))}
                </ul>
              )}

            </div>
          </section>

        </main>
      </div>

      {/* MOBILE NAV */}
      <VolunteerMobileNav />
    </div>
  );
}

/* ---------------------------------------------
            SMALL COMPONENTS
--------------------------------------------- */

function StatCard({ title, value, icon, color }) {
  const bg = {
    blue: "bg-blue-100",
    green: "bg-green-100",
    yellow: "bg-yellow-100",
  }[color];

  const text = {
    blue: "text-blue-600",
    green: "text-green-600",
    yellow: "text-yellow-600",
  }[color];

  return (
    <div className="bg-card-light rounded-xl p-6 shadow-soft hover:-translate-y-1 transition">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold">{title}</h4>
        <div className={`p-2 rounded-lg ${bg}`}>
          <span className={`material-symbols-outlined ${text}`}>{icon}</span>
        </div>
      </div>
      <p className="text-5xl font-extrabold">{value}</p>
    </div>
  );
}

function HistoryItem({ name, type, reg, time }) {
  const isIn = type === "CHECKIN";

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return "—";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <li className="p-5 flex items-center justify-between">
      <div className="flex items-center gap-4">

        <div className={`p-3 rounded-full ${isIn ? "bg-green-100" : "bg-yellow-100"}`}>
          <span className={`material-symbols-outlined ${isIn ? "text-green-600" : "text-yellow-600"}`}>
            {isIn ? "login" : "logout"}
          </span>
        </div>

        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-gray-700">
            {isIn ? "Checked In" : "Checked Out"} — {reg}
          </p>
        </div>

      </div>

      <p className="text-sm text-gray-700">{formatTime(time)}</p>
    </li>
  );
}

function EventCard({ event, router }) {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getEventStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "APPROVED":
        return "bg-blue-100 text-blue-700";
      case "COMPLETED":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition">
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-lg font-bold text-dark-text">
            {event.event_name || "Unnamed Event"}
          </h4>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${getEventStatusColor(event.event_status)}`}>
            {event.event_status || "UNKNOWN"}
          </span>
        </div>
        <p className="text-sm text-gray-700 mb-3">
          Code: {event.event_code || "N/A"}
        </p>
        
        <div className="space-y-2">
          {event.venue && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="material-symbols-outlined text-base">location_on</span>
              <span>{event.venue}</span>
            </div>
          )}
          {event.start_date && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="material-symbols-outlined text-base">calendar_today</span>
              <span>{formatDate(event.start_date)}</span>
            </div>
          )}
          {event.assigned_location && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="material-symbols-outlined text-base">place</span>
              <span>Your Location: {event.assigned_location}</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => router.push(`/volunteer/events/${event.event_id}/scanner`)}
        className="w-full flex items-center justify-center gap-3 px-6 py-3 
        bg-gradient-to-br from-primary via-blue-500 to-blue-600 text-white 
        font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-105 active:scale-100 transition"
      >
        <span className="material-symbols-outlined">qr_code_scanner</span>
        <span>Open Scanner</span>
        <span className="material-symbols-outlined">arrow_forward</span>
      </button>
    </div>
  );
}
