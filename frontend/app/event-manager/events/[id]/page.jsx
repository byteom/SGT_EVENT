"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import EventManagerSidebar from "@/components/event-manager/EventManagerSidebar";
import EventManagerHeader from "@/components/event-manager/EventManagerHeader";
import EventManagerMobileNav from "@/components/event-manager/EventManagerMobileNav";
import api from "@/lib/api";
import { useEventManagerAuth } from "@/hooks/useAuth";
import * as XLSX from "xlsx";

export default function EventDetailPage() {
  const { isAuthenticated, isChecking } = useEventManagerAuth();
  const params = useParams();
  const router = useRouter();
  const eventId = params.id;

  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!isChecking && isAuthenticated && eventId) {
      fetchEventDetails();
    }
  }, [isChecking, isAuthenticated, eventId, activeTab]);

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

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const [eventRes, volunteersRes, registrationsRes, stallsRes, analyticsRes] = await Promise.all([
        api.get(`/event-manager/events/${eventId}`).catch(() => ({ data: { success: false } })),
        api.get(`/event-manager/events/${eventId}/volunteers`).catch(() => ({ data: { success: false, data: { volunteers: [] } } })),
        api.get(`/event-manager/events/${eventId}/registrations`).catch(() => ({ data: { success: false, data: { data: [] } } })),
        api.get(`/event-manager/events/${eventId}/stalls`).catch(() => ({ data: { success: false, data: { stalls: [] } } })),
        api.get(`/event-manager/events/${eventId}/analytics`).catch(() => ({ data: { success: false, data: null } }))
      ]);

      if (eventRes.data?.success) {
        setEvent(eventRes.data.data.event);
        setStats(eventRes.data.data.stats);
      } else {
        // If event details fail, redirect
        alert("Failed to load event details");
        router.push("/event-manager/events");
        return;
      }

      if (volunteersRes.data?.success) {
        setVolunteers(volunteersRes.data.data.volunteers || []);
      } else {
        setVolunteers([]);
      }

      if (registrationsRes.data?.success) {
        setRegistrations(registrationsRes.data.data.data || []);
      } else {
        setRegistrations([]);
      }

      if (stallsRes.data?.success) {
        setStalls(stallsRes.data.data.stalls || []);
      } else {
        setStalls([]);
      }

      if (analyticsRes.data?.success) {
        setAnalytics(analyticsRes.data.data);
      } else {
        setAnalytics(null);
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
      alert("An error occurred while loading event details");
      router.push("/event-manager/events");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await api.delete(`/event-manager/events/${eventId}`);
      if (response.data?.success) {
        alert("Event deleted successfully");
        router.push("/event-manager/events");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert(error.response?.data?.message || "Failed to delete event");
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/event-manager/logout");
    } catch(e){}
    localStorage.removeItem("event_manager_token");
    localStorage.removeItem("event_manager_name");
    localStorage.removeItem("event_manager_email");
    router.replace("/");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED": return "bg-green-100 text-green-700";
      case "ACTIVE": return "bg-green-100 text-green-700";
      case "PENDING_APPROVAL": return "bg-yellow-100 text-yellow-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      case "DRAFT": return "bg-gray-100 text-gray-700";
      case "COMPLETED": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading || !event) {
    return (
      <div className="flex min-h-screen bg-soft-background">
        <EventManagerSidebar onLogout={handleLogout} />
        <div className="flex-1 flex flex-col">
          <EventManagerHeader managerName={localStorage.getItem("event_manager_name") || "Event Manager"} onLogout={handleLogout} />
          <main className="p-4 sm:p-6 md:ml-64 pt-16 sm:pt-20 pb-20 sm:pb-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-soft-background">
      <EventManagerSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <EventManagerHeader managerName={localStorage.getItem("event_manager_name") || "Event Manager"} onLogout={handleLogout} />

        <main className="p-4 sm:p-6 md:ml-64 pt-16 sm:pt-20 pb-20 sm:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary mb-4"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                <span>Back to Events</span>
              </button>

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-dark-text mb-2">{event.event_name}</h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(event.status)}`}>
                      {event.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm text-gray-700">{event.event_code}</span>
                    <span className="text-sm text-gray-700">
                      {event.event_type === "FREE" ? "Free Event" : `₹${event.price}`}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {['DRAFT', 'PENDING_APPROVAL'].includes(event.status) && (
                    <button
                      onClick={() => router.push(`/event-manager/events/${eventId}/edit`)}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm font-medium flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                      <span>Edit</span>
                    </button>
                  )}
                  {!['APPROVED', 'ACTIVE', 'COMPLETED'].includes(event.status) && (
                    <button
                      onClick={handleDeleteEvent}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <div className="flex gap-4 overflow-x-auto">
                <TabButton label="Overview" icon="info" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
                <TabButton label="Volunteers" icon="groups" count={volunteers.length} active={activeTab === "volunteers"} onClick={() => setActiveTab("volunteers")} />
                <TabButton label="Registrations" icon="how_to_reg" count={registrations.length} active={activeTab === "registrations"} onClick={() => setActiveTab("registrations")} />
                <TabButton label="Stalls" icon="store" count={stalls.length} active={activeTab === "stalls"} onClick={() => setActiveTab("stalls")} />
                <TabButton label="Analytics" icon="analytics" active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} />
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <OverviewTab event={event} stats={stats} registrations={registrations} volunteers={volunteers} stalls={stalls} />
            )}

            {activeTab === "volunteers" && (
              <VolunteersTab volunteers={volunteers} eventId={eventId} onUpdate={fetchEventDetails} />
            )}

            {activeTab === "registrations" && (
              <RegistrationsTab registrations={registrations} />
            )}

            {activeTab === "stalls" && (
              <StallsTab stalls={stalls} eventId={eventId} onUpdate={fetchEventDetails} />
            )}

            {activeTab === "analytics" && (
              <AnalyticsTab analytics={analytics} stats={stats} event={event} registrations={registrations} />
            )}
          </div>
        </main>

        <EventManagerMobileNav />
      </div>
    </div>
  );
}

