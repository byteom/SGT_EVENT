"use client";

import { useEffect, useState, useMemo } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { filterData, filterByField, sortData, paginateData, getUniqueValues } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/useAuth";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function AdminVolunteersPage() {
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [allVolunteers, setAllVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [showDetailSidebar, setShowDetailSidebar] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const router = useRouter();

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/volunteers");
      if (res.data?.success) {
        setAllVolunteers(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching volunteers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Download volunteers data as Excel
  const handleDownloadExcel = () => {
    try {
      const excelData = allVolunteers.map((volunteer, index) => ({
        'S.No': index + 1,
        'Volunteer ID': volunteer.id || '',
        'Full Name': volunteer.full_name || '',
        'Email': volunteer.email || '',
        'Phone': volunteer.phone_number || '',
        'Assigned Location': volunteer.assigned_location || '',
        'Total Scans Performed': volunteer.total_scans_performed || 0,
        'Status': volunteer.is_active ? 'Active' : 'Inactive',
        'Created At': volunteer.created_at ? new Date(volunteer.created_at).toLocaleString() : '',
        'Updated At': volunteer.updated_at ? new Date(volunteer.updated_at).toLocaleString() : ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Volunteers');

      worksheet['!cols'] = [
        { wch: 6 },  // S.No
        { wch: 12 }, // Volunteer ID
        { wch: 25 }, // Full Name
        { wch: 30 }, // Email
        { wch: 15 }, // Phone
        { wch: 20 }, // Assigned Location
        { wch: 20 }, // Total Scans Performed
        { wch: 10 }, // Status
        { wch: 18 }, // Created At
        { wch: 18 }  // Updated At
      ];

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const fileName = `SGTU_Volunteers_${timestamp}.xlsx`;

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, fileName);

      alert(`Excel file downloaded successfully! Total volunteers: ${allVolunteers.length}`);
    } catch (error) {
      console.error('Excel download error:', error);
      alert('Failed to download Excel file. Please try again.');
    }
  };

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      setAdminName(localStorage.getItem("admin_name") || "Admin");
      fetchVolunteers();
    }
  }, [isChecking, isAuthenticated]);

  // Get unique locations for filter
  const locations = useMemo(() => getUniqueValues(allVolunteers, "assigned_location"), [allVolunteers]);

  // Apply filters, search, and sort
  const processedVolunteers = useMemo(() => {
    let result = [...allVolunteers];
    
    // Apply search
    if (searchTerm) {
      result = filterData(result, searchTerm, ["full_name", "email", "assigned_location"]);
    }
    
    // Apply location filter
    if (locationFilter !== "all") {
      result = filterByField(result, "assigned_location", locationFilter);
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(v => {
        if (statusFilter === "active") return v.is_active === true;
        if (statusFilter === "inactive") return v.is_active === false;
        return true;
      });
    }
    
    // Apply sort
    if (sortField) {
      result = sortData(result, sortField, sortDirection);
    }
    
    return result;
  }, [allVolunteers, searchTerm, locationFilter, statusFilter, sortField, sortDirection]);

  // Paginate
  const { paginatedData: volunteers, totalPages, totalItems } = useMemo(() => 
    paginateData(processedVolunteers, currentPage, itemsPerPage),
    [processedVolunteers, currentPage, itemsPerPage]
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

  const handleVolunteerClick = (volunteer) => {
    setSelectedVolunteer(volunteer);
    setShowDetailSidebar(true);
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

          {/* Search and Filter Bar */}
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 text-xl">search</span>
                <input
                  type="text"
                  placeholder="Search by name, email, location..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-card-background text-dark-text"
                />
              </div>
              <select
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2.5 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-card-background text-dark-text"
              >
                <option value="all">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc || "Unassigned"}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2.5 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-card-background text-dark-text"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
                Showing {volunteers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} volunteers
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleDownloadExcel}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm bg-blue-100 text-primary border border-blue-200 rounded-lg hover:bg-blue-200 transition"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                  <span className="hidden sm:inline">Download Excel</span>
                  <span className="sm:hidden">Download</span>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          {loading ? (
            <div className="hidden md:block bg-card-background rounded-xl border border-light-gray-border shadow-soft p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="hidden md:block bg-card-background rounded-xl border border-light-gray-border shadow-soft overflow-hidden">
              {/* TABLE HEADER */}
              <div className="grid grid-cols-[2.5fr_2.5fr_1fr_1fr_1fr_1.5fr_0.5fr] bg-soft-background px-6 py-3 font-medium text-gray-700 text-xs uppercase tracking-wider gap-4">
                <button onClick={() => handleSort("full_name")} className="flex items-center gap-1 hover:text-primary transition text-left">
                  <span>Name</span>
                  <span className={`material-symbols-outlined text-sm ${sortField === "full_name" ? "text-primary" : ""}`}>
                    {getSortIcon("full_name")}
                  </span>
                </button>
                <button onClick={() => handleSort("assigned_location")} className="flex items-center gap-1 hover:text-primary transition text-left">
                  <span>Location</span>
                  <span className={`material-symbols-outlined text-sm ${sortField === "assigned_location" ? "text-primary" : ""}`}>
                    {getSortIcon("assigned_location")}
                  </span>
                </button>
                <button onClick={() => handleSort("total_scans_performed")} className="flex items-center justify-end gap-1 hover:text-primary transition">
                  <span>Scans</span>
                  <span className={`material-symbols-outlined text-sm ${sortField === "total_scans_performed" ? "text-primary" : ""}`}>
                    {getSortIcon("total_scans_performed")}
                  </span>
                </button>
                <div className="text-right">Check-Ins</div>
                <div className="text-right">Check-Outs</div>
                <button onClick={() => handleSort("is_active")} className="flex items-center gap-1 hover:text-primary transition text-left">
                  <span>Status</span>
                  <span className={`material-symbols-outlined text-sm ${sortField === "is_active" ? "text-primary" : ""}`}>
                    {getSortIcon("is_active")}
                  </span>
                </button>
                <div></div>
              </div>

              {/* DATA ROWS */}
              {volunteers.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-700">
                  {searchTerm || locationFilter !== "all" || statusFilter !== "all" ? "No volunteers match your filters" : "No volunteers found"}
                </div>
              ) : (
                volunteers.map((v, i) => (
                  <div
                    key={v.id}
                    onClick={() => handleVolunteerClick(v)}
                    className={`grid grid-cols-[2.5fr_2.5fr_1fr_1fr_1fr_1.5fr_0.5fr] px-6 py-4 text-sm items-center border-b border-light-gray-border
                    hover:bg-gray-50 transition cursor-pointer gap-4 ${
                      selectedVolunteer?.id === v.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div>
                      <div className="font-medium text-dark-text">{v.full_name}</div>
                      <div className="text-xs text-gray-700">{v.email}</div>
                    </div>
                    <div className="text-gray-700 truncate">
                      {v.assigned_location || "—"}
                    </div>
                    <div className="text-right font-medium text-dark-text">
                      {v.total_scans_performed || 0}
                    </div>
                    <div className="text-right">
                      <span className="text-green-600 font-medium">
                        {Math.floor((v.total_scans_performed || 0) / 2)}
                      </span>
                    </div>
                    <div className="text-right pr-2">
                      <span className="text-red-600 font-medium">
                        {Math.floor((v.total_scans_performed || 0) / 2)}
                      </span>
                    </div>
                    <div className="pl-2">
                      {v.is_active ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-700 hover:text-gray-700 p-1"
                      >
                        <span className="material-symbols-outlined text-lg">more_vert</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

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
            ) : volunteers.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-700">
                No volunteers found
              </div>
            ) : (
              volunteers.map((v) => (
                <div
                  key={v.id}
                  onClick={() => handleVolunteerClick(v)}
                  className={`bg-card-background rounded-xl border border-light-gray-border shadow-soft p-4 cursor-pointer transition ${
                    selectedVolunteer?.id === v.id ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-dark-text text-base mb-1">
                        {v.full_name}
                      </h3>
                      <p className="text-sm text-gray-700 mb-1">{v.email}</p>
                      <p className="text-xs text-gray-700">{v.assigned_location || "—"}</p>
                    </div>
                    <button 
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-700 hover:text-gray-700 p-1"
                    >
                      <span className="material-symbols-outlined text-xl">more_vert</span>
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-light-gray-border grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-gray-700 mb-1">Total Scans</div>
                      <div className="font-semibold text-dark-text">{v.total_scans_performed || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-700 mb-1">Check-Ins</div>
                      <div className="font-semibold text-green-600">
                        {Math.floor((v.total_scans_performed || 0) / 2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-700 mb-1">Check-Outs</div>
                      <div className="font-semibold text-red-600">
                        {Math.floor((v.total_scans_performed || 0) / 2)}
                      </div>
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

        {/* Volunteer Detail Sidebar */}
        {showDetailSidebar && selectedVolunteer && (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
            <div className="w-full max-w-md bg-card-background h-full overflow-y-auto shadow-soft">
              <div className="sticky top-0 bg-card-background border-b border-light-gray-border p-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-dark-text">Volunteer Details</h2>
                <button
                  onClick={() => {
                    setShowDetailSidebar(false);
                    setSelectedVolunteer(null);
                  }}
                  className="text-gray-700 hover:text-gray-700"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Volunteer Profile */}
                <div className="flex items-center gap-4 pb-4 border-b border-light-gray-border">
                  <div className="w-16 h-16 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-primary text-xl font-semibold">
                    {selectedVolunteer.full_name?.charAt(0)?.toUpperCase() || "V"}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-dark-text">{selectedVolunteer.full_name}</h3>
                    <p className="text-sm text-gray-700">{selectedVolunteer.email}</p>
                  </div>
                </div>

                {/* Details Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Volunteer UUID (Database ID)</label>
                      <div className="text-xs font-mono text-dark-text break-all">
                        {selectedVolunteer.id || "N/A"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Department</label>
                      <div className="text-sm font-medium text-dark-text">
                        {selectedVolunteer.assigned_location || "Not Assigned"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Phone Number</label>
                      <div className="text-sm font-medium text-dark-text">
                        {selectedVolunteer.phone || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Status</label>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedVolunteer.is_active ? "bg-green-500" : "bg-gray-400"}`}></div>
                        <span className="text-sm font-medium text-dark-text">
                          {selectedVolunteer.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Assigned Gate</label>
                      <div className="text-sm font-medium text-dark-text">
                        {selectedVolunteer.assigned_location || "Gate A (Main Entrance)"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Assigned Role</label>
                      <div className="text-sm font-medium text-dark-text">
                        Gate Scanner
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Statistics */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Summary</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-soft-background rounded-lg p-4 border border-light-gray-border text-center">
                      <div className="text-xs text-gray-700 mb-1">TOTAL SCANS</div>
                      <div className="text-xl font-bold text-dark-text">
                        {selectedVolunteer.total_scans_performed || 0}
                      </div>
                    </div>
                    <div className="bg-soft-background rounded-lg p-4 border border-light-gray-border text-center">
                      <div className="text-xs text-gray-700 mb-1">CHECK-INS</div>
                      <div className="text-xl font-bold text-green-600">
                        {Math.floor((selectedVolunteer.total_scans_performed || 0) / 2)}
                      </div>
                    </div>
                    <div className="bg-soft-background rounded-lg p-4 border border-light-gray-border text-center">
                      <div className="text-xs text-gray-700 mb-1">CHECK-OUTS</div>
                      <div className="text-xl font-bold text-red-600">
                        {Math.floor((selectedVolunteer.total_scans_performed || 0) / 2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
      <AdminMobileNav />
    </div>
  );
}
