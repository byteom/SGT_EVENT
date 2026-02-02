"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useStudentAuth } from "@/hooks/useAuth";

// ---- SHARED COMPONENTS ----
import StudentSidebar from "@/components/student/StudentSidebar";
import StudentHeader from "@/components/student/StudentHeader";
import StudentMobileNav from "@/components/student/StudentMobileNav";

const DEFAULT_ROTATION_SECONDS = 30;

export default function EventQRPage() {
  const { isAuthenticated, isChecking } = useStudentAuth();
  const { id: eventId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [theme, setTheme] = useState("light");
  const [timeLeft, setTimeLeft] = useState(null);
  const [rotationInfo, setRotationInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const retryTimeoutRef = useRef(null);

  // ------------------ FETCH EVENT-SPECIFIC QR ------------------
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

      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      
      console.log("📊 Fetching Event QR Code...");
      console.log("🔑 Token exists:", !!token);
      console.log("👤 Role:", role);
      console.log("🎯 Event ID:", eventId);
      
      if (!token) {
        console.error("❌ No token found in localStorage");
        throw new Error("Authentication token missing. Please login again.");
      }

      const res = await api.get(`/student/events/${eventId}/qr-code`);
      
      console.log("✅ Event QR Code API Response:", res.data);
      
      const qr = res.data?.data;
      if (!qr?.qr_code) {
        throw new Error("Invalid QR response - no QR code data");
      }

      setQrData({
        full_name: qr.student_name || "Student",
        registration_no: qr.registration_no,
        qr_code: qr.qr_code,
        event: qr.event
      });

      setRotationInfo(qr.rotation_info || null);
      setTimeLeft(deriveCountdown(qr.rotation_info));

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      setErrorMessage(null);
    } catch (err) {
      console.error("❌ QR Fetch Error:", err);
      console.error("Error details:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      
      // Handle authentication errors
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
  }, [eventId, deriveCountdown]);

  // Load first time
  useEffect(() => {
    if (eventId) {
      fetchQR();
    }
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [eventId, fetchQR]);

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
      <StudentSidebar onLogout={handleLogout}/>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <StudentHeader 
          theme={theme} 
          toggleTheme={toggleTheme} 
          title={qrData?.event?.event_name ? `${qrData.event.event_name} - QR Code` : "Event QR Code"}
        />

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 pb-32 sm:p-6 lg:p-8 lg:pb-10">
          <div className="max-w-3xl mx-auto">
            
            {/* Back Button */}
            <button
              onClick={() => router.push("/student/my-events")}
              className="mb-6 flex items-center gap-2 text-primary hover:text-primary-dark transition"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Back to My Events</span>
            </button>

            {/* Event Info Card */}
            {qrData?.event && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                <h2 className="text-2xl font-bold text-dark-text mb-2">
                  {qrData.event.event_name}
                </h2>
                <p className="text-gray-700 mb-4">Event Code: {qrData.event.event_code}</p>
                {qrData.event.venue && (
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <span className="material-symbols-outlined text-base">location_on</span>
                    <span>{qrData.event.venue}</span>
                  </div>
                )}
                {qrData.event.start_date && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="material-symbols-outlined text-base">calendar_today</span>
                    <span>{new Date(qrData.event.start_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* ERROR MESSAGE */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl">error</span>
                  <p className="font-medium">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* QR CODE CARD */}
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-200">
              
              <h1 className="text-2xl font-bold mb-2 text-dark-text">
                Your Event QR Code
              </h1>
              <p className="text-gray-700 mb-6">
                Show this QR code to the volunteer at the event entrance
              </p>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
                  <p className="text-gray-700">Generating QR Code...</p>
                </div>
              ) : qrData ? (
                <>
                  {/* QR CODE IMAGE */}
                  <div className="flex justify-center mb-6">
                    <div className="bg-white p-4 rounded-2xl shadow-xl border-4 border-primary">
                      <img 
                        src={qrData.qr_code} 
                        alt="Student QR Code" 
                        className="w-72 h-72 object-contain"
                      />
                    </div>
                  </div>

                  {/* STUDENT INFO */}
                  <div className="space-y-3 mb-6">
                    <p className="text-lg font-semibold text-dark-text">
                      {qrData.full_name}
                    </p>
                    <p className="text-gray-700">
                      Registration No: <span className="font-medium">{qrData.registration_no}</span>
                    </p>
                  </div>

                  {/* ROTATION TIMER */}
                  {hasTimer && timeLeft !== null && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center justify-center gap-3">
                        <span className="material-symbols-outlined text-blue-600 animate-spin">refresh</span>
                        <p className="text-blue-700 font-medium">
                          QR Code refreshes in {timeLeft}s
                        </p>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        For security, the QR code changes every {rotationInfo?.rotation_interval || DEFAULT_ROTATION_SECONDS} seconds
                      </p>
                    </div>
                  )}

                  {/* INSTRUCTIONS */}
                  <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-primary-light rounded-xl">
                    <h3 className="text-lg font-bold text-dark-text mb-4 flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined">info</span>
                      How to Use
                    </h3>
                    <ol className="text-left space-y-3 text-sm text-gray-700">
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                        <span>Show this QR code to the volunteer at the event entrance</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                        <span>The volunteer will scan your QR code to check you in</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                        <span>Show the QR code again when leaving to check out</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                        <span>Your QR code is event-specific and secure</span>
                      </li>
                    </ol>
                  </div>
                </>
              ) : (
                <div className="py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">qr_code_2</span>
                  <p className="text-gray-700">No QR code available</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* MOBILE NAV */}
        <StudentMobileNav />
      </div>
    </div>
  );
}
