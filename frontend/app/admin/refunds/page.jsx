"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import api from "@/lib/api";
import { useAdminAuth } from "@/hooks/useAuth";

/**
 * Admin Refunds Management Page
 * View and manage all refunds across the platform
 */
export default function AdminRefundsPage() {
  const router = useRouter();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [refunds, setRefunds] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      fetchRefunds();
    }
  }, [isChecking, isAuthenticated, currentPage]);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await api.get(`/admin/refunds?page=${currentPage}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        setRefunds(response.data.data || []);
        setSummary(response.data.summary);
        setTotalPages(response.data.pagination?.total_pages || 1);
      }
    } catch (error) {
      console.error("Fetch refunds error:", error);
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-dark-text mb-2">Refunds Management</h1>
            <p className="text-gray-700">Platform-wide refund history and tracking</p>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-card-background rounded-xl border border-light-gray-border p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">receipt_long</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">Total Refunds</p>
                    <p className="text-2xl font-bold text-dark-text">{summary.total_refunds || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card-background rounded-xl border border-light-gray-border p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600 text-2xl">payments</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">Total Refunded</p>
                    <p className="text-2xl font-bold text-dark-text">₹{summary.total_refunded || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card-background rounded-xl border border-light-gray-border p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 text-2xl">average_pace</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">Avg Refund</p>
                    <p className="text-2xl font-bold text-dark-text">₹{summary.average_refund || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Refunds List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card-background rounded-xl border border-light-gray-border p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : refunds.length === 0 ? (
            <div className="bg-card-background rounded-xl border border-light-gray-border p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-gray-700 mb-4 block">money_off</span>
              <h3 className="text-lg font-medium text-dark-text mb-2">No Refunds Found</h3>
              <p className="text-gray-700">No refund transactions have been processed yet</p>
            </div>
          ) : (
            <>
              <div className="bg-card-background rounded-xl border border-light-gray-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-light-gray-border">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {refunds.map((refund) => (
                        <tr key={refund.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-dark-text">{refund.student_name}</p>
                              <p className="text-xs text-gray-700">{refund.registration_no}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{refund.event_name || "—"}</td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-green-600">₹{refund.refund_amount}</p>
                            <p className="text-xs text-gray-700">{refund.refund_percentage}%</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{refund.cancellation_reason || "—"}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {refund.refund_date ? new Date(refund.refund_date).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              refund.refund_status === 'completed' ? 'bg-green-100 text-green-700' :
                              refund.refund_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {refund.refund_status || "Unknown"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-blue-100 text-primary border border-blue-200 rounded-lg hover:bg-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-blue-100 text-primary border border-blue-200 rounded-lg hover:bg-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      <AdminMobileNav />
    </div>
  );
}
