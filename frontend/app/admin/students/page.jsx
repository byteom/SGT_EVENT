"use client";

import { useEffect, useState, useMemo } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import api from "@/lib/api";
import { filterData, filterByField, sortData, paginateData, getUniqueValues } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/useAuth";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import BulkUploadModal from "@/components/admin/BulkUploadModal";

export default function AdminStudentsPage() {
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

  async function fetchStudents() {
    setLoading(true);
    try {
      // Fetch all students with a high limit
      const token = localStorage.getItem("admin_token");
      const res = await api.get(`/admin/students?limit=10000&offset=0`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) setAllStudents(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }

  // Download students data as Excel
  const handleDownloadExcel = () => {
    try {
      const excelData = allStudents.map((student, index) => ({
        'S.No': index + 1,
        'Student ID': student.id || '',
        'Registration No': student.registration_no || '',
        'Full Name': student.full_name || '',
        'Email': student.email || '',
        'School/Department': student.school_name || '',
        'Total Scans': student.total_scans || 0,
        'Inside Event': student.is_inside_event ? 'Yes' : 'No',
        'Checked In At': student.checked_in_at ? new Date(student.checked_in_at).toLocaleString() : '',
        'Created At': student.created_at ? new Date(student.created_at).toLocaleString() : ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

      worksheet['!cols'] = [
        { wch: 6 },  // S.No
        { wch: 12 }, // Student ID
        { wch: 18 }, // Registration No
        { wch: 25 }, // Full Name
        { wch: 30 }, // Email
        { wch: 20 }, // School/Department
        { wch: 12 }, // Total Scans
        { wch: 12 }, // Inside Event
        { wch: 18 }, // Checked In At
        { wch: 18 }  // Created At
      ];

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const fileName = `SGTU_Students_${timestamp}.xlsx`;

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, fileName);

      alert(`Excel file downloaded successfully! Total students: ${allStudents.length}`);
    } catch (error) {
      console.error('Excel download error:', error);
      alert('Failed to download Excel file. Please try again.');
    }
  };

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      fetchStudents();
    }
  }, [isChecking, isAuthenticated]);

  // Get unique schools for filter
  const schools = useMemo(() => getUniqueValues(allStudents, "school_name"), [allStudents]);

  // Apply filters, search, and sort
  const processedStudents = useMemo(() => {
    let result = [...allStudents];
    
    // Apply search
    if (searchTerm) {
      result = filterData(result, searchTerm, ["full_name", "email", "registration_no", "school_name"]);
    }
    
    // Apply school filter
    if (schoolFilter !== "all") {
      result = filterByField(result, "school_name", schoolFilter);
    }
    
    // Apply sort
    if (sortField) {
      result = sortData(result, sortField, sortDirection);
    }
    
    return result;
  }, [allStudents, searchTerm, schoolFilter, sortField, sortDirection]);

  // Paginate
  const { paginatedData: students, totalPages, totalItems } = useMemo(() => 
    paginateData(processedStudents, currentPage, itemsPerPage),
    [processedStudents, currentPage, itemsPerPage]
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

  const handleLogout = async () => {
    try {
      await api.post("/admin/logout");
    } catch(e){}
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_name");
    window.location.href = "/";
  };

  const openStudentDetail = (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  return (
    <div className="flex min-h-screen bg-soft-background">
      <AdminSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <AdminHeader adminName={localStorage.getItem("admin_name") || "Admin"} onLogout={handleLogout} />

        <main className="p-4 sm:p-6 md:ml-64 pt-16 sm:pt-20 pb-20 sm:pb-6">

          {/* Search and Filter Bar */} 
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 text-xl">search</span>
                <input
                  type="text"
                  placeholder="Search by name, email, enrollment..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-card-background text-dark-text"
                />
              </div>
              <select
                value={schoolFilter}
                onChange={(e) => {
                  setSchoolFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2.5 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-card-background text-dark-text"
              >
                <option value="all">All Schools</option>
                {schools.map((school) => (
                  <option key={school} value={school}>{school}</option>
                ))}
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
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {students.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} students
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowBulkUploadModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                  <span className="material-symbols-outlined text-lg">upload</span>
                  <span className="hidden sm:inline">Bulk Upload</span>
                  <span className="sm:hidden">Upload</span>
                </button>
                <button 
                  onClick={handleDownloadExcel}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-blue-100 text-primary border border-blue-200 rounded-lg hover:bg-blue-200 transition"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                  <span className="hidden sm:inline">Download Excel</span>
                  <span className="sm:hidden">Download</span>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-card-background rounded-xl border border-light-gray-border shadow-soft overflow-hidden">

            {/* TABLE HEADER */}
            <div className="grid grid-cols-[2fr_2fr_2fr_2fr_1.5fr_1.5fr_1.5fr_0.5fr] bg-gray-50 px-6 py-3 font-medium text-gray-700 text-xs uppercase tracking-wider gap-4">
              <button onClick={() => handleSort("full_name")} className="flex items-center gap-1 hover:text-primary transition text-left">
                <span>Name</span>
                <span className={`material-symbols-outlined text-sm ${sortField === "full_name" ? "text-primary" : ""}`}>
                  {getSortIcon("full_name")}
                </span>
              </button>
              <button onClick={() => handleSort("email")} className="flex items-center gap-1 hover:text-primary transition text-left">
                <span>Email</span>
                <span className={`material-symbols-outlined text-sm ${sortField === "email" ? "text-primary" : ""}`}>
                  {getSortIcon("email")}
                </span>
              </button>
              <button onClick={() => handleSort("registration_no")} className="flex items-center gap-1 hover:text-primary transition text-left">
                <span>Enrollment</span>
                <span className={`material-symbols-outlined text-sm ${sortField === "registration_no" ? "text-primary" : ""}`}>
                  {getSortIcon("registration_no")}
                </span>
              </button>
              <button onClick={() => handleSort("school_name")} className="flex items-center gap-1 hover:text-primary transition text-left">
                <span>Department</span>
                <span className={`material-symbols-outlined text-sm ${sortField === "school_name" ? "text-primary" : ""}`}>
                  {getSortIcon("school_name")}
                </span>
              </button>
              <button onClick={() => handleSort("created_at")} className="flex items-center gap-1 hover:text-primary transition text-left">
                <span>Created At</span>
                <span className={`material-symbols-outlined text-sm ${sortField === "created_at" ? "text-primary" : ""}`}>
                  {getSortIcon("created_at")}
                </span>
              </button>
              <button onClick={() => handleSort("feedback_count")} className="flex items-center gap-1 hover:text-primary transition text-left">
                <span>Feedbacks</span>
                <span className={`material-symbols-outlined text-sm ${sortField === "feedback_count" ? "text-primary" : ""}`}>
                  {getSortIcon("feedback_count")}
                </span>
              </button>
              <button onClick={() => handleSort("total_active_duration_minutes")} className="flex items-center gap-1 hover:text-primary transition text-left">
                <span>Time Spent</span>
                <span className={`material-symbols-outlined text-sm ${sortField === "total_active_duration_minutes" ? "text-primary" : ""}`}>
                  {getSortIcon("total_active_duration_minutes")}
                </span>
              </button>
              <div></div>
            </div>

    {/* DATA ROWS */}
    {loading ? (
      <div className="px-6 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    ) : students.length === 0 ? (
      <div className="px-6 py-12 text-center text-gray-700">
        {searchTerm || schoolFilter !== "all" ? "No students match your filters" : "No students found"}
      </div>
    ) : (
      students.map((s, i) => (
      <div
        key={s.id}
        onClick={() => openStudentDetail(s)}
        className={`grid grid-cols-[2fr_2fr_2fr_2fr_1.5fr_1.5fr_1.5fr_0.5fr] px-6 py-4 text-sm items-center border-b border-gray-100
        hover:bg-gray-50 transition gap-4 cursor-pointer`}
      >
        {/* NAME */}
        <div className="font-medium text-dark-text truncate">
          {s.full_name}
        </div>

        {/* EMAIL */}
        <div className="text-gray-700 text-sm truncate">
          {s.email || "—"}
        </div>

        {/* ENROLLMENT */}
        <div className="text-gray-700 truncate">
          {s.registration_no}
        </div>

        {/* DEPARTMENT */}
        <div className="text-gray-700 truncate">
          {s.school_name || "—"}
        </div>

        {/* CREATED AT */}
        <div className="text-gray-700 text-xs">
          {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
        </div>

        {/* FEEDBACKS */}
        <div className="text-gray-700">
          {s.feedback_count || 0} feedbacks
        </div>

        {/* TIME SPENT */}
        <div className="text-gray-700">
          {s.total_active_duration_minutes ? `${Math.floor(s.total_active_duration_minutes / 60)}h ${String(s.total_active_duration_minutes % 60).padStart(2, '0')}m` : "—"}
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end">
          <button className="text-gray-700 hover:text-gray-700 p-1">
            <span className="material-symbols-outlined text-lg">more_vert</span>
          </button>
        </div>
      </div>
      ))
    )}

          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card-background rounded-xl border border-light-gray-border shadow-soft p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-700">
                No students found
              </div>
            ) : (
              students.map((s) => (
                <div
                  key={s.id}
                  onClick={() => openStudentDetail(s)}
                  className="bg-card-background rounded-xl border border-light-gray-border shadow-soft p-4 cursor-pointer hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-dark-text text-base mb-1">
                        {s.full_name}
                      </h3>
                      <p className="text-sm text-gray-700 mb-1">{s.email || "—"}</p>
                      <p className="text-xs text-gray-700">Enrollment: {s.registration_no}</p>
                    </div>
                    <button className="text-gray-700 hover:text-gray-700 p-1">
                      <span className="material-symbols-outlined text-xl">more_vert</span>
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-light-gray-border flex items-center gap-4 text-xs">
                    <div className="text-gray-700">
                      <span className="font-medium">{s.school_name || "—"}</span>
                    </div>
                    <div className="text-gray-700">
                      {s.feedback_count || 0} feedbacks
                    </div>
                    <div className="text-gray-700">
                      {s.total_active_duration_minutes ? `${Math.floor(s.total_active_duration_minutes / 60)}h ${String(s.total_active_duration_minutes % 60).padStart(2, '0')}m` : "—"}
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
                className="px-4 py-2 bg-blue-100 text-primary border border-blue-200 rounded-lg hover:bg-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
                          ? "bg-blue-100 text-primary border border-blue-200"
                          : "border border-light-gray-border hover:bg-blue-50 text-dark-text"
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
                className="px-4 py-2 bg-blue-100 text-primary border border-blue-200 rounded-lg hover:bg-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          )}

        </main>

      </div>
      <AdminMobileNav />

      {/* Student Detail Modal */}
      {showDetailModal && selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedStudent(null);
          }}
        />
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <BulkUploadModal
          onClose={() => setShowBulkUploadModal(false)}
          onSuccess={() => {
            setShowBulkUploadModal(false);
            fetchStudents();
          }}
        />
      )}
    </div>
  );
}

function StudentDetailModal({ student, onClose }) {
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "—";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${String(mins).padStart(2, '0')}m`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-light-gray-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">school</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-dark-text">{student.full_name}</h2>
              <p className="text-sm text-gray-700">{student.registration_no}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-gray-700"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="bg-soft-background rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoCard label="Student ID" value={student.id} mono />
              <InfoCard label="Registration No" value={student.registration_no} />
              <InfoCard label="Full Name" value={student.full_name} />
              <InfoCard label="Email" value={student.email} />
              <InfoCard label="Phone" value={student.phone} />
              <InfoCard label="Date of Birth" value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : null} />
            </div>
          </div>

          {/* Academic Info */}
          <div className="bg-soft-background rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Academic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <InfoCard label="School/Department" value={student.school_name} />
              <InfoCard label="Program" value={student.program_name} />
              <InfoCard label="Batch" value={student.batch} />
            </div>
          </div>

          {/* Address Info */}
          {(student.address || student.pincode) && (
            <div className="bg-soft-background rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoCard label="Address" value={student.address} />
                <InfoCard label="Pincode" value={student.pincode} />
              </div>
            </div>
          )}

          {/* Event Activity */}
          <div className="bg-soft-background rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Event Activity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-light-gray-border">
                <label className="block text-xs font-medium text-gray-700 mb-2">Current Status</label>
                {student.is_inside_event ? (
                  <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                    Inside Event
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 font-medium">
                    Outside Event
                  </span>
                )}
              </div>
              <InfoCard label="Total Scans" value={student.total_scan_count || 0} />
              <InfoCard label="Feedbacks Given" value={student.feedback_count || 0} />
              <InfoCard label="Time Spent" value={formatDuration(student.total_active_duration_minutes)} />
              <InfoCard label="Last Check-in" value={formatDate(student.last_checkin_at)} />
              <InfoCard label="Last Check-out" value={formatDate(student.last_checkout_at)} />
            </div>
          </div>

          {/* Ranking Info */}
          <div className="bg-soft-background rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Ranking Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-light-gray-border">
                <label className="block text-xs font-medium text-gray-700 mb-2">Completed Ranking</label>
                {student.has_completed_ranking ? (
                  <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                    Yes
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium">
                    No
                  </span>
                )}
              </div>
              <InfoCard label="Selected Category" value={student.selected_category} />
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-soft-background rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Account Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoCard label="Created At" value={formatDate(student.created_at)} />
              <InfoCard label="Updated At" value={formatDate(student.updated_at)} />
              <div className="bg-white rounded-lg p-3 border border-light-gray-border">
                <label className="block text-xs font-medium text-gray-700 mb-2">Password Reset Required</label>
                {student.password_reset_required ? (
                  <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">
                    Yes
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                    No
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-light-gray-border">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-light-gray-border rounded-lg hover:bg-gray-50 transition text-dark-text"
          >
            Close
          </button>
        </div>
      </div>
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

function DetailRow({ label, value, mono }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <p className={`text-dark-text ${mono ? 'font-mono text-xs' : 'text-sm'}`}>
        {value || "—"}
      </p>
    </div>
  );
}
