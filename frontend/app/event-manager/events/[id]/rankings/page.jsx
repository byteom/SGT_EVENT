"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import EventManagerHeader from "@/components/event-manager/EventManagerHeader";
import EventManagerSidebar from "@/components/event-manager/EventManagerSidebar";
import EventManagerMobileNav from "@/components/event-manager/EventManagerMobileNav";
import api from "@/lib/api";
import { useEventManagerAuth } from "@/hooks/useAuth";

/**
 * Event Manager - View Rankings for Own Event
 */
export default function EventRankingsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id;
  const { isAuthenticated, isChecking } = useEventManagerAuth();
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState("stalls");
  const [stallRankings, setStallRankings] = useState([]);
  const [studentRankings, setStudentRankings] = useState([]);
  const [schoolRankings, setSchoolRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isChecking && isAuthenticated && eventId) {
      fetchEventDetails();
      fetchRankings();
    }
  }, [isChecking, isAuthenticated, eventId]);

  const fetchEventDetails = async () => {
    try {
      const token = localStorage.getItem("event_manager_token");
      const response = await api.get(`/event-manager/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        setEvent(response.data.data);
      }
    } catch (error) {
      console.error("Fetch event error:", error);
    }
  };

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("event_manager_token");
      const [stallRes, studentRes, schoolRes] = await Promise.all([
        api.get(`/event-manager/events/${eventId}/rankings/stalls`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get(`/event-manager/events/${eventId}/rankings/students`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get(`/event-manager/events/${eventId}/rankings/schools`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (stallRes.data?.success) setStallRankings(stallRes.data.data || []);
      if (studentRes.data?.success) setStudentRankings(studentRes.data.data || []);
      if (schoolRes.data?.success) setSchoolRankings(schoolRes.data.data || []);
    } catch (error) {
      console.error("Fetch rankings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/event-manager/logout");
    } catch (e) {}
    localStorage.removeItem("event_manager_token");
    localStorage.removeItem("event_manager_name");
    localStorage.removeItem("event_manager_email");
    window.location.href = "/";
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

  const getRankingsList = () => {
    switch (activeTab) {
      case "stalls":
        return stallRankings;
      case "students":
        return studentRankings;
      case "schools":
        return schoolRankings;
      default:
        return [];
    }
  };

  const currentRankings = getRankingsList();

  return (
    <div className="flex min-h-screen bg-soft-background">
      <EventManagerSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <EventManagerHeader
          managerName={localStorage.getItem("event_manager_name") || "Event Manager"}
          onLogout={handleLogout}
        />

        <main className="p-4 sm:p-6 md:ml-64 pt-16 sm:pt-20 pb-20 sm:pb-6">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-primary mb-4 hover:underline"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Back to Event
              </button>
              {event && (
                <>
                  <h1 className="text-2xl font-bold text-dark-text mb-2">{event.event_name} - Rankings</h1>
                  <p className="text-gray-700">View all rankings for your event</p>
                </>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-card-background rounded-xl border border-light-gray-border overflow-hidden mb-6">
              <div className="flex border-b border-light-gray-border">
                <button
                  onClick={() => setActiveTab("stalls")}
                  className={`flex-1 px-6 py-4 font-medium transition ${
                    activeTab === "stalls"
                      ? "bg-primary text-white border-b-2 border-primary"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">store</span>
                    Stall Rankings
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("students")}
                  className={`flex-1 px-6 py-4 font-medium transition ${
                    activeTab === "students"
                      ? "bg-primary text-white border-b-2 border-primary"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">school</span>
                    Student Rankings
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("schools")}
                  className={`flex-1 px-6 py-4 font-medium transition ${
                    activeTab === "schools"
                      ? "bg-primary text-white border-b-2 border-primary"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">account_balance</span>
                    School Rankings
                  </span>
                </button>
              </div>
            </div>

            {/* Rankings Content */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card-background rounded-xl border border-light-gray-border p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : currentRankings.length === 0 ? (
              <div className="bg-card-background rounded-xl border border-light-gray-border p-12 text-center">
                <span className="material-symbols-outlined text-6xl text-gray-700 mb-4 block">emoji_events</span>
                <h3 className="text-lg font-medium text-dark-text mb-2">No Rankings Yet</h3>
                <p className="text-gray-700">Rankings will appear once participants submit their votes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentRankings.map((item, index) => (
                  <div
                    key={item.id || index}
                    className={`bg-card-background rounded-xl border border-light-gray-border p-6 ${
                      index < 3 ? "shadow-md" : "shadow-soft"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Rank Badge */}
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-600"
                              : index === 1
                              ? "bg-gray-200 text-gray-600"
                              : index === 2
                              ? "bg-orange-100 text-orange-600"
                              : "bg-blue-100 text-primary"
                          }`}
                        >
                          #{index + 1}
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          {activeTab === "stalls" && (
                            <>
                              <h3 className="text-lg font-semibold text-dark-text mb-1">{item.stall_name}</h3>
                              <p className="text-sm text-gray-700">{item.school_name}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-700">
                                <span>{item.total_rankings || 0} rankings</span>
                                <span>•</span>
                                <span>{item.average_rating?.toFixed(1) || 0} avg rating</span>
                              </div>
                            </>
                          )}

                          {activeTab === "students" && (
                            <>
                              <h3 className="text-lg font-semibold text-dark-text mb-1">{item.full_name}</h3>
                              <p className="text-sm text-gray-700">{item.registration_no}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-700">
                                <span>{item.stalls_visited || 0} stalls visited</span>
                                <span>•</span>
                                <span>{item.has_completed_ranking ? "✓ Completed" : "Incomplete"}</span>
                              </div>
                            </>
                          )}

                          {activeTab === "schools" && (
                            <>
                              <h3 className="text-lg font-semibold text-dark-text mb-1">{item.school_name}</h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-700">
                                <span>{item.student_count || 0} students</span>
                                <span>•</span>
                                <span>{item.stall_count || 0} stalls</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">
                          {activeTab === "stalls" && (item.total_points || 0)}
                          {activeTab === "students" && (item.participation_score || 0)}
                          {activeTab === "schools" && (item.total_score || 0)}
                        </p>
                        <p className="text-xs text-gray-700 mt-1">points</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <EventManagerMobileNav />
    </div>
  );
}