function TabButton({ label, icon, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
        active
          ? "border-primary text-primary font-medium"
          : "border-transparent text-gray-700 hover:text-gray-700"
      }`}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          active ? "bg-primary text-white" : "bg-gray-200 text-gray-700"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function OverviewTab({ event, stats, registrations, volunteers, stalls }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // Calculate confirmed registrations based on event type and payment status
  const getConfirmedCount = () => {
    if (!registrations || registrations.length === 0) return 0;

    // For PAID events, only count registrations with payment_status === 'COMPLETED'
    if (event.event_type === 'PAID') {
      return registrations.filter(reg =>
        reg.payment_status === 'COMPLETED' &&
        (reg.registration_status === 'CONFIRMED' || !reg.registration_status)
      ).length;
    }

    // For FREE events, count all with registration_status === 'CONFIRMED' or payment_status === 'NOT_REQUIRED'
    return registrations.filter(reg =>
      reg.registration_status === 'CONFIRMED' ||
      reg.payment_status === 'NOT_REQUIRED' ||
      reg.payment_status === 'COMPLETED'
    ).length;
  };

  // Calculate total registrations (only confirmed ones)
  const totalConfirmed = getConfirmedCount();

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Registrations" value={totalConfirmed} icon="how_to_reg" />
        <StatCard title="Confirmed" value={totalConfirmed} icon="check_circle" positive />
        <StatCard title="Volunteers Assigned" value={volunteers?.length || 0} icon="groups" />
        <StatCard title="Stalls Assigned" value={stalls?.length || 0} icon="store" />
      </div>

      {/* Event Details */}
      <div className="bg-card-background p-6 rounded-xl border border-light-gray-border shadow-soft">
        <h2 className="text-lg font-semibold text-dark-text mb-4">Event Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailRow label="Event Name" value={event.event_name} />
          <DetailRow label="Event Code" value={event.event_code} />
          <DetailRow label="Event Type" value={event.event_type} />
          {event.price && <DetailRow label="Price" value={`₹${event.price}`} />}
          <DetailRow label="Category" value={event.event_category || "N/A"} />
          <DetailRow label="Venue" value={event.venue || "N/A"} />
          <DetailRow label="Max Capacity" value={event.max_capacity || "Unlimited"} />
          <DetailRow label="Status" value={event.status.replace(/_/g, " ")} />
        </div>

        {event.description && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-700 mb-2">Description</p>
            <p className="text-dark-text">{event.description}</p>
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="bg-card-background p-6 rounded-xl border border-light-gray-border shadow-soft">
        <h2 className="text-lg font-semibold text-dark-text mb-4">Important Dates</h2>
        <div className="space-y-3">
          <DateRow label="Event Start" value={formatDate(event.start_date)} icon="event" />
          <DateRow label="Event End" value={formatDate(event.end_date)} icon="event" />
          <DateRow label="Registration Start" value={formatDate(event.registration_start_date)} icon="app_registration" />
          <DateRow label="Registration End" value={formatDate(event.registration_end_date)} icon="app_registration" />
        </div>
      </div>
    </div>
  );
}

function VolunteersTab({ volunteers, eventId, onUpdate }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [volunteerId, setVolunteerId] = useState("");
  const [location, setLocation] = useState("");
  const [adding, setAdding] = useState(false);

  const handleDownloadExcel = () => {
    if (volunteers.length === 0) {
      alert("No volunteers to download");
      return;
    }

    // Prepare data for Excel
    const excelData = volunteers.map((vol, index) => ({
      "S.No": index + 1,
      "Volunteer Name": vol.full_name || vol.volunteer_name || "N/A",
      "Email": vol.volunteer_email || vol.email || "N/A",
      "Phone": vol.volunteer_phone || vol.phone || "N/A",
      "Assigned Location": vol.assigned_location || "N/A",
      "Volunteer ID": vol.volunteer_id || vol.id || "N/A",
      "Assigned Date": vol.assigned_at ? new Date(vol.assigned_at).toLocaleString() : "N/A",
      "Permissions": vol.permissions || "N/A"
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 25 }, // Volunteer Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 20 }, // Assigned Location
      { wch: 38 }, // Volunteer ID
      { wch: 20 }, // Assigned Date
      { wch: 20 }, // Permissions
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Volunteers");

    // Generate filename with current date
    const fileName = `Event_Volunteers_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, fileName);
  };

  const handleAddVolunteer = async () => {
    if (!volunteerId || !volunteerId.trim()) {
      alert("Please enter volunteer ID");
      return;
    }

    try {
      setAdding(true);
      const response = await api.post(`/event-manager/events/${eventId}/volunteers`, {
        volunteer_id: volunteerId.trim(),
        assigned_location: location.trim() || undefined
      });

      if (response.data?.success) {
        alert("Volunteer added successfully");
        setShowAddModal(false);
        setVolunteerId("");
        setLocation("");
        onUpdate();
      }
    } catch (error) {
      console.error("Error adding volunteer:", error);
      alert(error.response?.data?.message || "Failed to add volunteer");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveVolunteer = async (volId) => {
    if (!confirm("Remove this volunteer from the event?")) return;

    try {
      const response = await api.delete(`/event-manager/events/${eventId}/volunteers/${volId}`);
      if (response.data?.success) {
        alert("Volunteer removed successfully");
        onUpdate();
      }
    } catch (error) {
      console.error("Error removing volunteer:", error);
      alert(error.response?.data?.message || "Failed to remove volunteer");
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-lg font-semibold text-dark-text">Assigned Volunteers</h2>
        <div className="flex gap-2">
          {volunteers.length > 0 && (
            <button
              onClick={handleDownloadExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              <span>Download Excel</span>
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm font-medium flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Add Volunteer</span>
          </button>
        </div>
      </div>

      {volunteers.length > 0 ? (
        <div className="bg-card-background rounded-xl border border-light-gray-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Volunteer Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Volunteer ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {volunteers.map((vol) => (
                  <tr key={vol.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {vol.full_name?.charAt(0)?.toUpperCase() || "V"}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-dark-text">{vol.full_name || vol.volunteer_name || "N/A"}</div>
                          <div className="text-xs text-gray-700">
                            {vol.assigned_at ? new Date(vol.assigned_at).toLocaleDateString() : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{vol.volunteer_email || vol.email || "N/A"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{vol.volunteer_phone || vol.phone || "N/A"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{vol.assigned_location || "N/A"}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded max-w-xs truncate" title={vol.volunteer_id || vol.id}>
                        {vol.volunteer_id || vol.id || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleRemoveVolunteer(vol.volunteer_id)}
                        className="text-red-600 hover:text-red-700 p-2 rounded hover:bg-red-50 transition"
                        title="Remove volunteer"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-card-background rounded-xl border border-light-gray-border">
          <span className="material-symbols-outlined text-6xl text-gray-300">groups</span>
          <p className="text-gray-700 mt-2">No volunteers assigned yet</p>
          <p className="text-sm text-gray-700 mt-1">Click "Add Volunteer" to assign volunteers to this event</p>
        </div>
      )}

      {/* Add Volunteer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card-background p-6 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-dark-text mb-4">Add Volunteer</h3>

            {/* Info Box */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Tip:</span> Enter the volunteer's ID (UUID format). You can find volunteer IDs from the system administrator.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volunteer ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={volunteerId}
                  onChange={(e) => setVolunteerId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                />
                <p className="mt-1 text-xs text-gray-700">
                  Enter the volunteer's unique ID
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., Main Gate, Registration Desk"
                />
              </div>
            </div>

            {/* Currently Assigned Volunteers Reference */}
            {volunteers.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">Currently Assigned Volunteers:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {volunteers.slice(0, 5).map((vol) => (
                    <div key={vol.id} className="text-xs text-gray-700">
                      {vol.full_name} - <span className="font-mono text-[10px]">{vol.volunteer_id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddVolunteer}
                disabled={adding}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add Volunteer"}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setVolunteerId("");
                  setLocation("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RegistrationsTab({ registrations }) {
  const getRegistrationStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED": return "bg-green-100 text-green-700";
      case "PENDING": return "bg-yellow-100 text-yellow-700";
      case "WAITLISTED": return "bg-blue-100 text-blue-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-700";
      case "PENDING": return "bg-yellow-100 text-yellow-700";
      case "FAILED": return "bg-red-100 text-red-700";
      case "NOT_REQUIRED": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "N/A";
    return status.replace(/_/g, " ");
  };

  const handleDownloadExcel = () => {
    if (registrations.length === 0) {
      alert("No registrations to download");
      return;
    }

    // Prepare data for Excel
    const excelData = registrations.map((reg) => ({
      "Student Name": reg.student_name || "N/A",
      "Email": reg.student_email || "N/A",
      "Registration No": reg.student_registration_no || "N/A",
      "Phone": reg.student_phone || "N/A",
      "Registration Status": formatStatus(reg.registration_status),
      "Payment Status": formatStatus(reg.payment_status),
      "Registration Date": reg.registered_at ? new Date(reg.registered_at).toLocaleString() : "N/A",
      "Checked In": reg.has_checked_in ? "Yes" : "No",
      "Check In Count": reg.check_in_count || 0,
      "Last Check In": reg.last_check_in_at ? new Date(reg.last_check_in_at).toLocaleString() : "N/A",
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Student Name
      { wch: 30 }, // Email
      { wch: 15 }, // Registration No
      { wch: 15 }, // Phone
      { wch: 18 }, // Registration Status
      { wch: 18 }, // Payment Status
      { wch: 20 }, // Registration Date
      { wch: 12 }, // Checked In
      { wch: 12 }, // Check In Count
      { wch: 20 }, // Last Check In
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

    // Generate filename with current date
    const fileName = `Event_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dark-text">Event Registrations</h2>
        {registrations.length > 0 && (
          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            <span>Download Excel</span>
          </button>
        )}
      </div>

      {registrations.length > 0 ? (
        <div className="bg-card-background rounded-xl border border-light-gray-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-dark-text whitespace-nowrap">{reg.student_name || "N/A"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{reg.student_email || "N/A"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRegistrationStatusColor(reg.registration_status)}`}>
                        {formatStatus(reg.registration_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPaymentStatusColor(reg.payment_status)}`}>
                        {formatStatus(reg.payment_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-card-background rounded-xl border border-light-gray-border">
          <span className="material-symbols-outlined text-6xl text-gray-300">how_to_reg</span>
          <p className="text-gray-700 mt-2">No registrations yet</p>
        </div>
      )}
    </div>
  );
}

function StallsTab({ stalls, eventId, onUpdate }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [stallId, setStallId] = useState("");
  const [adding, setAdding] = useState(false);

  const handleDownloadExcel = () => {
    if (stalls.length === 0) {
      alert("No stalls to download");
      return;
    }

    // Prepare data for Excel
    const excelData = stalls.map((stall, index) => ({
      "S.No": index + 1,
      "Stall Number": stall.stall_number || "N/A",
      "Stall Name": stall.stall_name || "N/A",
      "School/Department": stall.school_name || "N/A",
      "Location": stall.location || "N/A",
      "Description": stall.description || "N/A",
      "Stall ID": stall.id || "N/A",
      "Total Feedback": stall.total_feedback_count || 0,
      "Weighted Score": stall.weighted_score || 0
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 12 }, // Stall Number
      { wch: 25 }, // Stall Name
      { wch: 25 }, // School/Department
      { wch: 20 }, // Location
      { wch: 35 }, // Description
      { wch: 38 }, // Stall ID
      { wch: 15 }, // Total Feedback
      { wch: 15 }, // Weighted Score
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stalls");

    // Generate filename with current date
    const fileName = `Event_Stalls_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, fileName);
  };

  const handleAddStall = async () => {
    if (!stallId || !stallId.trim()) {
      alert("Please enter stall ID");
      return;
    }

    try {
      setAdding(true);
      const response = await api.post(`/event-manager/events/${eventId}/stalls`, {
        stall_id: stallId.trim()
      });

      if (response.data?.success) {
        alert("Stall assigned successfully");
        setShowAddModal(false);
        setStallId("");
        onUpdate();
      }
    } catch (error) {
      console.error("Error assigning stall:", error);
      alert(error.response?.data?.message || "Failed to assign stall");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveStall = async (stId) => {
    if (!confirm("Remove this stall from the event?")) return;

    try {
      const response = await api.delete(`/event-manager/events/${eventId}/stalls/${stId}`);
      if (response.data?.success) {
        alert("Stall removed successfully");
        onUpdate();
      }
    } catch (error) {
      console.error("Error removing stall:", error);
      alert(error.response?.data?.message || "Failed to remove stall");
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-lg font-semibold text-dark-text">Assigned Stalls</h2>
        <div className="flex gap-2">
          {stalls.length > 0 && (
            <button
              onClick={handleDownloadExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              <span>Download Excel</span>
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm font-medium flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Assign Stall</span>
          </button>
        </div>
      </div>

      {stalls.length > 0 ? (
        <div className="bg-card-background rounded-xl border border-light-gray-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Stall #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Stall Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">School/Dept</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Stall ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stalls.map((stall) => (
                  <tr key={stall.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white font-semibold">
                          <span className="material-symbols-outlined">store</span>
                        </div>
                        <div className="text-sm font-medium text-dark-text">
                          #{stall.stall_number || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-dark-text">{stall.stall_name || "N/A"}</div>
                      {stall.description && (
                        <div className="text-xs text-gray-700 truncate max-w-xs" title={stall.description}>
                          {stall.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{stall.school_name || "N/A"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{stall.location || "N/A"}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded max-w-xs truncate" title={stall.id}>
                        {stall.id || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleRemoveStall(stall.id)}
                        className="text-red-600 hover:text-red-700 p-2 rounded hover:bg-red-50 transition"
                        title="Remove stall"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-card-background rounded-xl border border-light-gray-border">
          <span className="material-symbols-outlined text-6xl text-gray-300">store</span>
          <p className="text-gray-700 mt-2">No stalls assigned yet</p>
          <p className="text-sm text-gray-700 mt-1">Click "Assign Stall" to add stalls to this event</p>
        </div>
      )}

      {/* Add Stall Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card-background p-6 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-dark-text mb-4">Assign Stall</h3>

            {/* Info Box */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Tip:</span> Enter the stall's ID (UUID format). You can find stall IDs from the system administrator.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stall ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={stallId}
                  onChange={(e) => setStallId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                />
                <p className="mt-1 text-xs text-gray-700">
                  Enter the stall's unique ID to assign it to this event
                </p>
              </div>
            </div>

            {/* Currently Assigned Stalls Reference */}
            {stalls.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">Currently Assigned Stalls:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {stalls.slice(0, 5).map((stall) => (
                    <div key={stall.id} className="text-xs text-gray-700">
                      Stall #{stall.stall_number} - {stall.school_name} - <span className="font-mono text-[10px]">{stall.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddStall}
                disabled={adding}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
              >
                {adding ? "Assigning..." : "Assign Stall"}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setStallId("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ analytics, stats, event, registrations }) {
  if (!analytics) {
    return (
      <div className="text-center py-12 bg-card-background rounded-xl border border-light-gray-border">
        <span className="material-symbols-outlined text-6xl text-gray-300">analytics</span>
        <p className="text-gray-700 mt-2">Analytics data not available</p>
      </div>
    );
  }

  // Calculate correct registration counts from actual registrations data
  const getCorrectCounts = () => {
    if (!registrations || registrations.length === 0) {
      return {
        total: 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0,
        waitlisted: 0
      };
    }

    const isPaidEvent = event?.event_type === 'PAID';

    // Total - all registrations
    const total = registrations.length;

    // Confirmed - only payment completed for paid events
    const confirmed = registrations.filter(reg => {
      if (isPaidEvent) {
        return reg.payment_status === 'COMPLETED';
      }
      return reg.registration_status === 'CONFIRMED' ||
             reg.payment_status === 'NOT_REQUIRED' ||
             reg.payment_status === 'COMPLETED';
    }).length;

    // Pending - payment pending
    const pending = registrations.filter(reg => {
      if (isPaidEvent) {
        return reg.payment_status === 'PENDING';
      }
      return reg.registration_status === 'PENDING';
    }).length;

    const cancelled = registrations.filter(reg =>
      reg.registration_status === 'CANCELLED' || reg.payment_status === 'FAILED'
    ).length;

    const waitlisted = registrations.filter(reg =>
      reg.registration_status === 'WAITLISTED'
    ).length;

    return {
      total,
      confirmed,
      pending,
      cancelled,
      waitlisted
    };
  };

  const counts = getCorrectCounts();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-dark-text">Event Analytics</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registrations"
          value={counts.total}
          icon="how_to_reg"
        />
        <StatCard
          title="Confirmed"
          value={counts.confirmed}
          icon="check_circle"
          positive
        />
        <StatCard
          title="Total Revenue"
          value={`₹${analytics?.stats?.total_revenue || 0}`}
          icon="payments"
          positive
        />
        <StatCard
          title="Volunteers"
          value={analytics?.stats?.volunteers?.total_volunteers || 0}
          icon="groups"
        />
      </div>

      {/* Registration Stats */}
      <div className="bg-card-background p-6 rounded-xl border border-light-gray-border">
        <h3 className="text-base font-semibold text-dark-text mb-4">Registration Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold text-green-600">{counts.confirmed}</p>
            <p className="text-sm text-gray-700">Confirmed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">{counts.pending}</p>
            <p className="text-sm text-gray-700">Pending</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{counts.cancelled}</p>
            <p className="text-sm text-gray-700">Cancelled</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-700">{counts.waitlisted}</p>
            <p className="text-sm text-gray-700">Waitlisted</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, positive }) {
  return (
    <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-gray-700">{title}</p>
          <h3 className="text-2xl font-bold text-dark-text mt-1">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${positive ? 'bg-green-100' : 'bg-blue-100'}`}>
          <span className={`material-symbols-outlined text-xl ${positive ? 'text-green-600' : 'text-primary'}`}>
            {icon}
          </span>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-700">{label}</p>
      <p className="text-base text-dark-text font-medium">{value}</p>
    </div>
  );
}

function DateRow({ label, value, icon }) {
  return (
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-primary">{icon}</span>
      <div>
        <p className="text-sm text-gray-700">{label}</p>
        <p className="text-base text-dark-text font-medium">{value}</p>
      </div>
    </div>
  );
}
