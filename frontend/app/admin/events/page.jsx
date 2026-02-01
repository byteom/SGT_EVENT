"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAuth";

export default function AdminEventsPage() {
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [adminName, setAdminName] = useState("Admin");
  const [events, setEvents] = useState([]);
  const [eventManagers, setEventManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      setAdminName(localStorage.getItem("admin_name") || "Admin");
      fetchData();
    }
  }, [isChecking, isAuthenticated]);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, managersRes] = await Promise.all([
        api.get("/admin/events").catch(() => ({ data: { data: [] } })),
        api.get("/admin/event-managers").catch(() => ({ data: { data: [] } }))
      ]);

      if (eventsRes.data?.data?.events) {
        setEvents(eventsRes.data.data.events);
      }

      if (managersRes.data?.data?.event_managers) {
        setEventManagers(managersRes.data.data.event_managers);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEvent = async (eventId) => {
    if (!confirm("Approve this event?")) return;

    try {
      const response = await api.patch(`/admin/events/${eventId}/approve`);
      if (response.data?.success) {
        alert("Event approved successfully");
        // Force refresh to update counts
        await fetchData();
        // Switch to approved tab to show the result
        setActiveTab("approved");
      }
    } catch (error) {
      console.error("Error approving event:", error);
      alert(error.response?.data?.message || "Failed to approve event");
    }
  };

  const handleRejectEvent = async (eventId) => {
    const rejection_reason = prompt("Enter rejection reason:");
    if (!rejection_reason || rejection_reason.trim() === "") return;

    try {
      const response = await api.patch(`/admin/events/${eventId}/reject`, { rejection_reason });
      if (response.data?.success) {
        alert("Event rejected successfully");
        // Force refresh to update counts
        await fetchData();
        // Switch to rejected tab to show the result
        setActiveTab("rejected");
      }
    } catch (error) {
      console.error("Error rejecting event:", error);
      alert(error.response?.data?.message || "Failed to reject event");
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/admin/logout");
    } catch(e){}
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_name");
    router.replace("/");
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.event_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.event_code?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "pending") {
      return event.status === "PENDING_APPROVAL" && matchesSearch;
    } else if (activeTab === "approved") {
      return (event.status === "APPROVED" || event.status === "ACTIVE") && matchesSearch;
    } else if (activeTab === "rejected") {
      return (event.status === "REJECTED" || event.status === "CANCELLED") && matchesSearch;
    }
    return matchesSearch;
  });

  const pendingCount = events.filter(e => e.status === "PENDING_APPROVAL").length;
  const approvedCount = events.filter(e => e.status === "APPROVED" || e.status === "ACTIVE").length;
  const rejectedCount = events.filter(e => e.status === "REJECTED" || e.status === "CANCELLED").length;

  return (
    <div className="flex min-h-screen bg-soft-background">
      <AdminSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <AdminHeader adminName={adminName} onLogout={handleLogout} />

        <main className="p-4 sm:p-6 md:ml-64 pt-16 sm:pt-20 pb-20 sm:pb-6">

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard title="Pending Approval" value={pendingCount} icon="pending_actions" color="yellow" />
            <StatCard title="Approved Events" value={approvedCount} icon="check_circle" color="green" />
            <StatCard title="Rejected Events" value={rejectedCount} icon="cancel" color="red" />
          </div>

          {/* Event Managers Section */}
          <div className="mb-6 bg-card-background p-6 rounded-xl border border-light-gray-border shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dark-text">Event Managers</h2>
              <span className="text-sm text-gray-700">{eventManagers.length} total</span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : eventManagers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {eventManagers.map((manager) => (
                  <div key={manager.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-dark-text">{manager.full_name}</h3>
                        <p className="text-sm text-gray-700">{manager.email}</p>
                        <p className="text-xs text-gray-700 mt-1">{manager.organization}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        manager.is_approved_by_admin
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {manager.is_approved_by_admin ? "Approved" : "Pending"}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-gray-700">
                      {manager.total_events_created || 0} events created
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-700 py-4">No event managers found</p>
            )}
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-700">search</span>
              <input
                type="text"
                placeholder="Search events by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex gap-4 overflow-x-auto">
              <TabButton
                label="Pending Approval"
                count={pendingCount}
                active={activeTab === "pending"}
                onClick={() => setActiveTab("pending")}
              />
              <TabButton
                label="Approved"
                count={approvedCount}
                active={activeTab === "approved"}
                onClick={() => setActiveTab("approved")}
              />
              <TabButton
                label="Rejected"
                count={rejectedCount}
                active={activeTab === "rejected"}
                onClick={() => setActiveTab("rejected")}
              />
            </div>
          </div>

          {/* Events List */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onApprove={handleApproveEvent}
                  onReject={handleRejectEvent}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card-background rounded-xl border border-light-gray-border">
              <span className="material-symbols-outlined text-6xl text-gray-300">event_busy</span>
              <p className="text-gray-700 mt-2">
                {searchQuery ? "No events found matching your search" : `No ${activeTab} events`}
              </p>
            </div>
          )}
        </main>

        <AdminMobileNav />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-700">{title}</p>
          <h3 className="text-2xl font-bold text-dark-text mt-1">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function TabButton({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
        active
          ? "border-primary text-primary font-medium"
          : "border-transparent text-gray-700 hover:text-gray-700"
      }`}
    >
      <span>{label}</span>
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        active ? "bg-blue-100 text-primary border border-blue-200" : "bg-gray-200 text-gray-700"
      }`}>
        {count}
      </span>
    </button>
  );
}

function EventCard({ event, onApprove, onReject }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING_APPROVAL": return "bg-yellow-100 text-yellow-700";
      case "APPROVED": return "bg-green-100 text-green-700";
      case "ACTIVE": return "bg-green-100 text-green-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-card-background p-6 rounded-xl border border-light-gray-border shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-dark-text mb-1">{event.event_name}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-700">{event.event_code}</span>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(event.status)}`}>
                  {event.status.replace(/_/g, " ")}
                </span>
                <span className="text-sm text-gray-700">
                  {event.event_type === "FREE" ? "Free" : `₹${event.price}`}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="material-symbols-outlined text-base">person</span>
              <span>By: {event.manager_name || "Unknown"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="material-symbols-outlined text-base">business</span>
              <span>{event.manager_organization || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="material-symbols-outlined text-base">calendar_today</span>
              <span>{formatDate(event.start_date)} - {formatDate(event.end_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="material-symbols-outlined text-base">location_on</span>
              <span>{event.venue || "Not specified"}</span>
            </div>
          </div>

          {event.description && (
            <p className="text-sm text-gray-700 line-clamp-2">{event.description}</p>
          )}

          {event.rejection_reason && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700">
                <span className="font-medium">Rejection Reason:</span> {event.rejection_reason}
              </p>
            </div>
          )}
        </div>

        {event.status === "PENDING_APPROVAL" && (
          <div className="flex md:flex-col gap-2">
            <button
              onClick={() => onApprove(event.id)}
              className="flex-1 md:flex-initial px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>Approve</span>
            </button>
            <button
              onClick={() => onReject(event.id)}
              className="flex-1 md:flex-initial px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">cancel</span>
              <span>Reject</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
