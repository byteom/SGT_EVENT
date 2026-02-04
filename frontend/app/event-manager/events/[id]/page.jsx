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
  const [attendance, setAttendance] = useState(null);
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
      
      // First fetch event details to check status
      const eventRes = await api.get(`/event-manager/events/${eventId}`).catch(() => ({ data: { success: false } }));
      
      if (!eventRes.data?.success) {
        alert("Failed to load event details");
        router.push("/event-manager/events");
        return;
      }
      
      const eventData = eventRes.data.data.event;
      setEvent(eventData);
      setStats(eventRes.data.data.stats);
      
      // Check if event is approved/active/completed for analytics
      const canShowAnalytics = ['APPROVED', 'ACTIVE', 'COMPLETED'].includes(eventData.status);
      
      // Fetch remaining data in parallel
      const [volunteersRes, registrationsRes, stallsRes, analyticsRes, attendanceRes] = await Promise.all([
        api.get(`/event-manager/events/${eventId}/volunteers/list`).catch(() => ({ data: { success: false, data: { volunteers: [] } } })),
        api.get(`/event-manager/events/${eventId}/registrations`).catch(() => ({ data: { success: false, data: { data: [] } } })),
        api.get(`/event-manager/events/${eventId}/stalls/list`).catch(() => ({ data: { success: false, data: { stalls: [] } } })),
        // Only fetch analytics for approved/active/completed events
        canShowAnalytics 
          ? api.get(`/event-manager/events/${eventId}/analytics`).catch(() => ({ data: { success: false, data: null } }))
          : Promise.resolve({ data: { success: false, data: null } }),
        // Fetch attendance data
        api.get(`/event-manager/events/${eventId}/attendance`).catch(() => ({ data: { success: false, data: null } }))
      ]);

      if (volunteersRes.data?.success) {
        console.log('✅ Volunteers Response:', volunteersRes.data);
        const volunteersArray = volunteersRes.data.data?.volunteers || volunteersRes.data.data || [];
        console.log('👥 Volunteers Array:', volunteersArray, 'Length:', volunteersArray.length);
        setVolunteers(volunteersArray);
      } else {
        console.log('❌ Volunteers fetch failed:', volunteersRes.data);
        setVolunteers([]);
      }

      if (registrationsRes.data?.success) {
        setRegistrations(registrationsRes.data.data.data || []);
      } else {
        setRegistrations([]);
      }

      if (stallsRes.data?.success) {
        console.log('✅ Stalls Response:', stallsRes.data);
        const stallsArray = stallsRes.data.data || [];
        console.log('📦 Stalls Array:', stallsArray, 'Length:', stallsArray.length);
        setStalls(stallsArray);
      } else {
        console.log('❌ Stalls fetch failed:', stallsRes.data);
        setStalls([]);
      }

      if (analyticsRes.data?.success) {
        setAnalytics(analyticsRes.data.data);
      } else {
        setAnalytics(null);
      }

      if (attendanceRes.data?.success) {
        setAttendance(attendanceRes.data.data);
      } else {
        setAttendance(null);
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

  const handleSubmitForApproval = async () => {
    if (!confirm("Submit this event for admin approval? You won't be able to edit it after submission.")) {
      return;
    }

    try {
      const response = await api.post(`/event-manager/events/${eventId}/submit-for-approval`);
      if (response.data?.success) {
        alert("Event submitted for approval successfully!");
        fetchEventDetails();
      } else {
        alert(response.data?.message || "Failed to submit for approval");
      }
    } catch (error) {
      console.error("Error submitting for approval:", error);
      alert(error.response?.data?.message || "Failed to submit for approval");
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
                  {event.status === 'DRAFT' && (
                    <button
                      onClick={handleSubmitForApproval}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">send</span>
                      <span>Submit for Approval</span>
                    </button>
                  )}
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
                <TabButton label="Attendance" icon="assignment_turned_in" count={attendance?.summary?.total_registered} active={activeTab === "attendance"} onClick={() => setActiveTab("attendance")} />
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

            {activeTab === "attendance" && (
              <AttendanceTab eventId={eventId} initialData={attendance} />
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [volunteerForm, setVolunteerForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    assigned_location: ""
  });
  const [passwordForm, setPasswordForm] = useState({
    new_password: "",
    confirm_password: ""
  });
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

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
    if (!volunteerForm.full_name || !volunteerForm.email) {
      alert("Please enter volunteer name and email");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(volunteerForm.email)) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      setAdding(true);
      const response = await api.post(`/event-manager/events/${eventId}/volunteers/create`, {
        full_name: volunteerForm.full_name.trim(),
        email: volunteerForm.email.trim().toLowerCase(),
        phone: volunteerForm.phone.trim() || undefined,
        assigned_location: volunteerForm.assigned_location.trim() || undefined,
        event_id: eventId
      });

      if (response.data?.success) {
        const msg = response.data.message || "Volunteer created successfully";
        alert(msg);
        setShowAddModal(false);
        setVolunteerForm({ full_name: "", email: "", phone: "", assigned_location: "" });
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

  const handleEditVolunteer = (volunteer) => {
    setSelectedVolunteer(volunteer);
    setVolunteerForm({
      full_name: volunteer.full_name || volunteer.volunteer_name || "",
      email: volunteer.volunteer_email || volunteer.email || "",
      phone: volunteer.volunteer_phone || volunteer.phone || "",
      assigned_location: volunteer.assigned_location || ""
    });
    setShowEditModal(true);
  };

  const handleUpdateVolunteer = async () => {
    if (!volunteerForm.full_name || !volunteerForm.email) {
      alert("Please enter volunteer name and email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(volunteerForm.email)) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      setUpdating(true);
      const response = await api.put(`/event-manager/events/${eventId}/volunteers/${selectedVolunteer.volunteer_id || selectedVolunteer.id}/update`, {
        full_name: volunteerForm.full_name.trim(),
        email: volunteerForm.email.trim().toLowerCase(),
        phone: volunteerForm.phone.trim() || undefined,
        assigned_location: volunteerForm.assigned_location.trim() || undefined
      });

      if (response.data?.success) {
        alert("Volunteer updated successfully");
        setShowEditModal(false);
        setSelectedVolunteer(null);
        setVolunteerForm({ full_name: "", email: "", phone: "", assigned_location: "" });
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating volunteer:", error);
      alert(error.response?.data?.message || "Failed to update volunteer");
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenPasswordModal = (volunteer) => {
    setSelectedVolunteer(volunteer);
    setPasswordForm({ new_password: "", confirm_password: "" });
    setShowPasswordModal(true);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.new_password || !passwordForm.confirm_password) {
      alert("Please enter and confirm the new password");
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert("Passwords do not match");
      return;
    }

    if (passwordForm.new_password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      setChangingPassword(true);
      const response = await api.post(`/volunteer/${selectedVolunteer.volunteer_id || selectedVolunteer.id}/change-password`, {
        new_password: passwordForm.new_password
      });

      if (response.data?.success) {
        alert("Password changed successfully");
        setShowPasswordModal(false);
        setSelectedVolunteer(null);
        setPasswordForm({ new_password: "", confirm_password: "" });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert(error.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditVolunteer(vol)}
                          className="text-blue-600 hover:text-blue-700 p-2 rounded hover:bg-blue-50 transition"
                          title="Edit volunteer"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleOpenPasswordModal(vol)}
                          className="text-green-600 hover:text-green-700 p-2 rounded hover:bg-green-50 transition"
                          title="Change password"
                        >
                          <span className="material-symbols-outlined text-lg">key</span>
                        </button>
                        <button
                          onClick={() => handleRemoveVolunteer(vol.volunteer_id)}
                          className="text-red-600 hover:text-red-700 p-2 rounded hover:bg-red-50 transition"
                          title="Remove volunteer"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
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
            <h3 className="text-lg font-semibold text-dark-text mb-4">Create New Volunteer</h3>

            {/* Info Box */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Note:</span> A default password will be generated for the volunteer based on their name and event code.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={volunteerForm.full_name}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={volunteerForm.email}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={volunteerForm.phone}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., 9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Location
                </label>
                <input
                  type="text"
                  value={volunteerForm.assigned_location}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, assigned_location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., Main Gate, Registration Desk"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddVolunteer}
                disabled={adding}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
              >
                {adding ? "Creating..." : "Create Volunteer"}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setVolunteerForm({ full_name: "", email: "", phone: "", assigned_location: "" });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Volunteer Modal */}
      {showEditModal && selectedVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card-background p-6 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-dark-text mb-4">Edit Volunteer</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={volunteerForm.full_name}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={volunteerForm.email}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={volunteerForm.phone}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., 9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Location
                </label>
                <input
                  type="text"
                  value={volunteerForm.assigned_location}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, assigned_location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., Main Gate, Registration Desk"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateVolunteer}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
              >
                {updating ? "Updating..." : "Update Volunteer"}
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedVolunteer(null);
                  setVolunteerForm({ full_name: "", email: "", phone: "", assigned_location: "" });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card-background p-6 rounded-xl max-w-md w-full">
            <h3 className="text-lg font-semibold text-dark-text mb-4">Change Volunteer Password</h3>
            
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Changing password for: <span className="font-medium">{selectedVolunteer.full_name || selectedVolunteer.volunteer_name}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedVolunteer(null);
                  setPasswordForm({ new_password: "", confirm_password: "" });
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

function StallsTab({ stalls, eventId, onUpdate }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedStall, setSelectedStall] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [qrCodeImage, setQRCodeImage] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [schools, setSchools] = useState([]);
  const [formData, setFormData] = useState({
    stall_name: "",
    stall_code: "",
    location: "",
    description: "",
    points: "",
    school_id: "",
  });
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Fetch schools when modal opens
  useEffect(() => {
    if (showAddModal || showEditModal) {
      fetchSchools();
    }
  }, [showAddModal, showEditModal]);

  const fetchSchools = async () => {
    try {
      const response = await api.get('/event-manager/schools');
      if (response.data?.success) {
        setSchools(response.data.data.schools || []);
        // Auto-select first school if available
        if (response.data.data.schools?.length > 0 && !formData.school_id) {
          setFormData(prev => ({ ...prev, school_id: response.data.data.schools[0].id }));
        }
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
    }
  };

  const handleAddStall = async () => {
    if (!formData.stall_name || !formData.stall_code) {
      alert("Stall name and code are required");
      return;
    }

    if (!formData.school_id) {
      alert("Please select a school/department");
      return;
    }

    try {
      setAdding(true);
      const payload = {
        stall_name: formData.stall_name,
        stall_number: formData.stall_code.toUpperCase(), // Backend expects stall_number
        location: formData.location || null,
        description: formData.description || null,
        school_id: formData.school_id,
        points_awarded: formData.points ? parseInt(formData.points) : 0,
      };

      const response = await api.post(`/event-manager/events/${eventId}/stalls/create`, payload);
      
      if (response.data?.success) {
        alert("Stall added successfully!");
        setShowAddModal(false);
        setFormData({
          stall_name: "",
          stall_code: "",
          location: "",
          description: "",
          points: "",
          school_id: "",
        });
        onUpdate(); // Refresh data
      }
    } catch (error) {
      console.error("Error adding stall:", error);
      alert(error.response?.data?.message || "Failed to add stall");
    } finally {
      setAdding(false);
    }
  };

  const handleDownloadExcel = () => {
    if (stalls.length === 0) {
      alert("No stalls to download");
      return;
    }

    const excelData = stalls.map((stall, index) => ({
      "S.No": index + 1,
      "Stall Name": stall.stall_name || "N/A",
      "Stall Code": stall.stall_code || "N/A",
      "Location": stall.location || "N/A",
      "Description": stall.description || "N/A",
      "Points": stall.points_awarded || 0,
      "Total Scans": stall.total_scans || 0,
      "Status": stall.is_active ? "Active" : "Inactive",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 30 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stalls");
    XLSX.writeFile(workbook, `event_${eventId}_stalls.xlsx`);
  };

  const handleEditStall = (stall) => {
    setSelectedStall(stall);
    setFormData({
      stall_name: stall.stall_name || "",
      stall_code: stall.stall_number || stall.stall_code || "",
      location: stall.location || "",
      description: stall.description || "",
      points: stall.points_awarded?.toString() || "",
      school_id: stall.school_id || ""
    });
    setShowEditModal(true);
  };

  const handleUpdateStall = async () => {
    if (!formData.stall_name || !formData.stall_code) {
      alert("Stall name and code are required");
      return;
    }

    if (!formData.school_id) {
      alert("Please select a school/department");
      return;
    }

    try {
      setUpdating(true);
      const payload = {
        stall_name: formData.stall_name,
        stall_number: formData.stall_code.toUpperCase(),
        location: formData.location || null,
        description: formData.description || null,
        school_id: formData.school_id,
        points_awarded: formData.points ? parseInt(formData.points) : 0,
      };

      const response = await api.put(`/event-manager/events/${eventId}/stalls/${selectedStall.id}/update`, payload);
      
      if (response.data?.success) {
        alert("Stall updated successfully!");
        setShowEditModal(false);
        setSelectedStall(null);
        setFormData({
          stall_name: "",
          stall_code: "",
          location: "",
          description: "",
          points: "",
          school_id: "",
        });
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating stall:", error);
      alert(error.response?.data?.message || "Failed to update stall");
    } finally {
      setUpdating(false);
    }
  };

  const handleViewQRCode = async (stall) => {
    setSelectedStall(stall);
    setShowQRModal(true);
    setLoadingQR(true);
    
    try {
      const response = await api.get(`/stall/${stall.id}/qr-code`);
      if (response.data?.success) {
        setQRCodeImage(response.data.data.qr_code);
      }
    } catch (error) {
      console.error("Error fetching QR code:", error);
      alert("Failed to load QR code");
    } finally {
      setLoadingQR(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeImage || !selectedStall) return;
    
    try {
      const link = document.createElement('a');
      link.href = qrCodeImage;
      link.download = `Stall-QR-${selectedStall.stall_number || selectedStall.stall_code || selectedStall.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading QR code:", error);
      alert("Failed to download QR code");
    }
  };

  const handleViewFeedbacks = async (stall) => {
    setSelectedStall(stall);
    setShowFeedbackModal(true);
    setLoadingFeedbacks(true);
    setFeedbackData(null);
    
    try {
      const response = await api.get(`/event-manager/events/${eventId}/stalls/${stall.id}/feedbacks`);
      if (response.data?.success) {
        setFeedbackData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      alert("Failed to load feedbacks");
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-lg font-semibold text-dark-text">Stalls ({stalls.length})</h2>
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
            <span>Add Stall</span>
          </button>
        </div>
      </div>

      {stalls.length > 0 ? (
        <div className="bg-card-background rounded-xl border border-light-gray-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Stall</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Points</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Feedbacks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stalls.map((stall) => (
                  <tr key={stall.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-dark-text">{stall.stall_name}</div>
                      {stall.description && (
                        <div className="text-xs text-gray-700 mt-0.5">{stall.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-dark-text">{stall.stall_number || stall.stall_code}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{stall.location || "N/A"}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-primary">{stall.points_awarded || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewFeedbacks(stall)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition group"
                        title="View feedbacks"
                      >
                        <span className="material-symbols-outlined text-base">reviews</span>
                        <span className="text-sm font-medium">{stall.feedback_count || 0}</span>
                        {(stall.average_rating || 0) > 0 && (
                          <span className="text-xs text-amber-600">
                            ({stall.average_rating?.toFixed(1)}★)
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        stall.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {stall.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewQRCode(stall)}
                          className="text-purple-600 hover:text-purple-700 p-2 rounded hover:bg-purple-50 transition"
                          title="View QR Code"
                        >
                          <span className="material-symbols-outlined text-lg">qr_code</span>
                        </button>
                        <button
                          onClick={() => handleEditStall(stall)}
                          className="text-blue-600 hover:text-blue-700 p-2 rounded hover:bg-blue-50 transition"
                          title="Edit stall"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                      </div>
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
          <p className="text-gray-700 mt-2">No stalls created yet</p>
          <p className="text-sm text-gray-700 mt-1">Click "Add Stall" to create stalls for this event</p>
        </div>
      )}

      {/* Add Stall Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card-background p-6 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-dark-text mb-4">Add Stall</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School/Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.school_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, school_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select School/Department</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>
                      {school.school_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stall Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.stall_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, stall_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., Registration Desk"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stall Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.stall_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, stall_code: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600 uppercase"
                  placeholder="e.g., STALL01"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., Main Hall, Block A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="Brief description of the stall"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points Awarded (per scan)
                </label>
                <input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData(prev => ({ ...prev, points: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., 10"
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddStall}
                disabled={adding}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add Stall"}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({
                    stall_name: "",
                    stall_code: "",
                    location: "",
                    description: "",
                    points: "",
                    school_id: "",
                  });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Stall Modal */}
      {showEditModal && selectedStall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card-background p-6 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-dark-text mb-4">Edit Stall</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School/Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.school_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, school_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select School/Department</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>
                      {school.school_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stall Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.stall_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, stall_name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., Registration Desk"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stall Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.stall_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, stall_code: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600 uppercase"
                  placeholder="e.g., STALL01"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., Main Hall, Block A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="Brief description of the stall"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points Awarded (per scan)
                </label>
                <input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData(prev => ({ ...prev, points: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., 10"
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateStall}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
              >
                {updating ? "Updating..." : "Update Stall"}
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedStall(null);
                  setFormData({
                    stall_name: "",
                    stall_code: "",
                    location: "",
                    description: "",
                    points: "",
                    school_id: "",
                  });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedStall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card-background p-6 rounded-xl max-w-md w-full">
            <h3 className="text-lg font-semibold text-dark-text mb-4">Stall QR Code</h3>

            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                <span className="font-medium">{selectedStall.stall_name}</span>
              </p>
              <p className="text-xs text-purple-700 mt-1">
                Code: {selectedStall.stall_number || selectedStall.stall_code}
              </p>
            </div>

            <div className="flex flex-col items-center">
              {loadingQR ? (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : qrCodeImage ? (
                <div className="w-64 h-64 bg-white p-4 rounded-lg border-2 border-gray-200">
                  <img src={qrCodeImage} alt="Stall QR Code" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">QR Code not available</p>
                </div>
              )}

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-700 mb-3">
                  Scan this QR code to provide feedback for this stall
                </p>
                
                {qrCodeImage && (
                  <button
                    onClick={handleDownloadQR}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium flex items-center gap-2 mx-auto"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                    Download QR Code
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setSelectedStall(null);
                  setQRCodeImage(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Details Modal */}
      {showFeedbackModal && selectedStall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card-background p-6 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-dark-text">Stall Feedbacks</h3>
                <p className="text-sm text-gray-600">{selectedStall.stall_name}</p>
              </div>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setSelectedStall(null);
                  setFeedbackData(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {loadingFeedbacks ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : feedbackData ? (
              <>
                {/* Summary Section */}
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-amber-700">
                          {feedbackData.summary.average_rating || 0}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-800">Average Rating</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-lg ${
                                star <= Math.round(feedbackData.summary.average_rating || 0)
                                  ? 'text-amber-500'
                                  : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-700">{feedbackData.summary.total_feedbacks}</p>
                      <p className="text-xs text-amber-600">Total Feedbacks</p>
                    </div>
                  </div>
                  
                  {/* Rating Distribution */}
                  <div className="mt-3 pt-3 border-t border-amber-200">
                    <p className="text-xs font-medium text-amber-700 mb-2">Rating Distribution</p>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="bg-white rounded px-2 py-1">
                          <p className="text-xs text-gray-600">{rating}★</p>
                          <p className="text-sm font-semibold text-amber-700">
                            {feedbackData.summary.rating_distribution[rating] || 0}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Feedbacks List */}
                <div className="flex-1 overflow-y-auto">
                  {feedbackData.feedbacks.length > 0 ? (
                    <div className="space-y-3">
                      {feedbackData.feedbacks.map((feedback) => (
                        <div
                          key={feedback.feedback_id}
                          className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                {feedback.student.name?.charAt(0)?.toUpperCase() || 'S'}
                              </div>
                              <div>
                                <p className="font-medium text-dark-text">{feedback.student.name}</p>
                                <p className="text-xs text-gray-500">
                                  {feedback.student.registration_no} • {feedback.student.school || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded">
                              <span className="text-amber-500 text-lg">★</span>
                              <span className="font-semibold text-amber-700">{feedback.rating}</span>
                            </div>
                          </div>
                          
                          {feedback.comment && (
                            <p className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                              "{feedback.comment}"
                            </p>
                          )}
                          
                          <p className="mt-2 text-xs text-gray-400">
                            {new Date(feedback.date).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-5xl text-gray-300">rate_review</span>
                      <p className="text-gray-500 mt-2">No feedbacks yet</p>
                      <p className="text-sm text-gray-400 mt-1">Students can give feedback by scanning the stall QR code</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl text-red-300">error</span>
                <p className="text-gray-500 mt-2">Failed to load feedbacks</p>
              </div>
            )}

            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setSelectedStall(null);
                  setFeedbackData(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Close
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

function AttendanceTab({ eventId, initialData }) {
  const [attendanceData, setAttendanceData] = useState(initialData?.attendance_data || []);
  const [summary, setSummary] = useState(initialData?.summary || {});
  const [schoolBreakdown, setSchoolBreakdown] = useState(initialData?.school_breakdown || []);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [feedbackFilter, setFeedbackFilter] = useState("");
  const [sortBy, setSortBy] = useState("check_in_time");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(initialData?.pagination || {});
  
  // Detail modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setAttendanceData(initialData.attendance_data || []);
      setSummary(initialData.summary || {});
      setSchoolBreakdown(initialData.school_breakdown || []);
      setPagination(initialData.pagination || {});
    }
  }, [initialData]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (schoolFilter) params.append("school_id", schoolFilter);
      if (feedbackFilter) params.append("has_feedback", feedbackFilter);
      if (sortBy) params.append("sort_by", sortBy);
      params.append("page", currentPage);
      params.append("limit", 50);

      const response = await api.get(`/event-manager/events/${eventId}/attendance?${params.toString()}`);
      if (response.data?.success) {
        setAttendanceData(response.data.data.attendance_data || []);
        setSummary(response.data.data.summary || {});
        setSchoolBreakdown(response.data.data.school_breakdown || []);
        setPagination(response.data.data.pagination || {});
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      alert(error.response?.data?.message || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (schoolFilter) params.append("school_id", schoolFilter);
      if (feedbackFilter) params.append("has_feedback", feedbackFilter);

      const response = await api.get(`/event-manager/events/${eventId}/attendance/export?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-${eventId}-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting attendance:", error);
      alert("Failed to export attendance data");
    } finally {
      setExporting(false);
    }
  };

  const handleViewDetail = async (studentId) => {
    try {
      setDetailLoading(true);
      setSelectedStudent(studentId);
      const response = await api.get(`/event-manager/events/${eventId}/attendance/${studentId}`);
      if (response.data?.success) {
        setStudentDetail(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching student detail:", error);
      alert("Failed to load student attendance details");
      setSelectedStudent(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchAttendance();
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setSearchQuery("");
    setSchoolFilter("");
    setFeedbackFilter("");
    setSortBy("check_in_time");
    setCurrentPage(1);
    fetchAttendance();
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "checked_in":
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">Currently Checked In</span>;
      case "checked_out":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">Checked Out</span>;
      case "not_attended":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">Not Attended</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 font-medium">Unknown</span>;
    }
  };

  const schools = [...new Set(schoolBreakdown.map(s => ({ id: s.school_id, name: s.school_name })))];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Registered" value={summary.total_registered || 0} icon="how_to_reg" />
        <StatCard title="Total Attended" value={summary.total_attended || 0} icon="check_circle" positive />
        <StatCard title="Currently Checked In" value={summary.currently_checked_in || 0} icon="login" />
        <StatCard title="Checked Out" value={summary.total_checked_out || 0} icon="logout" />
        <StatCard title="Not Attended" value={summary.not_attended || 0} icon="cancel" />
        <StatCard 
          title="Attendance Rate" 
          value={`${summary.attendance_rate || 0}%`} 
          icon="analytics" 
          positive={summary.attendance_rate >= 70}
        />
      </div>

      {/* Filters */}
      <div className="bg-card-background p-6 rounded-xl border border-light-gray-border shadow-soft">
        <h3 className="text-base font-semibold text-dark-text mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="checked_in">Currently Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="not_attended">Not Attended</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, Email, Phone, Reg No"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* School Filter */}
          <div>
            <label className="text-sm text-gray-700 mb-1 block">School</label>
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Schools</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          {/* Feedback Filter */}
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Feedback</label>
            <select
              value={feedbackFilter}
              onChange={(e) => setFeedbackFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Has Feedback</option>
              <option value="false">No Feedback</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="check_in_time">Check-in Time</option>
              <option value="feedback_count">Feedback Count</option>
              <option value="name">Name</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2 lg:col-span-3">
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-medium disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">filter_alt</span>
              <span>Apply Filters</span>
            </button>
            <button
              onClick={handleClearFilters}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
            >
              Clear
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 flex items-center gap-2 ml-auto"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              <span>{exporting ? "Exporting..." : "Export Excel"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* School Breakdown */}
      {schoolBreakdown.length > 0 && (
        <div className="bg-card-background p-6 rounded-xl border border-light-gray-border shadow-soft">
          <h3 className="text-base font-semibold text-dark-text mb-4">School-wise Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schoolBreakdown.map((school) => (
              <div key={school.school_id} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-dark-text mb-2">{school.school_name}</p>
                <div className="flex justify-between text-xs text-gray-700">
                  <span>Registered: {school.total_registered}</span>
                  <span>Attended: {school.total_attended}</span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Attendance Rate</span>
                    <span className="font-medium">{school.attendance_rate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${school.attendance_rate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-base font-semibold text-dark-text">
            Attendance Records ({pagination.total || 0})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-700 mt-2">Loading attendance data...</p>
          </div>
        ) : attendanceData.length === 0 ? (
          <div className="p-8 text-center text-gray-700">
            <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">person_off</span>
            <p>No attendance records found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Reg No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">School</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Check-in</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Check-out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total Visits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Feedbacks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceData.map((record) => (
                    <tr key={record.student_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-dark-text">{record.student_name}</p>
                          <p className="text-xs text-gray-700">{record.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {record.registration_no || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {record.school_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatTime(record.first_check_in)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatTime(record.last_check_out)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                        {record.total_check_ins || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                        {record.total_feedbacks || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record.attendance_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetail(record.student_id)}
                          className="text-primary hover:text-primary-dark font-medium text-sm flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.current_page - 1) * pagination.limit) + 1} to{" "}
                  {Math.min(pagination.current_page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCurrentPage(prev => Math.max(1, prev - 1));
                      setTimeout(fetchAttendance, 100);
                    }}
                    disabled={pagination.current_page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {pagination.current_page} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => {
                      setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1));
                      setTimeout(fetchAttendance, 100);
                    }}
                    disabled={pagination.current_page === pagination.total_pages}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-dark-text">Student Attendance Details</h3>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentDetail(null);
                }}
                className="text-gray-700 hover:text-gray-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {detailLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-700 mt-2">Loading details...</p>
              </div>
            ) : studentDetail ? (
              <div className="p-6 space-y-6">
                {/* Student Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-dark-text mb-3">Student Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailRow label="Name" value={studentDetail.student?.student_name} />
                    <DetailRow label="Registration No" value={studentDetail.student?.registration_no} />
                    <DetailRow label="Email" value={studentDetail.student?.email} />
                    <DetailRow label="Phone" value={studentDetail.student?.phone} />
                    <DetailRow label="School" value={studentDetail.student?.school_name} />
                    <DetailRow label="Payment Status" value={studentDetail.student?.payment_status} />
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-dark-text mb-3">Attendance Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-700">Total Check-ins</p>
                      <p className="text-2xl font-bold text-primary">{studentDetail.attendance_summary?.total_check_ins || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">Total Duration</p>
                      <p className="text-2xl font-bold text-primary">
                        {Math.round((studentDetail.attendance_summary?.total_duration_minutes || 0))} min
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">Avg Duration</p>
                      <p className="text-2xl font-bold text-primary">
                        {Math.round((studentDetail.attendance_summary?.average_duration_minutes || 0))} min
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">Currently</p>
                      <p className="text-lg font-bold text-primary">
                        {studentDetail.attendance_summary?.currently_checked_in ? "Checked In" : "Checked Out"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Check-in/out History */}
                <div>
                  <h4 className="font-semibold text-dark-text mb-3">Check-in/out History</h4>
                  {studentDetail.check_in_out_history?.length > 0 ? (
                    <div className="space-y-2">
                      {studentDetail.check_in_out_history.map((history, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-gray-700">Type: </span>
                              <span className={`font-medium ${history.action_type === 'CHECKIN' ? 'text-green-600' : 'text-red-600'}`}>
                                {history.action_type}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-700">Time: </span>
                              <span className="font-medium">{formatTime(history.created_at)}</span>
                            </div>
                            <div>
                              <span className="text-gray-700">Volunteer: </span>
                              <span className="font-medium">{history.volunteer_name || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-gray-700">Duration: </span>
                              <span className="font-medium">
                                {history.duration_minutes ? `${Math.round(history.duration_minutes)} min` : "In Progress"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-700 text-center py-4">No check-in/out history</p>
                  )}
                </div>

                {/* Feedback History */}
                <div>
                  <h4 className="font-semibold text-dark-text mb-3">Feedback History</h4>
                  {studentDetail.feedback_history?.length > 0 ? (
                    <div className="space-y-2">
                      {studentDetail.feedback_history.map((feedback, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-dark-text">{feedback.stall_name}</p>
                              <p className="text-sm text-gray-700">{feedback.feedback_text || "No comment"}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">⭐ {feedback.rating || "N/A"}</p>
                              <p className="text-xs text-gray-700">{formatTime(feedback.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-700 text-center py-4">No feedback given</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
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
