"use client";

import { useEffect, useState, useMemo } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { filterData, filterByField, sortData, paginateData } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/useAuth";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function AdminScansPage() {
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [allScans, setAllScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortField, setSortField] = useState("scanned_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const router = useRouter();

  const [fetchError, setFetchError] = useState(null);

  const fetchScans = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await api.get("/check-in-out");
      if (res.data?.success) {
        setAllScans(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching scans:", error);
      const errorMsg = error.response?.data?.message || 
                       (error.response?.status === 500 ? "Server error. Please try again later." : 
                        "Failed to load scan records");
      setFetchError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Download scans data as Excel
  const handleDownloadExcel = () => {
    try {
      const excelData = allScans.map((scan, index) => ({
        'S.No': index + 1,
        'Scan ID': scan.id || '',
        'Student Name': scan.student_name || '',
        'Registration No': scan.registration_no || scan.student_registration_no || '',
        'Volunteer Name': scan.volunteer_name || '',
        'Scan Type': scan.scan_type || '',
        'Scan Number': scan.scan_number || '',
        'Scanned At': scan.scanned_at ? new Date(scan.scanned_at).toLocaleString() : '',
        'Duration (Minutes)': scan.duration_minutes || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Log');

      worksheet['!cols'] = [
        { wch: 6 },  // S.No
        { wch: 12 }, // Scan ID
        { wch: 25 }, // Student Name
        { wch: 18 }, // Registration No
        { wch: 20 }, // Volunteer Name
        { wch: 12 }, // Scan Type
        { wch: 12 }, // Scan Number
        { wch: 20 }, // Scanned At
        { wch: 18 }  // Duration
      ];

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const fileName = `SGTU_Attendance_Log_${timestamp}.xlsx`;

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, fileName);

      alert(`Excel file downloaded successfully! Total records: ${allScans.length}`);
    } catch (error) {
      console.error('Excel download error:', error);
      alert('Failed to download Excel file. Please try again.');
    }
  };

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      setAdminName(localStorage.getItem("admin_name") || "Admin");
      fetchScans();
    }
  }, [isChecking, isAuthenticated]);

  // Apply filters, search, and sort
  const processedScans = useMemo(() => {
    let result = [...allScans];
    
    // Apply search
    if (searchTerm) {
      result = filterData(result, searchTerm, ["student_name", "student_registration_no", "volunteer_name", "stall_name"]);
    }
    
    // Apply type filter
    if (typeFilter !== "all") {
      result = result.filter(scan => {
        if (typeFilter === "checkin") return !scan.check_out_time;
        if (typeFilter === "checkout") return scan.check_out_time;
        return true;
      });
    }
    
    // Apply sort
    if (sortField) {
      result = sortData(result, sortField, sortDirection);
    }
    
    return result;
  }, [allScans, searchTerm, typeFilter, sortField, sortDirection]);

  // Paginate
  const { paginatedData: scans, totalPages, totalItems } = useMemo(() => 
    paginateData(processedScans, currentPage, itemsPerPage),
    [processedScans, currentPage, itemsPerPage]
  );

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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return "unfold_more";
    return sortDirection === "asc" ? "arrow_upward" : "arrow_downward";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this scan record?")) return;
    
    try {
      const res = await api.delete(`/check-in-out/${id}`);
      if (res.data?.success) {
        alert("Scan record deleted successfully");
        fetchScans();
      }
    } catch (error) {
      console.error("Error deleting scan:", error);
      alert(error.response?.data?.message || "Failed to delete scan record");
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
        <AdminHeader adminName={adminName} onLogout={handleLogout} />
        
        <main className="p-4 sm:p-6 md:ml-64 pt-16 sm:pt-20 pb-20 sm:pb-6">
          <div className="mb-4 sm:mb-6 flex items-center gap-2 w-full sm:w-auto justify-end">
            <button 
              onClick={handleDownloadExcel}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-sm border border-light-gray-border rounded-lg hover:bg-gray-50 transition"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              <span className="hidden sm:inline">Download Excel</span>
              <span className="sm:hidden">Download</span>
            </button>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 text-xl">search</span>
                <input
                  type="text"
                  placeholder="Search by student name, enrollment, volunteer..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-card-background text-dark-text"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2.5 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-card-background text-dark-text"
              >
                <option value="all">All Types</option>
                <option value="checkin">Check-In Only</option>
                <option value="checkout">Check-Out Only</option>
              </select>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-4 py-2.5 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-card-background text-dark-text"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
            <div className="text-sm text-gray-700">
              Showing {scans.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} records
            </div>
          </div>

          {/* Desktop Table View */}
          {fetchError ? (
            <div className="hidden md:block bg-card-background shadow-soft border border-light-gray-border rounded-xl p-6">
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-5xl text-red-400 mb-4">error</span>
                <p className="text-red-600 mb-4">{fetchError}</p>
                <button
                  onClick={fetchScans}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="hidden md:block bg-card-background shadow-soft border border-light-gray-border rounded-xl p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="hidden md:block bg-card-background shadow-soft border border-light-gray-border rounded-xl overflow-hidden">
              {/* TABLE HEADER */}
              <div className="grid grid-cols-9 bg-gray-50 px-6 py-3 font-medium text-gray-700 text-xs uppercase tracking-wider">
                <button onClick={() => handleSort("scanned_at")} className="flex items-center gap-1 hover:text-primary transition text-left">
                  <span>Timestamp</span>
                  <span className={`material-symbols-outlined text-sm ${sortField === "scanned_at" ? "text-primary" : ""}`}>
                    {getSortIcon("scanned_at")}
                  </span>
                </button>
                <button onClick={() => handleSort("student_name")} className="flex items-center gap-1 hover:text-primary transition text-left">
                  <span>Student Name</span>
                  <span className={`material-symbols-outlined text-sm ${sortField === "student_name" ? "text-primary" : ""}`}>
                    {getSortIcon("student_name")}
                  </span>
                </button>
                <button onClick={() => handleSort("student_registration_no")} className="flex items-center gap-1 hover:text-primary transition text-left">
                  <span>Enrollment</span>
                  <span className={`material-symbols-outlined text-sm ${sortField === "student_registration_no" ? "text-primary" : ""}`}>
                    {getSortIcon("student_registration_no")}
                  </span>
                </button>
                <button onClick={() => handleSort("volunteer_name")} className="flex items-center gap-1 hover:text-primary transition text-left">
                  <span>Volunteer Name</span>
                  <span className={`material-symbols-outlined text-sm ${sortField === "volunteer_name" ? "text-primary" : ""}`}>
                    {getSortIcon("volunteer_name")}
                  </span>
                </button>
                <div className="flex items-center gap-1">
                  <span>Action</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Gate</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Device ID</span>
                </div>
                <div></div>
                <div></div>
              </div>

              {/* DATA ROWS */}
              {scans.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-700">
                  No scan records found
                </div>
              ) : (
                scans.map((scan, i) => (
                  <div
                    key={scan.id}
                    className={`grid grid-cols-9 px-6 py-4 text-sm items-center border-b border-gray-100 hover:bg-gray-50 transition`}
                  >
                    <div className="text-gray-700 text-xs">
                      {formatDate(scan.check_in_time || scan.check_out_time)}
                    </div>
                    <div className="font-medium text-dark-text">
                      {scan.student_name || "Unknown"}
                    </div>
                    <div className="text-gray-700">
                      {scan.student_registration_no || "—"}
                    </div>
                    <div className="text-gray-700">
                      {scan.volunteer_name || "—"}
                    </div>
                    <div>
                      {scan.check_out_time ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium">
                          Check-Out
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                          Check-In
                        </span>
                      )}
                    </div>
                    <div className="text-gray-700">
                      Gate {scan.gate || "1"}
                    </div>
                    <div className="text-gray-700 text-xs font-mono">
                      {scan.device_id || "DEV-A1B2C3"}
                    </div>
                    <div className="flex justify-center">
                      <button 
                        onClick={() => handleDelete(scan.id)}
                        className="text-gray-700 hover:text-red-600 p-1"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                    <div></div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {fetchError ? (
              <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft p-6">
                <div className="text-center py-4">
                  <span className="material-symbols-outlined text-4xl text-red-400 mb-3">error</span>
                  <p className="text-red-600 mb-4 text-sm">{fetchError}</p>
                  <button
                    onClick={fetchScans}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card-background rounded-xl border border-light-gray-border shadow-soft p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : scans.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-700">
                {searchTerm || typeFilter !== "all" ? "No records match your filters" : "No scan records found"}
              </div>
            ) : (
              scans.map((scan) => (
                <div
                  key={scan.id}
                  className="bg-card-background rounded-xl border border-light-gray-border shadow-soft p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-dark-text text-base mb-1">
                        {scan.student_name || "Unknown"}
                      </h3>
                      <div className="mb-2">
                        {scan.check_out_time ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium">
                            Check-Out
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                            Check-In
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(scan.id)}
                      className="text-gray-700 hover:text-red-600 p-1"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">Enrollment:</span>
                      <span className="text-dark-text">{scan.student_registration_no || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">{formatDate(scan.check_in_time || scan.check_out_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">Volunteer:</span>
                      <span className="text-dark-text">{scan.volunteer_name || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">Gate</span>
                      <span className="text-dark-text">{scan.gate || "1"}</span>
                      <span className="text-gray-700">•</span>
                      <span className="text-gray-700">Device:</span>
                      <span className="text-dark-text font-mono text-xs">{scan.device_id || "DEV-A1B2C3"}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-light-gray-border rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm text-dark-text"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded text-sm ${
                        currentPage === pageNum
                          ? "bg-primary text-white"
                          : "border border-light-gray-border hover:bg-gray-50 text-dark-text"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-light-gray-border rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm text-dark-text"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
      <AdminMobileNav />
    </div>
  );
}
