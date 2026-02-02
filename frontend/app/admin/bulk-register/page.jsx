"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import api from "@/lib/api";
import { useAdminAuth } from "@/hooks/useAuth";

/**
 * Admin Bulk Registration Management Page
 * Manages bulk registrations with approval system
 */
export default function AdminBulkRegistrationPage() {
  const router = useRouter();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      fetchPendingRequests();
    }
  }, [isChecking, isAuthenticated]);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await api.get("/admin/bulk-registrations/pending", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        setPendingRequests(response.data.data || []);
      }
    } catch (error) {
      console.error("Fetch pending requests error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!confirm("Are you sure you want to approve this bulk registration request?")) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await api.post(`/admin/bulk-registrations/${requestId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        alert("Bulk registration approved successfully!");
        fetchPendingRequests();
      } else {
        alert(response.data?.message || "Failed to approve");
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert(error.response?.data?.message || "Failed to approve request");
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await api.post(`/admin/bulk-registrations/${requestId}/reject`, 
        { reason },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      if (response.data?.success) {
        alert("Bulk registration rejected!");
        fetchPendingRequests();
      } else {
        alert(response.data?.message || "Failed to reject");
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert(error.response?.data?.message || "Failed to reject request");
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
            <h1 className="text-2xl font-bold text-dark-text mb-2">Bulk Registration Approvals</h1>
            <p className="text-gray-700">Review and approve bulk registration requests (&gt;200 students)</p>
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
          ) : pendingRequests.length === 0 ? (
            <div className="bg-card-background rounded-xl border border-light-gray-border p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-gray-700 mb-4 block">pending_actions</span>
              <h3 className="text-lg font-medium text-dark-text mb-2">No Pending Requests</h3>
              <p className="text-gray-700">All bulk registration requests have been processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="bg-card-background rounded-xl border border-light-gray-border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-dark-text mb-1">{request.event_name}</h3>
                      <p className="text-sm text-gray-700">Requested by: {request.requested_by_name}</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                      Pending
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Students Count</label>
                      <p className="text-dark-text font-semibold">{request.student_count || 0}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Requested At</label>
                      <p className="text-dark-text text-sm">
                        {request.created_at ? new Date(request.created_at).toLocaleString() : "—"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">School</label>
                      <p className="text-dark-text text-sm">{request.school_name || "—"}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-light-gray-border">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-100 text-green-700 border border-green-200 rounded-lg hover:bg-green-200 transition"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 transition"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span>
                      Reject
                    </button>
                  </div>
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
