"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useStudentAuth } from "@/hooks/useAuth";

// ---- SHARED COMPONENTS ----
import StudentSidebar from "@/components/student/StudentSidebar";
import StudentHeader from "@/components/student/StudentHeader";
import StudentMobileNav from "@/components/student/StudentMobileNav";

const DEFAULT_ROTATION_SECONDS = 30;

export default function StudentQRPage() {
  const { isAuthenticated, isChecking } = useStudentAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [theme, setTheme] = useState("light");
  const [timeLeft, setTimeLeft] = useState(null);
  const [rotationInfo, setRotationInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const retryTimeoutRef = useRef(null);

  // ------------------ FETCH QR ------------------
  const deriveCountdown = useCallback((info) => {
    if (typeof info?.expires_in_seconds === "number") {
      return info.expires_in_seconds;
    }
    if (typeof info?.rotation_interval === "number") {
      return info.rotation_interval;
    }
    return DEFAULT_ROTATION_SECONDS;
  }, []);

  const fetchQR = useCallback(async () => {
    try {
      setLoading(true);

      // Debug: Check if token exists
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      
      console.log("📊 Fetching QR Code...");
      console.log("🔑 Token exists:", !!token);
      console.log("👤 Role:", role);
      
      if (!token) {
        console.error("❌ No token found in localStorage");
        throw new Error("Authentication token missing. Please login again.");
      }

      const res = await api.get("/student/qr-code");
      
      console.log("✅ QR Code API Response:", res.data);
      
      const qr = res.data?.data;
      if (!qr?.qr_code) {
        throw new Error("Invalid QR response - no QR code data");
      }

      setQrData({
        full_name: qr.full_name || qr.student_name || "Student",
        registration_no: qr.registration_no,
        qr_code: qr.qr_code,
      });

      setRotationInfo(qr.rotation_info || null);
      setTimeLeft(deriveCountdown(qr.rotation_info));

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      setErrorMessage(null); // Clear any previous errors
    } catch (err) {
      console.error("❌ QR Fetch Error:", err);
      console.error("Error details:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      
      // Don't retry if it's an authentication error
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.error("❌ Authentication failed - redirecting to login");
        const errorMsg = err.response?.data?.message || "Session expired. Please login again.";
        setErrorMessage(errorMsg);
        
        // Redirect after 2 seconds
        setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          window.location.href = "/";
        }, 2000);
        return;
      }
      
      // Set error message for other errors
      const errorMsg = err.response?.data?.message || err.message || "Failed to load QR code";
      setErrorMessage(errorMsg);
      
      // Retry for other errors
      retryTimeoutRef.current = setTimeout(fetchQR, 5000);
    } finally {
      setLoading(false);
    }
  }, [deriveCountdown]);

  // Load first time
  useEffect(() => {
    fetchQR();
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [fetchQR]);

  const hasTimer = timeLeft !== null;

  // ------------------ COUNTDOWN TIMER (SYNCED WITH BACKEND) ------------------
  useEffect(() => {
    if (!hasTimer) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          fetchQR();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasTimer, fetchQR]);

  // ------------------ THEME ------------------
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
      <StudentSidebar 
        onLogout={handleLogout}/>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <StudentHeader 
          theme={theme} 
          toggleTheme={toggleTheme} 
          title="My QR Code!"
          onLogout={handleLogout}
        />

        {/* ------- CONTENT ------- */}
        <main className="flex-1 overflow-y-auto p-4 pb-32 sm:p-6 lg:p-8 lg:pb-10">
          <div className="max-w-3xl mx-auto">

            <div className="bg-white#1a1f2b] border border-light-gray-border rounded-3xl p-8 shadow-soft">

              {loading ? (
                <div className="py-20 flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
                  <p className="mt-4 text-gray-700">Loading QR...</p>
                </div>
              ) : !qrData ? (
                <div className="py-20 flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-5xl text-red-400 mb-4">error</span>
                  <p className="text-gray-800 font-semibold mb-2">
                    Unable to load your QR code
                  </p>
                  {errorMessage && (
                    <p className="text-red-600 text-sm mb-4">
                      {errorMessage}
                    </p>
                  )}
                  <p className="text-gray-700 text-sm">
                    {errorMessage?.includes("login") || errorMessage?.includes("Session") 
                      ? "Redirecting to login..." 
                      : "Retrying automatically in 5 seconds..."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center">

                    <div className="w-56 h-56 bg-white p-3 rounded-2xl shadow-md hover:shadow-xl transition">
                      <img src={qrData.qr_code} alt="QR" className="w-full h-full object-contain" />
                    </div>

                    <h2 className="mt-6 text-xl font-bold">{qrData.full_name}</h2>
                    <p className="text-gray-700 text-sm">
                      {qrData.registration_no}
                    </p>
                  </div>

                  {/* ⭐ COUNTDOWN TIMER */}
                  <div className="mt-5 text-center">
                    <div className="inline-block px-4 py-2 rounded-full 
                        bg-blue-100 border border-blue-200
                        text-primary font-semibold shadow-sm text-sm tracking-wide">
                      {timeLeft !== null
                        ? `Refreshing in ${timeLeft}s`
                        : rotationInfo?.rotation_interval
                        ? `Syncing new QR...`
                        : "Syncing..."}
                    </div>
                  </div>

                </>
              )}

            </div>

            <p className="mt-10 text-center text-gray-700 text-sm">
              Your QR code is unique. <br />
              Show it at entry to record your visit.
            </p>

          </div>
        </main>
      </div>

      {/* MOBILE NAV */}
      <StudentMobileNav active="qr" />

    </div>
  );
}
