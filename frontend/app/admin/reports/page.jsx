"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAuth";

export default function AdminReportsPage() {
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalVolunteers: 0,
    totalStalls: 0,
    activeCheckIns: 0,
    completedCheckIns: 0,
    totalCheckIns: 0,
    averageDuration: 0
  });
  const [schoolStats, setSchoolStats] = useState(null);
  const [stallStats, setStallStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");
  const router = useRouter();

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      setAdminName(localStorage.getItem("admin_name") || "Admin");
      fetchReports();
    }
  }, [isChecking, isAuthenticated]);

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

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [adminStatsRes, checkInStatsRes, topSchoolsRes, topStallsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/check-in-out/stats").catch(() => ({ data: { data: {} } })),
        api.get("/admin/top-schools?limit=5").catch(() => ({ data: { data: {} } })),
        api.get("/admin/top-stalls?limit=5").catch(() => ({ data: { data: {} } }))
      ]);
      
      if (adminStatsRes.data?.success) {
        setStats(prev => ({
          ...prev,
          totalStudents: adminStatsRes.data.data.totalStudents || 0,
          totalVolunteers: adminStatsRes.data.data.totalVolunteers || 0,
          totalStalls: adminStatsRes.data.data.totalStalls || 0
        }));
      }

      if (checkInStatsRes.data?.data) {
        setStats(prev => ({
          ...prev,
          activeCheckIns: checkInStatsRes.data.data.active_check_ins || 0,
          completedCheckIns: checkInStatsRes.data.data.completed_check_ins || 0,
          totalCheckIns: checkInStatsRes.data.data.total_check_ins || 0,
          averageDuration: checkInStatsRes.data.data.average_duration_minutes || 0
        }));
      }

      if (topSchoolsRes.data?.success) {
        setSchoolStats(topSchoolsRes.data.data);
      }

      if (topStallsRes.data?.success) {
        setStallStats(topStallsRes.data.data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1 text-dark-text">Reports & Statistics</h1>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-6">
              <div className="h-32 bg-gray-200 rounded-2xl"></div>
              <div className="h-64 bg-gray-200 rounded-2xl"></div>
            </div>
          ) : (
            <>
              {/* OVERVIEW STATS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Students" value={stats.totalStudents} icon="school" />
                <StatCard title="Total Volunteers" value={stats.totalVolunteers} icon="group" />
                <StatCard title="Total Stalls" value={stats.totalStalls} icon="store" />
                <StatCard title="Total Scans" value={stats.totalCheckIns} icon="qr_code_scanner" />
              </div>

              {/* CHECK-IN STATS */}
              <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4 text-dark-text">Check-In Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-700">Active Check-Ins</div>
                    <div className="text-2xl font-bold text-yellow-600 mt-1">
                      {stats.activeCheckIns}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-700">Completed Check-Ins</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                      {stats.completedCheckIns}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-700">Average Duration</div>
                    <div className="text-2xl font-bold text-primary mt-1">
                      {stats.averageDuration.toFixed(1)} min
                    </div>
                  </div>
                </div>
              </div>

              {/* RANKING STATS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {schoolStats && (
                  <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft p-6">
                    <h2 className="text-lg font-semibold mb-4 text-dark-text">School Rankings</h2>
                    {schoolStats.overall_stats && (
                      <div className="mb-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Schools Participated:</span>
                          <span className="font-semibold">{schoolStats.overall_stats.total_schools_participated}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Students Participated:</span>
                          <span className="font-semibold">{schoolStats.overall_stats.total_students_participated}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Stalls Ranked:</span>
                          <span className="font-semibold">{schoolStats.overall_stats.total_stalls_ranked}</span>
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-gray-700 mt-4">
                      Scoring: 🥇 5pts, 🥈 3pts, 🥉 1pt
                    </div>
                  </div>
                )}

                {stallStats && (
                  <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft p-6">
                    <h2 className="text-lg font-semibold mb-4 text-dark-text">Stall Rankings</h2>
                    {stallStats.overall_stats && (
                      <div className="mb-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Stalls Ranked:</span>
                          <span className="font-semibold">{stallStats.overall_stats.total_stalls_ranked}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Students Voted:</span>
                          <span className="font-semibold">{stallStats.overall_stats.total_students_voted}</span>
                        </div>
                        {stallStats.overall_stats.breakdown && (
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-700">🥇 Rank 1 Votes:</span>
                              <span className="font-semibold">{stallStats.overall_stats.breakdown.rank_1_votes}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-700">🥈 Rank 2 Votes:</span>
                              <span className="font-semibold">{stallStats.overall_stats.breakdown.rank_2_votes}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-700">🥉 Rank 3 Votes:</span>
                              <span className="font-semibold">{stallStats.overall_stats.breakdown.rank_3_votes}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-gray-700 mt-4">
                      Weighted Score = (Rank 1 × 5) + (Rank 2 × 3) + (Rank 3 × 1)
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
      <AdminMobileNav />
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="p-5 rounded-xl border border-light-gray-border bg-card-background shadow-soft hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-xs text-gray-700 mb-2">{title}</p>
          <h2 className="text-2xl font-bold text-dark-text">{typeof value === 'number' ? value.toLocaleString() : value}</h2>
        </div>
        <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-xl text-primary">{icon}</span>
        </div>
      </div>
    </div>
  );
}
