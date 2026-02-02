"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useStudentAuth } from "@/hooks/useAuth";

/**
 * Student Check-in History Page
 * Displays all check-in and check-out records for the student
 */
export default function CheckInHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, isChecking } = useStudentAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      fetchCheckInHistory();
    }
  }, [isChecking, isAuthenticated]);

  const fetchCheckInHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/student/check-in-history", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        setHistory(response.data.data || []);
      }
    } catch (err) {
      console.error("Check-in history error:", err);
      setError("Failed to load check-in history");
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-soft-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary mb-4 hover:underline"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>
          <h1 className="text-2xl font-bold text-dark-text mb-2">Check-in History</h1>
          <p className="text-gray-700">Your attendance records for all events</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* History List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card-background rounded-xl border border-light-gray-border p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="bg-card-background rounded-xl border border-light-gray-border p-12 text-center">
            <span className="material-symbols-outlined text-6xl text-gray-700 mb-4 block">history</span>
            <h3 className="text-lg font-medium text-dark-text mb-2">No Check-in History</h3>
            <p className="text-gray-700">You haven't checked in to any events yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((record) => (
              <div
                key={record.id}
                className="bg-card-background rounded-xl border border-light-gray-border p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-dark-text text-lg mb-1">
                      {record.event_name || "Event"}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      <span>{record.location || "Unknown Location"}</span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      record.check_out_time
                        ? "bg-gray-100 text-gray-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {record.check_out_time ? "Completed" : "Active"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-light-gray-border">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Check-in Time
                    </label>
                    <div className="flex items-center gap-2 text-dark-text">
                      <span className="material-symbols-outlined text-green-600 text-sm">login</span>
                      <span className="text-sm">
                        {record.check_in_time
                          ? new Date(record.check_in_time).toLocaleString()
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Check-out Time
                    </label>
                    <div className="flex items-center gap-2 text-dark-text">
                      <span className="material-symbols-outlined text-red-600 text-sm">logout</span>
                      <span className="text-sm">
                        {record.check_out_time
                          ? new Date(record.check_out_time).toLocaleString()
                          : "Still inside"}
                      </span>
                    </div>
                  </div>

                  {record.duration_minutes && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Duration
                      </label>
                      <div className="flex items-center gap-2 text-dark-text">
                        <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                        <span className="text-sm font-medium">
                          {Math.floor(record.duration_minutes / 60)}h{" "}
                          {record.duration_minutes % 60}m
                        </span>
                      </div>
                    </div>
                  )}

                  {record.scan_type && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Scan Type
                      </label>
                      <span className="text-sm text-dark-text capitalize">
                        {record.scan_type}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
