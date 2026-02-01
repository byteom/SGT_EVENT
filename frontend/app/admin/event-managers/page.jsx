"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAuth";

export default function EventManagersPage() {
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [adminName, setAdminName] = useState("Admin");
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    organization: ""
  });
  const router = useRouter();

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      setAdminName(localStorage.getItem("admin_name") || "Admin");
      fetchManagers();
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

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/event-managers");
      if (response.data?.success) {
        setManagers(response.data.data.event_managers || response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
      alert(error.response?.data?.message || "Failed to load event managers");
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isLongEnough = password.length >= 8;

    if (!isLongEnough) return "Password must be at least 8 characters";
    if (!hasUpperCase) return "Password must contain at least one uppercase letter";
    if (!hasLowerCase) return "Password must contain at least one lowercase letter";
    if (!hasNumber) return "Password must contain at least one number";
    if (!hasSpecialChar) return "Password must contain at least one special character";
    return null;
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) return "Phone number must be exactly 10 digits";
    return null;
  };

  const handleCreateManager = async (e) => {
    e.preventDefault();

    // Validate phone
    const phoneError = validatePhone(formData.phone);
    if (phoneError) {
      alert(phoneError);
      return;
    }

    // Validate password
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      alert(passwordError);
      return;
    }

    try {
      const response = await api.post("/admin/event-managers", formData);
      if (response.data?.success) {
        alert("Event Manager created successfully");
        setShowCreateModal(false);
        setFormData({ email: "", password: "", full_name: "", phone: "", organization: "" });
        fetchManagers();
      }
    } catch (error) {
      console.error("Error creating manager:", error);
      alert(error.response?.data?.message || "Failed to create event manager");
    }
  };

  const handleUpdateManager = async (e) => {
    e.preventDefault();
    if (!selectedManager) return;

    try {
      const updateData = {
        full_name: formData.full_name,
        phone: formData.phone,
        organization: formData.organization,
        is_active: formData.is_active
      };

      const response = await api.put(`/admin/event-managers/${selectedManager.id}`, updateData);
      if (response.data?.success) {
        alert("Event Manager updated successfully");
        setShowEditModal(false);
        setSelectedManager(null);
        fetchManagers();
      }
    } catch (error) {
      console.error("Error updating manager:", error);
      alert(error.response?.data?.message || "Failed to update event manager");
    }
  };

  const handleDeleteManager = async (managerId) => {
    if (!confirm("Are you sure you want to delete this event manager? This will also affect their events.")) return;

    try {
      const response = await api.delete(`/admin/event-managers/${managerId}`);
      if (response.data?.success) {
        alert("Event Manager deleted successfully");
        fetchManagers();
      }
    } catch (error) {
      console.error("Error deleting manager:", error);
      alert(error.response?.data?.message || "Failed to delete event manager");
    }
  };

  const handleApproveManager = async (managerId) => {
    if (!confirm("Approve this event manager?")) return;

    try {
      const response = await api.put(`/admin/event-managers/${managerId}`, {
        is_approved_by_admin: true
      });
      if (response.data?.success) {
        alert("Event Manager approved successfully");
        fetchManagers();
      }
    } catch (error) {
      console.error("Error approving manager:", error);
      alert(error.response?.data?.message || "Failed to approve event manager");
    }
  };

  const openEditModal = (manager) => {
    setSelectedManager(manager);
    setFormData({
      full_name: manager.full_name || "",
      phone: manager.phone || "",
      organization: manager.organization || "",
      is_active: manager.is_active
    });
    setShowEditModal(true);
  };

  const openDetailModal = async (manager) => {
    setSelectedManager(manager);
    setShowDetailModal(true);
  };

  const filteredManagers = managers.filter(manager => {
    const matchesSearch =
      manager.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      manager.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      manager.organization?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "approved" && manager.is_approved_by_admin) ||
      (statusFilter === "pending" && !manager.is_approved_by_admin) ||
      (statusFilter === "active" && manager.is_active) ||
      (statusFilter === "inactive" && !manager.is_active);

    return matchesSearch && matchesStatus;
  });

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_name");
    router.replace("/");
  };

  const getStatusBadge = (manager) => {
    if (!manager.is_active) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Inactive</span>;
    }
    if (!manager.is_approved_by_admin) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Pending Approval</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Approved</span>;
  };

  return (
    <div className="bg-soft-background min-h-screen">
      <AdminSidebar onLogout={handleLogout} />
      <AdminHeader adminName={adminName} onLogout={handleLogout} />

      <main className="md:ml-64 p-4 sm:p-6 pt-16 sm:pt-20 pb-20 sm:pb-6">

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-700">search</span>
            <input
              type="text"
              placeholder="Search by name, email, organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card-background text-dark-text"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card-background text-dark-text"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Approval</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={() => {
              setFormData({ email: "", password: "", full_name: "", phone: "", organization: "" });
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 bg-blue-100 text-primary border border-blue-200 rounded-lg hover:bg-blue-200 transition font-medium flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span className="material-symbols-outlined">add</span>
            <span>Create Manager</span>
          </button>
        </div>

        {/* Managers List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading event managers...</p>
          </div>
        ) : filteredManagers.length === 0 ? (
          <div className="text-center py-12 bg-card-background rounded-xl border border-light-gray-border">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">person_off</span>
            <p className="text-gray-700">No event managers found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredManagers.map((manager) => (
              <div
                key={manager.id}
                className="bg-card-background rounded-xl border border-light-gray-border shadow-soft p-5 hover:shadow-md transition cursor-pointer"
                onClick={() => openDetailModal(manager)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-2xl">person</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark-text">{manager.full_name}</h3>
                      <p className="text-sm text-gray-700">{manager.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {manager.organization && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="material-symbols-outlined text-lg">business</span>
                      <span>{manager.organization}</span>
                    </div>
                  )}
                  {manager.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="material-symbols-outlined text-lg">phone</span>
                      <span>{manager.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="material-symbols-outlined text-lg">event</span>
                    <span>{manager.total_events_created || 0} Events Created</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  {getStatusBadge(manager)}
                  <div className="flex gap-2">
                    {!manager.is_approved_by_admin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveManager(manager.id);
                        }}
                        className="text-green-600 hover:text-green-700 p-1"
                        title="Approve"
                      >
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(manager);
                      }}
                      className="text-gray-700 hover:text-primary p-1"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteManager(manager.id);
                      }}
                      className="text-gray-700 hover:text-red-600 p-1"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <Modal title="Create Event Manager" onClose={() => setShowCreateModal(false)}>
            <form onSubmit={handleCreateManager} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card-background text-dark-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card-background text-dark-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  className="w-full px-4 py-2 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card-background text-dark-text"
                />
                <p className="text-xs text-gray-700 mt-1">Min 8 chars with uppercase, lowercase, number & special char</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  required
                  pattern="\d{10}"
                  maxLength={10}
                  placeholder="10 digit phone number"
                  className="w-full px-4 py-2 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card-background text-dark-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Organization
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full px-4 py-2 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card-background text-dark-text"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                >
                  Create Manager
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-light-gray-border rounded-lg hover:bg-gray-50 transition text-dark-text"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedManager && (
          <Modal title="Edit Event Manager" onClose={() => setShowEditModal(false)}>
            <form onSubmit={handleUpdateManager} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card-background text-dark-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={selectedManager.email}
                  disabled
                  className="w-full px-4 py-2 border border-light-gray-border rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
                <p className="text-xs text-gray-700 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card-background text-dark-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Organization
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full px-4 py-2 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card-background text-dark-text"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm text-dark-text">
                  Active Account
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-100 text-primary border border-blue-200 rounded-lg hover:bg-blue-200 transition"
                >
                  Update Manager
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-light-gray-border rounded-lg hover:bg-gray-50 transition text-dark-text"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedManager && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-light-gray-border">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-3xl">manage_accounts</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-dark-text">{selectedManager.full_name}</h2>
                    <p className="text-sm text-gray-700">{selectedManager.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-700 hover:text-gray-700"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="bg-soft-background rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-550 uppercase tracking-wider mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoCard label="Manager ID" value={selectedManager.id} mono />
                    <InfoCard label="Full Name" value={selectedManager.full_name} />
                    <InfoCard label="Email" value={selectedManager.email} />
                    <InfoCard label="Phone" value={selectedManager.phone || "Not provided"} />
                  </div>
                </div>

                {/* Organization Info */}
                <div className="bg-soft-background rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Organization Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoCard label="Organization" value={selectedManager.organization || "Not provided"} />
                    <InfoCard label="Total Events Created" value={selectedManager.total_events_created || 0} />
                  </div>
                </div>

                {/* Status Info */}
                <div className="bg-soft-background rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Account Status</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-light-gray-border">
                      <label className="block text-xs font-medium text-gray-700 mb-2">Account Status</label>
                      {selectedManager.is_active ? (
                        <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-light-gray-border">
                      <label className="block text-xs font-medium text-gray-700 mb-2">Approval Status</label>
                      {selectedManager.is_approved_by_admin ? (
                        <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                          Approved
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="bg-soft-background rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Timestamps</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoCard label="Created At" value={new Date(selectedManager.created_at).toLocaleString()} />
                    {selectedManager.approved_at && (
                      <InfoCard label="Approved At" value={new Date(selectedManager.approved_at).toLocaleString()} />
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-light-gray-border">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(selectedManager);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-light-gray-border rounded-lg hover:bg-gray-50 transition text-dark-text"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <AdminMobileNav />
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-dark-text">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-gray-700"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <p className={`text-dark-text ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
    </div>
  );
}

function InfoCard({ label, value, mono }) {
  return (
    <div className="bg-card-background rounded-lg p-3 border border-light-gray-border">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <p className={`text-dark-text font-medium ${mono ? 'font-mono text-xs break-all' : 'text-sm'}`}>
        {value || "—"}
      </p>
    </div>
  );
}
