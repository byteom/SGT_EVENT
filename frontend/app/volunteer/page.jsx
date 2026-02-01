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

          {/* ---------- SCAN BUTTON ---------- */}
          <section id="scan-section" className="mt-12 text-center">
            <button
              onClick={() => router.push("/volunteer/scanner")}
              className="inline-flex items-center justify-center gap-3 px-12 py-5 
              bg-gradient-to-br from-[#1E6AD6] via-[#2B79E3] to-[#3F8AF0] text-white 
              font-bold text-xl rounded-2xl shadow-button-premium 
              hover:scale-105 active:scale-100 transition"
            >
              <span className="material-symbols-outlined !text-3xl">
                qr_code_scanner
              </span>
              Open QR Scanner
            </button>
          </section>

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


