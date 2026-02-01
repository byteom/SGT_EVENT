"use client";

import { useEffect, useState } from "react";
import EventManagerSidebar from "@/components/event-manager/EventManagerSidebar";
import EventManagerHeader from "@/components/event-manager/EventManagerHeader";
import EventManagerMobileNav from "@/components/event-manager/EventManagerMobileNav";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEventManagerAuth } from "@/hooks/useAuth";

export default function EventManagerProfile() {
  const { isAuthenticated, isChecking } = useEventManagerAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    organization: "",
    password: "",
  });

  // --- HOOKS & HANDLERS ---

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      fetchProfile();
    }
  }, [isChecking, isAuthenticated]);

  if (isChecking) {
    // SGT Theme Loading State
    return (
      <div className="min-h-screen bg-soft-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-dark-text">Loading Profile Data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/event-manager/profile");

      if (response.data?.success) {
        const manager = response.data.data.manager;
        setProfile(response.data.data);
        setFormData({
          full_name: manager.full_name || "",
          phone: manager.phone || "",
          organization: manager.organization || "",
          password: "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const payload = {};
      // Only include fields that have changed
      if (formData.full_name !== profile.manager.full_name) payload.full_name = formData.full_name;
      if (formData.phone !== profile.manager.phone) payload.phone = formData.phone;
      if (formData.organization !== profile.manager.organization) payload.organization = formData.organization;
      if (formData.password) payload.password = formData.password;

      if (Object.keys(payload).length === 0) {
        alert("No changes to update");
        setUpdating(false);
        return;
      }

      const response = await api.put("/event-manager/profile", payload);

      if (response.data?.success) {
        alert("Profile updated successfully!");
        // Update localStorage
        if (payload.full_name) {
          localStorage.setItem("event_manager_name", payload.full_name);
        }
        setEditing(false);
        fetchProfile(); // Re-fetch to update profile state
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdating(false);
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
  
  // --- HELPER COMPONENTS & UTILITIES (Defined before return statement) ---

  // Custom styled component for consistent input style
  const StyledInput = ({ label, type = "text", name, value, onChange, disabled, helperText }) => (
    <div>
        <label className="block text-sm font-medium text-dark-text mb-2">
            {label}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`
                w-full px-4 py-2.5 border border-light-gray-border rounded-xl 
                text-dark-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 shadow-sm
                ${disabled 
                    ? 'bg-gray-100 text-gray-700 cursor-not-allowed' 
                    : 'bg-card-background text-dark-text'
                }
            `}
        />
        {helperText && <p className="text-xs text-gray-700 mt-1 pl-1">{helperText}</p>}
    </div>
  );

  // Status Badge Component
  const StatusBadge = ({ status, text, colorClass, icon }) => (
      <span className={`inline-flex items-center gap-2 px-3 py-1 ${colorClass} rounded-full text-sm font-semibold tracking-wider`}>
          <span className="material-symbols-outlined text-base">{icon}</span>
          {text}
      </span>
  );

  // Utility for Approval Status Colors
  const getApprovalStatus = (isApproved) => 
    isApproved ? { 
        text: "Approved", 
        colorClass: "bg-emerald-500/10 text-emerald-600", 
        icon: "check_circle" 
    } : { 
        text: "Pending Approval", 
        colorClass: "bg-accent/10 text-accent", 
        icon: "pending" 
    };

  // Utility for Account Status Colors
  const getAccountStatus = (isActive) =>
    isActive ? {
        text: "Active",
        colorClass: "bg-primary/10 text-primary",
        icon: "lock_open"
    } : {
        text: "Inactive",
        colorClass: "bg-red-500/10 text-red-700",
        icon: "lock"
    };

  // Helper component for displaying info in VIEW MODE (FIXED: Defined outside return JSX)
  const InfoBlock = ({ label, value }) => (
      <div>
          <p className="text-sm text-gray-700">{label}</p>
          <p className="text-base text-dark-text font-semibold mt-1">{value || "N/A"}</p>
      </div>
  );
  
  // --- MAIN COMPONENT RETURN ---
  
  return (
    <div className="flex min-h-screen bg-soft-background">
      <EventManagerSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <EventManagerHeader managerName={profile?.manager?.full_name || "Event Manager"} onLogout={handleLogout} />

        <main className="p-4 sm:p-6 md:ml-64 pt-20 sm:pt-24 pb-20 sm:pb-6">
          <div className="max-w-4xl mx-auto">
            
            {/* --- HEADER --- */}
            {/* <div className="mb-8">
              <h1 className="text-3xl font-bold font-display text-dark-text">Profile & Settings</h1>
              <p className="text-base text-gray-700 mt-1">
                View your account status, performance metrics, and update your information.
              </p>
            </div> */}

            {loading ? (
              // --- SKELETON LOADER ---
              <div className="space-y-6">
                <div className="bg-card-background p-6 rounded-2xl border border-light-gray-border shadow-soft animate-pulse h-32"></div>
                <div className="bg-card-background p-6 rounded-2xl border border-light-gray-border shadow-soft animate-pulse h-40"></div>
                <div className="bg-card-background p-6 rounded-2xl border border-light-gray-border shadow-soft animate-pulse h-80"></div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* === 1. ACCOUNT STATUS CARD (Premium Look) === */}
                <div className="bg-card-background p-6 rounded-2xl border border-light-gray-border shadow-soft">
                  <h2 className="text-xl font-semibold text-dark-text mb-5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">verified_user</span> Account Status
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Approval Status */}
                    <div className="bg-soft-background p-4 rounded-xl">
                        <p className="text-sm text-gray-700 mb-2">Approval Status</p>
                        <StatusBadge {...getApprovalStatus(profile?.manager?.is_approved_by_admin)} />
                    </div>
                    
                    {/* Account Active Status */}
                    {/* <div className="bg-soft-background p-4 rounded-xl">
                        <p className="text-sm text-gray-700 mb-2">Account Status</p>
                        <StatusBadge {...getAccountStatus(profile?.manager?.is_active)} />
                    </div> */}

                    {/* Approved By/Date */}
                    {profile?.manager?.approved_at && profile?.manager?.is_approved_by_admin && (
                        <div className="bg-soft-background p-4 rounded-xl md:col-span-1">
                            <p className="text-sm text-gray-700 mb-2">Approval Details</p>
                            <p className="text-sm text-dark-text font-medium">
                                On: {new Date(profile.manager.approved_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </p>
                            {profile.manager.approved_by_admin_name && (
                                <p className="text-xs text-gray-700 mt-1">
                                    By: {profile.manager.approved_by_admin_name}
                                </p>
                            )}
                        </div>
                    )}
                  </div>
                </div>

                {/* === 2. STATISTICS CARD (Visual & Metric Focused) === */}
                {profile?.stats && (
                  <div className="bg-card-background p-6 rounded-2xl border border-light-gray-border shadow-soft">
                    <h2 className="text-xl font-semibold text-dark-text mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">monitoring</span> Performance Overview
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      
                      {/* Metric Item: Events Created (Primary) */}
                      <div className="p-3 border-b-2 border-primary/50">
                        <p className="text-3xl font-extrabold text-primary">{profile.stats.total_events_created || 0}</p>
                        <p className="text-sm text-gray-700 mt-1">Events Created</p>
                      </div>
                      
                      {/* Metric Item: Active Events (Success) */}
                      <div className="p-3 border-b-2 border-emerald-500/50">
                        <p className="text-3xl font-extrabold text-emerald-500">{profile.stats.active_events || 0}</p>
                        <p className="text-sm text-gray-700 mt-1">Active Events</p>
                      </div>
                      
                      {/* Metric Item: Registrations (Accent) */}
                      <div className="p-3 border-b-2 border-accent/50">
                        <p className="text-3xl font-extrabold text-accent">{profile.stats.total_registrations_across_events || 0}</p>
                        <p className="text-sm text-gray-700 mt-1">Total Registrations</p>
                      </div>
                      
                      {/* Metric Item: Volunteers (Info/Muted) */}
                      <div className="p-3 border-b-2 border-fuchsia-500/50">
                        <p className="text-3xl font-extrabold text-fuchsia-500">{profile.stats.total_volunteers_assigned || 0}</p>
                        <p className="text-sm text-gray-700 mt-1">Volunteers Assigned</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* === 3. PROFILE INFORMATION CARD (Editable) === */}
                <div className="bg-card-background p-6 rounded-2xl border border-light-gray-border shadow-soft">
                  <div className="flex items-center justify-between mb-6 border-b border-light-gray-border/50 pb-3">
                    <h2 className="text-xl font-semibold text-dark-text flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person</span> Personal Details
                    </h2>
                    {!editing && (
                      <button
                        onClick={() => setEditing(true)}
                        className="text-sm text-primary hover:underline font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                        Edit Profile
                      </button>
                    )}
                  </div>

                  {editing ? (
                    // --- EDITING MODE ---
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <StyledInput
                          label="Full Name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                      />

                      <StyledInput
                          label="Email (Cannot be changed)"
                          type="email"
                          value={profile?.manager?.email || ""}
                          disabled
                          helperText="Please contact the Super Admin to change your email address."
                      />

                      <StyledInput
                          label="Phone"
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                      />

                      <StyledInput
                          label="Organization"
                          name="organization"
                          value={formData.organization}
                          onChange={handleChange}
                      />

                      <StyledInput
                          label="New Password"
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          helperText="Leave this field empty to keep your current password."
                      />

                      <div className="flex gap-3 pt-6 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(false);
                            // Reset form data on cancel
                            setFormData({
                              full_name: profile?.manager?.full_name || "",
                              phone: profile?.manager?.phone || "",
                              organization: profile?.manager?.organization || "",
                              password: "",
                            });
                          }}
                          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition shadow-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updating}
                          className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed shadow-soft focus:ring-4 focus:ring-primary/20"
                        >
                          {updating ? (
                              <span className="flex items-center gap-2 justify-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                                  Updating...
                              </span>
                          ) : (
                              "Save Changes"
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    // --- VIEW MODE ---
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                          <InfoBlock label="Full Name" value={profile?.manager?.full_name} />
                          <InfoBlock label="Email" value={profile?.manager?.email} />
                          <InfoBlock label="Phone" value={profile?.manager?.phone} />
                          <InfoBlock label="Organization/Department" value={profile?.manager?.organization} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        <EventManagerMobileNav />
      </div>
    </div>
  );
}