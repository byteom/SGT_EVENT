"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import api from "@/lib/api";
import { useAdminAuth } from "@/hooks/useAuth";

/**
 * Admin Rankings Management Page
 * Control rankings visibility and view platform-wide rankings
 */
export default function AdminRankingsPage() {
  const router = useRouter();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [rankingsData, setRankingsData] = useState(null);

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      fetchEvents();
    }
  }, [isChecking, isAuthenticated]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await api.get("/admin/events?limit=100", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        setEvents(response.data.data?.filter(e => e.status === 'APPROVED') || []);
      }
    } catch (error) {
      console.error("Fetch events error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRankings = async (eventId) => {
    try {
      const token = localStorage.getItem("admin_token");
      const [stallRes, studentRes, schoolRes] = await Promise.all([
        api.get(`/admin/events/${eventId}/rankings/stalls`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get(`/admin/events/${eventId}/rankings/students`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get(`/admin/events/${eventId}/rankings/schools`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setRankingsData({
        stalls: stallRes.data?.data || [],
        students: studentRes.data?.data || [],
        schools: schoolRes.data?.data || []
      });
    } catch (error) {
      console.error("Fetch rankings error:", error);
      alert("Failed to fetch rankings");
    }
  };

  const handlePublishRankings = async (eventId) => {
    if (!confirm("Are you sure you want to publish rankings for this event? They will be visible to all users.")) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await api.patch(`/admin/events/${eventId}/publish-rankings`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        alert("Rankings published successfully!");
        fetchEvents();
      } else {
        alert(response.data?.message || "Failed to publish rankings");
      }
    } catch (error) {
      console.error("Publish rankings error:", error);
      alert(error.response?.data?.message || "Failed to publish rankings");
    }
  };

  const handleUnpublishRankings = async (eventId) => {
    if (!confirm("Are you sure you want to unpublish rankings? They will be hidden from all users.")) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await api.patch(`/admin/events/${eventId}/unpublish-rankings`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        alert("Rankings unpublished successfully!");
        fetchEvents();
      } else {
        alert(response.data?.message || "Failed to unpublish rankings");
      }
    } catch (error) {
      console.error("Unpublish rankings error:", error);
      alert(error.response?.data?.message || "Failed to unpublish rankings");
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/admin/logout");
    } catch (e) {}
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_name");
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

  return (
    <div className="flex min-h-screen bg-soft-background">
      <AdminSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <AdminHeader adminName={localStorage.getItem("admin_name") || "Admin"} onLogout={handleLogout} />

        <main className="p-4 sm:p-6 md:ml-64 pt-16 sm:pt-20 pb-20 sm:pb-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-dark-text mb-2">Rankings Management</h1>
            <p className="text-gray-700">Control rankings visibility and view event rankings</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card-background rounded-xl border border-light-gray-border p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="bg-card-background rounded-xl border border-light-gray-border p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-gray-700 mb-4 block">emoji_events</span>
              <h3 className="text-lg font-medium text-dark-text mb-2">No Approved Events</h3>
              <p className="text-gray-700">No events available for rankings management</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="bg-card-background rounded-xl border border-light-gray-border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-dark-text mb-1">{event.event_name}</h3>
                      <p className="text-sm text-gray-700 mb-2">{event.event_code}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-700">
                        <span>{event.location}</span>
                        <span>•</span>
                        <span>{event.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.rankings_published ? (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          Published
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          Hidden
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSelectedEventId(event.id);
                        fetchRankings(event.id);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-primary border border-blue-200 rounded-lg hover:bg-blue-200 transition text-sm"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      View Rankings
                    </button>

                    {event.rankings_published ? (
                      <button
                        onClick={() => handleUnpublishRankings(event.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 transition text-sm"
                      >
                        <span className="material-symbols-outlined text-sm">visibility_off</span>
                        Unpublish
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublishRankings(event.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 border border-green-200 rounded-lg hover:bg-green-200 transition text-sm"
                      >
                        <span className="material-symbols-outlined text-sm">publish</span>
                        Publish
                      </button>
                    )}
                  </div>

                  {/* Rankings Display */}
                  {selectedEventId === event.id && rankingsData && (
                    <div className="mt-6 pt-6 border-t border-light-gray-border space-y-6">
                      {/* Stall Rankings */}
                      <div>
                        <h4 className="font-semibold text-dark-text mb-3">Top Stalls</h4>
                        <div className="space-y-2">
                          {rankingsData.stalls.slice(0, 5).map((stall, index) => (
                            <div key={stall.id} className="flex items-center justify-between p-3 bg-soft-background rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold text-primary">#{index + 1}</span>
                                <div>
                                  <p className="font-medium text-dark-text">{stall.stall_name}</p>
                                  <p className="text-sm text-gray-700">{stall.school_name}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-primary">{stall.total_points} pts</p>
                                <p className="text-xs text-gray-700">{stall.total_rankings} rankings</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Student Rankings */}
                      <div>
                        <h4 className="font-semibold text-dark-text mb-3">Top Students</h4>
                        <div className="space-y-2">
                          {rankingsData.students.slice(0, 5).map((student, index) => (
                            <div key={student.id} className="flex items-center justify-between p-3 bg-soft-background rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold text-primary">#{index + 1}</span>
                                <div>
                                  <p className="font-medium text-dark-text">{student.full_name}</p>
                                  <p className="text-sm text-gray-700">{student.registration_no}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-primary">{student.participation_score} pts</p>
                                <p className="text-xs text-gray-700">{student.stalls_visited} stalls visited</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* School Rankings */}
                      <div>
                        <h4 className="font-semibold text-dark-text mb-3">Top Schools</h4>
                        <div className="space-y-2">
                          {rankingsData.schools.slice(0, 5).map((school, index) => (
                            <div key={school.school_id} className="flex items-center justify-between p-3 bg-soft-background rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold text-primary">#{index + 1}</span>
                                <p className="font-medium text-dark-text">{school.school_name}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-primary">{school.total_score} pts</p>
                                <p className="text-xs text-gray-700">{school.student_count} students</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      <AdminMobileNav />
    </div>
  );
}
