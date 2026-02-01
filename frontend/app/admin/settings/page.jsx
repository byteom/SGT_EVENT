"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAuth";

export default function AdminSettingsPage() {
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [theme, setTheme] = useState("light");
  const [adminProfile, setAdminProfile] = useState({
    email: "",
    full_name: "",
    role: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const router = useRouter();

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      setAdminName(localStorage.getItem("admin_name") || "Admin");
      fetchProfile();
    }
  }, [isChecking, isAuthenticated]);

  /* THEME LOADING */
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

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/profile");
      if (res.data?.success) {
        const profile = res.data.data;
        setAdminProfile(profile);
        setFormData({
          email: profile.email || "",
          password: "",
          confirmPassword: ""
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setSaving(true);
      const updateData = {
        email: formData.email
      };
      
      if (formData.password) {
        updateData.password = formData.password;
      }

      const res = await api.put("/admin/profile", updateData);
      if (res.data?.success) {
        alert("Profile updated successfully");
        if (formData.email !== adminProfile.email) {
          localStorage.setItem("admin_name", res.data.data.full_name || formData.email.split("@")[0]);
        }
        fetchProfile();
        setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
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

  return (
    <div className="flex min-h-screen bg-soft-background">
      <AdminSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <AdminHeader
          theme={theme}
          toggleTheme={toggleTheme}
          adminName={adminProfile?.full_name || adminName}
          onLogout={handleLogout}
        />

        <main className="p-4 sm:p-6 md:ml-64 pt-16 sm:pt-20 pb-20 sm:pb-6 max-w-4xl">

          {loading ? (
            <LoadingBlock />
          ) : (
            <>
              {/* Profile Header Card */}
              <div className="bg-white rounded-2xl shadow-soft p-6 sm:p-8 mb-6">
                <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
                  <div className="w-20 h-20 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-primary text-3xl font-bold">
                    {adminProfile?.full_name?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-dark-text mb-1">
                      {adminProfile?.full_name || "Admin User"}
                    </h1>
                    <p className="text-gray-700 text-sm">{adminProfile?.role || "Administrator"}</p>
                  </div>
                </div>

                {/* Profile Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      <span className="material-symbols-outlined text-lg text-primary">person</span>
                      Full Name
                    </label>
                    <p className="text-base font-medium text-gray-700 pl-7">
                      {adminProfile?.full_name || "—"}
                    </p>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      <span className="material-symbols-outlined text-lg text-primary">mail</span>
                      Email Address
                    </label>
                    <p className="text-base font-medium text-gray-700 pl-7">
                      {adminProfile?.email || "—"}
                    </p>
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      <span className="material-symbols-outlined text-lg text-primary">admin_panel_settings</span>
                      Role
                    </label>
                    <p className="text-base font-medium text-gray-700 pl-7">
                      {adminProfile?.role || "ADMIN"}
                    </p>
                  </div>

                  {/* Account Type */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      <span className="material-symbols-outlined text-lg text-primary">verified_user</span>
                      Account Type
                    </label>
                    <p className="text-base font-medium text-gray-700 pl-7">
                      System Administrator
                    </p>
                  </div>

                </div>
              </div>

              {/* Account Information Card */}
              <div className="bg-white rounded-2xl shadow-soft p-6 sm:p-8">
                <h2 className="text-lg font-bold text-dark-text mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">info</span>
                  Account Information
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-lg text-primary mt-0.5">check_circle</span>
                    <span>Your account has full administrative privileges to manage the system.</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-lg text-primary mt-0.5">security</span>
                    <span>For security reasons, some profile fields cannot be modified directly.</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-lg text-primary mt-0.5">support</span>
                    <span>Contact system support if you need to update your profile information.</span>
                  </p>
                </div>
              </div>
            </>
          )}

        </main>
      </div>
      <AdminMobileNav />

    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex flex-col items-center mt-20">
      <div className="animate-spin h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent"></div>
      <p className="text-gray-700 mt-4">Loading profile...</p>
    </div>
  );
}
