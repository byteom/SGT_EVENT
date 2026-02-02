"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useStudentAuth } from "@/hooks/useAuth";
import StudentSidebar from "@/components/student/StudentSidebar";
import StudentHeader from "@/components/student/StudentHeader";
import StudentMobileNav from "@/components/student/StudentMobileNav";
import DeregisterModal from "@/components/student/DeregisterModal";

export default function MyEventsPage() {
  const { isAuthenticated, isChecking } = useStudentAuth();
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeregisterModal, setShowDeregisterModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      fetchMyEvents();
    }
  }, [isChecking, isAuthenticated]);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/student/my-events");
      
      console.log("My Events API Response:", response.data);

      if (response.data?.success) {
        // Backend returns: { success: true, data: { registrations: [...] } }
        const registrationsData = response.data.data?.registrations || [];
        
        console.log("Parsed registrations:", registrationsData);
        setRegistrations(Array.isArray(registrationsData) ? registrationsData : []);
      }
    } catch (error) {
      console.error("Error fetching my events:", error);
      console.error("Error response:", error.response?.data);
    } finally {
      setLoading(false);
    }
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-soft-background font-sans text-dark-text antialiased min-h-screen flex">
      <StudentSidebar onLogout={handleLogout} />

      <div className="flex-1 flex flex-col">
        <StudentHeader theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-4 pb-32 sm:p-6 lg:p-8 lg:pb-10">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-dark-text">My Event Registrations</h1>
                <p className="text-sm text-gray-700 mt-1">
                  View all your registered events
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchMyEvents()}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">refresh</span>
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => router.push("/student/events")}
                  className="px-4 py-2 bg-blue-100 text-primary border border-blue-200 rounded-lg hover:bg-blue-200 transition text-sm font-medium flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  <span>Browse Events</span>
                </button>
              </div>
            </div>

            {/* Events List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : registrations.length > 0 ? (
              <div className="space-y-4">
                {registrations.map((reg) => (
                  <RegistrationCard 
                    key={reg.id} 
                    registration={reg} 
                    onViewQR={() => router.push(`/student/events/${reg.event_id}/qr`)}
                    onDeregister={() => {
                      setSelectedRegistration(reg);
                      setShowDeregisterModal(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card-background rounded-xl border border-light-gray-border">
                <span className="material-symbols-outlined text-6xl text-gray-300">event_busy</span>
                <p className="text-gray-700 mt-2 mb-4">
                  You haven't registered for any events yet
                </p>
                <button
                  onClick={() => router.push("/student/events")}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-medium"
                >
                  Browse Available Events
                </button>
              </div>
            )}

          </div>
        </main>

        <StudentMobileNav />
      </div>

      {/* Deregister Modal */}
      {showDeregisterModal && selectedRegistration && (
        <DeregisterModal
          registration={selectedRegistration}
          onClose={() => {
            setShowDeregisterModal(false);
            setSelectedRegistration(null);
          }}
          onSuccess={() => {
            setShowDeregisterModal(false);
            setSelectedRegistration(null);
            fetchMyEvents();
          }}
        />
      )}
    </div>
  );
}

function RegistrationCard({ registration, onViewQR, onDeregister }) {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      case "WAITLISTED":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "FAILED":
        return "bg-red-100 text-red-700";
      case "NOT_REQUIRED":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-dark-text mb-2">
            {registration.event_name || "Unnamed Event"}
          </h3>
          <p className="text-sm text-gray-700 mb-3">{registration.event_code || "No code"}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="material-symbols-outlined text-base">calendar_today</span>
              <span>{formatDate(registration.start_date)}</span>
            </div>
            {registration.venue && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="material-symbols-outlined text-base">location_on</span>
                <span>{registration.venue}</span>
              </div>
            )}
            {registration.event_type === "PAID" && registration.payment_amount && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="material-symbols-outlined text-base">payments</span>
                <span>₹{registration.payment_amount}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="material-symbols-outlined text-base">confirmation_number</span>
              <span className="truncate">Reg ID: {registration.id?.slice(0, 8)}...</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${getStatusColor(registration.registration_status)}`}>
              {registration.registration_status === "CONFIRMED" && (
                <span className="material-symbols-outlined text-sm">check_circle</span>
              )}
              {registration.registration_status === "PENDING" && (
                <span className="material-symbols-outlined text-sm">pending</span>
              )}
              {registration.registration_status === "CANCELLED" && (
                <span className="material-symbols-outlined text-sm">cancel</span>
              )}
              <span>{registration.registration_status}</span>
            </span>

            {registration.event_type === "PAID" && (
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${getPaymentStatusColor(registration.payment_status)}`}>
                Payment: {registration.payment_status?.replace(/_/g, " ")}
              </span>
            )}

            {registration.event_type === "FREE" && (
              <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-100 text-green-700">
                Free Event
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-700">
            Registered: {formatDate(registration.registered_at)}
          </p>
        </div>
      </div>

      {registration.registration_status === "CONFIRMED" && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-4">
          <button
            onClick={onViewQR}
            className="flex items-center gap-3 text-sm text-primary hover:text-primary-dark transition cursor-pointer group"
          >
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">qr_code_2</span>
            <span className="group-hover:underline">View QR Code for check-in</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
          <button
            onClick={() => window.location.href = "/student/stall-scan"}
            className="flex items-center gap-3 text-sm text-yellow-600 hover:text-yellow-700 transition cursor-pointer group"
          >
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">rate_review</span>
            <span className="group-hover:underline">Give Feedback</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
          <button
            onClick={onDeregister}
            className="flex items-center gap-3 text-sm text-red-600 hover:text-red-700 transition cursor-pointer group"
          >
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">cancel</span>
            <span className="group-hover:underline">Cancel Registration</span>
          </button>
        </div>
      )}
    </div>
  );
}
