"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAuth";

export default function AdminAnalyticsPage() {
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [topSchools, setTopSchools] = useState([]);
  const [topStalls, setTopStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");
  const router = useRouter();

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      setAdminName(localStorage.getItem("admin_name") || "Admin");
      fetchAnalytics();
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

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [schoolsRes, stallsRes] = await Promise.all([
        api.get("/admin/top-schools?limit=10").catch(() => ({ data: { success: false, data: { top_schools: [] } } })),
        api.get("/admin/top-stalls?limit=10").catch(() => ({ data: { success: false, data: { top_stalls: [] } } }))
      ]);
      
      if (schoolsRes.data?.success) {
        setTopSchools(schoolsRes.data.data.top_schools || []);
      } else {
        setTopSchools([]);
      }
      
      if (stallsRes.data?.success) {
        setTopStalls(stallsRes.data.data.top_stalls || []);
      } else {
        setTopStalls([]);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setTopSchools([]);
      setTopStalls([]);
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TOP SCHOOLS */}
            <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft p-6">
              <h2 className="text-lg font-semibold mb-4 text-dark-text">Top Schools</h2>
              
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : topSchools.length === 0 ? (
                <div className="text-center text-gray-700 py-8">
                  No ranking data available
                </div>
              ) : (
                <div className="space-y-3">
                  {topSchools.map((school, index) => (
                    <div
                      key={school.school_id}
                      className="p-5 xl:p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0 ? "bg-yellow-500" :
                            index === 1 ? "bg-gray-400" :
                            index === 2 ? "bg-orange-600" :
                            "bg-blue-500"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-dark-text">
                              {school.school_name}
                            </div>
                            <div className="text-xs text-gray-700">
                              {school.students_participated} students participated
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary text-lg">
                            {school.total_score}
                          </div>
                          <div className="text-xs text-gray-700">points</div>
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-700 mt-2">
                        <span>🥇 {school.breakdown.rank_1_votes}</span>
                        <span>🥈 {school.breakdown.rank_2_votes}</span>
                        <span>🥉 {school.breakdown.rank_3_votes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TOP STALLS */}
            <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft p-6">
              <h2 className="text-lg font-semibold mb-4 text-dark-text">Top Stalls</h2>
              
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : topStalls.length === 0 ? (
                <div className="text-center text-gray-700 py-8">
                  No ranking data available
                </div>
              ) : (
                <div className="space-y-3">
                  {topStalls.map((stall, index) => (
                    <div
                      key={stall.stall_id}
                      className="p-5 xl:p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0 ? "bg-yellow-500" :
                            index === 1 ? "bg-gray-400" :
                            index === 2 ? "bg-orange-600" :
                            "bg-blue-500"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-dark-text">
                              {stall.stall_name}
                            </div>
                            <div className="text-xs text-gray-700">
                              #{stall.stall_number} • {stall.school.school_name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary text-lg">
                            {stall.ranking_stats.weighted_score}
                          </div>
                          <div className="text-xs text-gray-700">score</div>
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-700 mt-2">
                        <span>🥇 {stall.ranking_stats.rank_1_votes}</span>
                        <span>🥈 {stall.ranking_stats.rank_2_votes}</span>
                        <span>🥉 {stall.ranking_stats.rank_3_votes}</span>
                        <span className="ml-auto">Total: {stall.ranking_stats.total_votes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <AdminMobileNav />
    </div>
  );
}
