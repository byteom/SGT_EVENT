"use client";

/**
 * Event-Specific Scanner Page
 * This page is accessed via /volunteer/events/[id]/scanner
 * It validates that the volunteer is assigned to this event before allowing scanning
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useVolunteerAuth } from "@/hooks/useAuth";

import VolunteerSidebar from "@/components/volunteer/VolunteerSidebar";
import VolunteerHeader from "@/components/volunteer/VolunteerHeader";
import VolunteerMobileNav from "@/components/volunteer/VolunteerMobileNav";

// Import the actual scanner component (we'll reuse the existing one)
import VolunteerScannerPage from "@/app/volunteer/scanner/page";

export default function EventSpecificScannerPage() {
  const { isAuthenticated, isChecking } = useVolunteerAuth();
  const { id: eventId } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [event, setEvent] = useState(null);
  const [theme, setTheme] = useState("light");

  // Verify volunteer is assigned to this event
  useEffect(() => {
    const verifyAssignment = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem("token");
        const res = await api.get("/volunteer/assigned-events", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success) {
          const events = res.data.data?.events || [];
          const assignedEvent = events.find(e => e.event_id === eventId);
          
          if (!assignedEvent) {
            setError("You are not assigned to this event.");
            return;
          }
          
          setEvent(assignedEvent);
        } else {
          setError("Failed to verify event assignment.");
        }
      } catch (err) {
        console.error("Event verification error:", err);
        setError(err.response?.data?.message || "Failed to verify event assignment.");
      } finally {
        setLoading(false);
      }
    };

    if (eventId && isAuthenticated) {
      verifyAssignment();
    }
  }, [eventId, isAuthenticated]);

  // Load theme
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

  const handleLogout = () => {
    api.post("/volunteer/logout", {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    }).finally(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("volunteer_name");
      window.location.href = "/";
    });
  };

  // Show loading while checking
  if (isChecking || loading) {
    return (
      <div className="min-h-screen bg-soft-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-dark-text">Verifying event assignment...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Show error if not assigned to event
  if (error) {
    return (
      <div className="min-h-screen bg-soft-background flex">
        <VolunteerSidebar onLogout={handleLogout} />
        
        <div className="flex-1 flex flex-col">
          <VolunteerHeader 
            theme={theme} 
            toggleTheme={toggleTheme} 
            onLogout={handleLogout}
          />
          
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-red-200">
              <div className="mb-6">
                <span className="material-symbols-outlined text-6xl text-red-500">error</span>
              </div>
              <h2 className="text-2xl font-bold text-dark-text mb-4">
                Access Denied
              </h2>
              <p className="text-gray-700 mb-6">
                {error}
              </p>
              <button
                onClick={() => router.push("/volunteer")}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-medium"
              >
                Go Back to Dashboard
              </button>
            </div>
          </main>
          
          <VolunteerMobileNav />
        </div>
      </div>
    );
  }

  // Show event info banner and render the scanner
  if (event) {
    return (
      <div className="min-h-screen bg-soft-background flex">
        <VolunteerSidebar onLogout={handleLogout} />
        
        <div className="flex-1 flex flex-col">
          <VolunteerHeader 
            theme={theme} 
            toggleTheme={toggleTheme} 
            onLogout={handleLogout}
            volunteerName={localStorage.getItem("volunteer_name") || "Volunteer"}
          />
          
          {/* Event Info Banner */}
          <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-4 shadow-md">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">{event.event_name}</h3>
                <p className="text-sm opacity-90">
                  {event.event_code} • {event.venue || "No venue"}
                </p>
                {event.assigned_location && (
                  <p className="text-xs opacity-75 mt-1">
                    Your Location: {event.assigned_location}
                  </p>
                )}
              </div>
              <button
                onClick={() => router.push("/volunteer")}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>Dashboard</span>
              </button>
            </div>
          </div>
          
          {/* Render the actual scanner component */}
          <div className="flex-1 overflow-auto">
            <VolunteerScannerPage eventContext={event} />
          </div>
          
          <VolunteerMobileNav />
        </div>
      </div>
    );
  }

  return null;
}
