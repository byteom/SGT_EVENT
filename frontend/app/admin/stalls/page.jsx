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

export default function AllStallsPage() {
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [allStalls, setAllStalls] = useState([]);
  const [adminName, setAdminName] = useState("Admin");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStall, setSelectedStall] = useState(null);
  const [showDetailSidebar, setShowDetailSidebar] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [stallStats, setStallStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [schools, setSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [formData, setFormData] = useState({
    stall_name: "",
    stall_number: "",
    school_name: "",
    description: ""
  });

  async function load() {
    try {
      const res = await api.get("/stall");
      if (res.data?.success) {
        setAllStalls(res.data.data || []);
        // Extract unique school names
        const uniqueSchools = [...new Set(res.data.data.map(s => s.school_name).filter(Boolean))];
        setSchools(uniqueSchools.sort());
      }
    } catch (error) {
      console.error("API Error:", error);
      alert(error.response?.data?.message || "Failed to load stalls");
    }
  }

  // Download stalls data as Excel
  const handleDownloadExcel = () => {
    try {
      // Prepare data for Excel export
      const excelData = allStalls.map((stall, index) => ({
        'S.No': index + 1,
        'Stall UUID': stall.id || '',
        'Stall Number': stall.stall_number || '',
        'Display ID': `SGT-${String(stall.stall_number || '').padStart(3, '0')}`,
        'Stall Name': stall.stall_name || '',
        'School/Department': stall.school_name || '',
        'Description': stall.description || '',
        'Location': stall.location || '',
        'Total Feedback': stall.total_feedback_count || 0,
        'Rank 1 Votes': stall.rank_1_votes || 0,
        'Rank 2 Votes': stall.rank_2_votes || 0,
        'Rank 3 Votes': stall.rank_3_votes || 0,
        'Weighted Score': stall.weighted_score || 0,
        'Status': stall.is_active ? 'Active' : 'Inactive',
        'Created At': stall.created_at ? new Date(stall.created_at).toLocaleString() : '',
        'Updated At': stall.updated_at ? new Date(stall.updated_at).toLocaleString() : ''
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Stalls');

      // Set column widths for better readability
      worksheet['!cols'] = [
        { wch: 6 },  // S.No
        { wch: 12 }, // Stall ID
        { wch: 12 }, // Stall Number
        { wch: 25 }, // Stall Name
        { wch: 20 }, // School/Department
        { wch: 35 }, // Description
        { wch: 15 }, // Location
        { wch: 15 }, // Total Feedback
        { wch: 13 }, // Rank 1 Votes
        { wch: 13 }, // Rank 2 Votes
        { wch: 13 }, // Rank 3 Votes
        { wch: 15 }, // Weighted Score
        { wch: 10 }, // Status
        { wch: 18 }, // Created At
        { wch: 18 }  // Updated At
      ];

      // Generate file name with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const fileName = `SGTU_Stalls_${timestamp}.xlsx`;

      // Export to Excel
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, fileName);

      alert(`Excel file downloaded successfully! Total stalls: ${allStalls.length}`);
    } catch (error) {
      console.error('Excel download error:', error);
      alert('Failed to download Excel file. Please try again.');
    }
  };

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      const name = localStorage.getItem("admin_name") || "Admin";
      setAdminName(name);
      load();
    }
  }, [isChecking, isAuthenticated]);

  // Apply filters, search, and sort
  const processedStalls = useMemo(() => {
    let result = [...allStalls];
    
    // Apply search
    if (searchTerm) {
      result = filterData(result, searchTerm, ["stall_name", "stall_number", "school_name", "description"]);
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
  }, [allStalls, searchTerm, schoolFilter, sortField, sortDirection]);

  // Paginate
  const { paginatedData: stalls, totalPages, totalItems } = useMemo(() => 
    paginateData(processedStalls, currentPage, itemsPerPage),
    [processedStalls, currentPage, itemsPerPage]
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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/stall", formData);
      if (res.data?.success) {
        alert("Stall created successfully");
        setShowCreateModal(false);
        setFormData({ stall_name: "", stall_number: "", school_name: "", description: "" });
        load();
      }
    } catch (error) {
      console.error("Error creating stall:", error);
      alert(error.response?.data?.message || "Failed to create stall");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/stall/${selectedStall.id}`, {
        stall_name: formData.stall_name,
        description: formData.description
      });
      if (res.data?.success) {
        alert("Stall updated successfully");
        setShowEditModal(false);
        setSelectedStall(null);
        load();
      }
    } catch (error) {
      console.error("Error updating stall:", error);
      alert(error.response?.data?.message || "Failed to update stall");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this stall?")) return;
    
    try {
      const res = await api.delete(`/stall/${id}`);
      if (res.data?.success) {
        alert("Stall deleted successfully");
        load();
      }
    } catch (error) {
      console.error("Error deleting stall:", error);
      alert(error.response?.data?.message || "Failed to delete stall");
    }
  };

  const openEditModal = (stall) => {
    setSelectedStall(stall);
    setFormData({
      stall_name: stall.stall_name || "",
      stall_number: stall.stall_number || "",
      school_name: stall.school_name || "",
      description: stall.description || ""
    });
    setShowEditModal(true);
  };

  const handleStallClick = async (stall) => {
    setSelectedStall(stall);
    setShowDetailSidebar(true);
    setQrCodeImage(null);
    setStallStats(null);
    
    if (!stall.id) return;

    // Parallel fetch: QR + stats
    try {
      setLoadingQR(true);
      const res = await api.get(`/stall/${stall.id}/qr-code`);
      if (res.data?.success && res.data.data?.qr_code) {
        setQrCodeImage(res.data.data.qr_code);
      }
    } catch (error) {
      console.error("Error fetching QR code:", error);
    } finally {
      setLoadingQR(false);
    }

    // Stats feature removed due to backend compatibility issues
    setLoadingStats(false);
    setStallStats(null);
  };

  const handleDownloadQR = async () => {
    if (!qrCodeImage || !selectedStall) return;
    
    try {
      // Convert base64 to blob and download
      const link = document.createElement('a');
      link.href = qrCodeImage;
      link.download = `QR-${selectedStall.stall_number || selectedStall.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading QR code:", error);
      alert("Failed to download QR code");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_name");
    window.location.href = "/";
  };

  return (
    <div className="bg-soft-background min-h-screen">

      <AdminSidebar onLogout={handleLogout} />
        <AdminHeader adminName={adminName} onLogout={handleLogout} />

      <main className="md:ml-64 p-4 sm:p-6 pt-16 sm:pt-20 pb-20 sm:pb-6">

        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-semibold mb-1 text-dark-text">Stall List</h2>
          <p className="text-xs sm:text-sm text-gray-700">Manage and view all registered stalls for the event.</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 text-xl">search</span>
              <input
                type="text"
                placeholder="Search by name, number, school..."
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
              Showing {stalls.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} stalls
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleDownloadExcel}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-blue-100 text-primary border border-blue-200 rounded-lg hover:bg-blue-200 transition"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                Download Excel
              </button>
              <button 
                onClick={() => {
                  setFormData({ stall_name: "", stall_number: "", school_name: "", description: "" });
                  setShowCreateModal(true);
                }}
                className="px-4 py-2.5 bg-blue-100 text-primary border border-blue-200 rounded-lg hover:bg-blue-200 transition text-sm font-medium flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Add Stall
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-card-background rounded-xl border border-light-gray-border shadow-soft overflow-hidden">
          {/* TABLE HEADER */}
          <div className="grid grid-cols-4 bg-soft-background px-6 py-3 font-medium text-gray-700 text-xs uppercase tracking-wider">
            <button onClick={() => handleSort("stall_number")} className="flex items-center gap-2 hover:text-primary transition text-left">
              <input type="checkbox" className="rounded" />
              <span>Stall ID</span>
              <span className={`material-symbols-outlined text-sm ${sortField === "stall_number" ? "text-primary" : ""}`}>
                {getSortIcon("stall_number")}
              </span>
            </button>
            <button onClick={() => handleSort("stall_name")} className="flex items-center gap-1 hover:text-primary transition text-left">
              <span>Name</span>
              <span className={`material-symbols-outlined text-sm ${sortField === "stall_name" ? "text-primary" : ""}`}>
                {getSortIcon("stall_name")}
              </span>
            </button>
            <button onClick={() => handleSort("school_name")} className="flex items-center gap-1 hover:text-primary transition text-left">
              <span>Department</span>
              <span className={`material-symbols-outlined text-sm ${sortField === "school_name" ? "text-primary" : ""}`}>
                {getSortIcon("school_name")}
              </span>
            </button>
            <button onClick={() => handleSort("total_feedback_count")} className="flex items-center gap-1 hover:text-primary transition text-left">
              <span>Feedback</span>
              <span className={`material-symbols-outlined text-sm ${sortField === "total_feedback_count" ? "text-primary" : ""}`}>
                {getSortIcon("total_feedback_count")}
              </span>
            </button>
          </div>

          {/* DATA ROWS */}
          {stalls.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-700">
              No stalls found
            </div>
          ) : (
            stalls.map((s, i) => (
            <div
              key={s.id}
                onClick={() => handleStallClick(s)}
                className={`grid grid-cols-4 px-6 py-4 text-sm items-center border-b border-light-gray-border
                hover:bg-gray-50 transition cursor-pointer ${
                  selectedStall?.id === s.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="font-medium text-dark-text">SGT-{String(s.stall_number || i + 1).padStart(3, '0')}</span>
                </div>
                <div className="font-medium text-dark-text">{s.stall_name}</div>
                <div className="text-gray-700">{s.school_name || "—"}</div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">{s.total_feedback_count || 0}</span>
                  <div className="flex gap-1 ml-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(s);
                      }}
                      className="text-gray-700 hover:text-primary p-1"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(s.id);
                      }}
                      className="text-gray-700 hover:text-red-600 p-1"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {stalls.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-700">
              No stalls found
            </div>
          ) : (
            stalls.map((s, i) => (
              <div
                key={s.id}
                onClick={() => handleStallClick(s)}
                className={`bg-card-background rounded-xl border border-light-gray-border shadow-soft p-4 cursor-pointer transition ${
                  selectedStall?.id === s.id ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-2xl">store</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-dark-text text-base mb-1">
                      SGT-{String(s.stall_number || i + 1).padStart(3, '0')} - {s.stall_name}
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">
                      {s.school_name || "Department"}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base text-gray-700">chat_bubble</span>
                        <span className="text-sm text-gray-700">{s.feedback_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base text-yellow-500">star</span>
                        <span className="text-sm text-gray-700">4.5</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="p-2 text-gray-700 hover:text-primary hover:bg-gray-100 rounded-lg transition">
                      <span className="material-symbols-outlined text-xl">qr_code</span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(s);
                      }}
                      className="p-2 text-gray-700 hover:text-primary hover:bg-gray-100 rounded-lg transition"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(s.id);
                      }}
                      className="p-2 text-gray-700 hover:text-red-600 hover:bg-gray-100 rounded-lg transition"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <Modal
            title="Create New Stall"
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreate}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Stall Name *
                </label>
                <input
                  type="text"
                  value={formData.stall_name}
                  onChange={(e) => setFormData({ ...formData, stall_name: e.target.value })}
                  className="w-full px-4 py-2 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-dark-text bg-card-background"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Stall Number *
                </label>
                <input
                  type="text"
                  value={formData.stall_number}
                  onChange={(e) => setFormData({ ...formData, stall_number: e.target.value })}
                  className="w-full px-4 py-2 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-dark-text bg-card-background"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  School/Department *
                </label>
                <input
                  type="text"
                  value={formData.school_name}
                  onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                  list="schools-list"
                  className="w-full px-4 py-2 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-dark-text bg-card-background"
                  required
                />
                <datalist id="schools-list">
                  {schools.map((school, i) => (
                    <option key={i} value={school} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-dark-text bg-card-background"
                />
              </div>
            </div>
          </Modal>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedStall && (
          <Modal
            title="Edit Stall"
            onClose={() => {
              setShowEditModal(false);
              setSelectedStall(null);
            }}
            onSubmit={handleUpdate}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Stall Name *
                </label>
                <input
                  type="text"
                  value={formData.stall_name}
                  onChange={(e) => setFormData({ ...formData, stall_name: e.target.value })}
                  className="w-full px-4 py-2 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-dark-text bg-card-background"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Stall Number
                </label>
                <input
                  type="text"
                  value={formData.stall_number}
                  disabled
                  className="w-full px-4 py-2 border border-light-gray-border rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
                <p className="text-xs text-gray-700 mt-1">Stall number cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  School/Department
                </label>
                <input
                  type="text"
                  value={formData.school_name}
                  disabled
                  className="w-full px-4 py-2 border border-light-gray-border rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
                <p className="text-xs text-gray-700 mt-1">School cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-dark-text bg-card-background"
                />
              </div>
            </div>
          </Modal>
        )}

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

        {/* Stall Detail Sidebar */}
        {showDetailSidebar && selectedStall && (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
            <div className="w-full max-w-md bg-card-background h-full overflow-y-auto shadow-soft">
              <div className="sticky top-0 bg-card-background border-b border-light-gray-border p-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-dark-text">Stall Details</h2>
                <button
                  onClick={() => {
                    setShowDetailSidebar(false);
                    setSelectedStall(null);
                    setQrCodeImage(null);
                    setStallStats(null);
                  }}
                  className="text-gray-700 hover:text-gray-700"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Stall Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Stall Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-text mb-2">Stall UUID (Database ID)</label>
                      <input
                        type="text"
                        value={selectedStall.id || ""}
                        disabled
                        className="w-full px-4 py-2 border border-light-gray-border rounded-lg bg-soft-background text-gray-700 cursor-not-allowed font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-text mb-2">Display ID</label>
                      <input
                        type="text"
                        value={`SGT-${String(selectedStall.stall_number || "").padStart(3, '0')}`}
                        disabled
                        className="w-full px-4 py-2 border border-light-gray-border rounded-lg bg-soft-background text-gray-700 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-text mb-2">Stall Name</label>
                      <input
                        type="text"
                        value={selectedStall.stall_name || ""}
                        disabled
                        className="w-full px-4 py-2 border border-light-gray-border rounded-lg bg-soft-background text-dark-text cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-text mb-2">Department</label>
                      <input
                        type="text"
                        value={selectedStall.school_name || ""}
                        disabled
                        className="w-full px-4 py-2 border border-light-gray-border rounded-lg bg-soft-background text-dark-text cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-text mb-2">Description</label>
                      <textarea
                        value={selectedStall.description || "No description available"}
                        disabled
                        rows={3}
                        className="w-full px-4 py-2 border border-light-gray-border rounded-lg bg-soft-background text-dark-text cursor-not-allowed resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">QR Code</h3>
                  <div className="flex items-start gap-4">
                    <div className="w-32 h-32 bg-card-background p-2 rounded-lg border border-light-gray-border flex items-center justify-center">
                      {loadingQR ? (
                        <div className="animate-pulse text-gray-700">Loading...</div>
                      ) : qrCodeImage ? (
                        <img src={qrCodeImage} alt="QR Code" className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-gray-700 text-center text-xs">
                          <span className="material-symbols-outlined text-4xl mb-2 block">qr_code</span>
                          QR Code not available
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 mb-2">
                        Scan to provide feedback
                      </p>
                      <p className="text-xs text-gray-700 mb-4">
                        Unique QR code for '{selectedStall.stall_name}' stall.
                      </p>
                      {qrCodeImage && (
                        <button
                          onClick={handleDownloadQR}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm font-medium flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-lg">download</span>
                          Download PNG
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Feedback Analytics */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Feedback Analytics</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-soft-background rounded-lg p-4 border border-light-gray-border">
                      <div className="text-sm text-gray-700 mb-1">Total Feedback Received</div>
                      <div className="text-2xl font-bold text-dark-text">
                        {selectedStall.total_feedback_count ?? selectedStall.feedback_count ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
      <AdminMobileNav />
    </div>
  );
}

function Modal({ title, onClose, onSubmit, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-dark-text">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-gray-700"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        <form onSubmit={onSubmit}>
          {children}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-blue-100 text-primary border border-blue-200 rounded-lg hover:bg-blue-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-100 text-primary border border-blue-200 rounded-lg hover:bg-blue-200 transition"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

