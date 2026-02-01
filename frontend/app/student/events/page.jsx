"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useStudentAuth } from "@/hooks/useAuth";
import StudentSidebar from "@/components/student/StudentSidebar";
import StudentHeader from "@/components/student/StudentHeader";
import StudentMobileNav from "@/components/student/StudentMobileNav";

export default function StudentEventsPage() {
  const { isAuthenticated, isChecking } = useStudentAuth();
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      fetchEvents();
    }
  }, [isChecking, isAuthenticated]);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/student/events");
      
      console.log("Events API Response:", response.data);

      if (response.data?.success) {
        // Check if data is nested or direct array
        let eventsData = response.data.data;
        
        // If data has nested structure with events array
        if (eventsData && typeof eventsData === 'object' && !Array.isArray(eventsData)) {
          eventsData = eventsData.events || eventsData.data || [];
        }
        
        console.log("Parsed events:", eventsData);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      console.error("Error response:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/student/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/";
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

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.event_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.event_code?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === "ALL") return matchesSearch;
    return event.event_type === filterType && matchesSearch;
  });

  return (
    <div className="bg-soft-background font-sans text-dark-text antialiased min-h-screen flex">
      <StudentSidebar onLogout={handleLogout} />

      <div className="flex-1 flex flex-col">
        <StudentHeader theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-4 pb-32 sm:p-6 lg:p-8 lg:pb-10">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-dark-text">Available Events</h1>
                <p className="text-sm text-gray-700 mt-1">
                  Browse and register for upcoming events
                </p>
              </div>
              <button
                onClick={() => fetchEvents()}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                <span>Refresh</span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-700">search</span>
                  <input
                    type="text"
                    placeholder="Search events by name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
              >
                <option value="ALL">All Events</option>
                <option value="FREE">Free Events</option>
                <option value="PAID">Paid Events</option>
              </select>
            </div>

            {/* Events Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => router.push(`/student/events/${event.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card-background rounded-xl border border-light-gray-border">
                <span className="material-symbols-outlined text-6xl text-gray-300">event_busy</span>
                <p className="text-gray-700 mt-2">
                  {searchQuery ? "No events found matching your search" : "No events available"}
                </p>
              </div>
            )}

          </div>
        </main>

        <StudentMobileNav />
      </div>
    </div>
  );
}

function EventCard({ event, onClick }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getEventTypeColor = (type) => {
    return type === "FREE"
      ? "bg-green-100 text-green-700"
      : "bg-blue-100 text-blue-700";
  };

  return (
    <button
      onClick={onClick}
      className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all text-left group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-dark-text truncate group-hover:text-primary transition">
            {event.event_name}
          </h3>
          <p className="text-xs text-gray-700 mt-1">{event.event_code}</p>
        </div>
        <span className="material-symbols-outlined text-gray-700 group-hover:text-primary transition">arrow_forward</span>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <span className="material-symbols-outlined text-base">calendar_today</span>
          <span>{formatDate(event.start_date)} - {formatDate(event.end_date)}</span>
        </div>
        {event.venue && (
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="material-symbols-outlined text-base">location_on</span>
            <span>{event.venue}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getEventTypeColor(event.event_type)}`}>
          {event.event_type === "FREE" ? "Free Event" : `₹${event.price}`}
        </span>
        <span className="text-xs text-gray-700">
          {event.max_capacity === null || event.max_capacity === undefined
            ? "Unlimited spots"
            : event.is_full
              ? "Full"
              : `${event.max_capacity - (event.current_registrations || 0)} spots left`}
        </span>
      </div>

      {event.event_category && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="text-xs text-gray-700">{event.event_category}</span>
        </div>
      )}
    </button>
  );
}
