"use client";

import { useEffect, useState } from "react";
import EventManagerSidebar from "@/components/event-manager/EventManagerSidebar";
import EventManagerHeader from "@/components/event-manager/EventManagerHeader";
import EventManagerMobileNav from "@/components/event-manager/EventManagerMobileNav";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEventManagerAuth } from "@/hooks/useAuth";

export default function EventManagerDashboard() {
  const { isAuthenticated, isChecking } = useEventManagerAuth();
  const [managerName, setManagerName] = useState("Event Manager");
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalRegistrations: 0,
    pendingApproval: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState("approved");
  const router = useRouter();

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      setManagerName(localStorage.getItem("event_manager_name") || "Event Manager");
      fetchDashboardData();
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [profileRes, eventsRes] = await Promise.all([
        api.get("/event-manager/profile"),
        api.get("/event-manager/events?limit=5")
      ]);

      if (profileRes.data?.success) {
        const manager = profileRes.data.data.manager;
        const managerStats = profileRes.data.data.stats;

        setManagerName(manager.full_name || "Event Manager");
        setApprovalStatus(manager.is_approved_by_admin ? "approved" : "pending");

        setStats({
          totalEvents: managerStats?.total_events_created || 0,
          activeEvents: managerStats?.active_events || 0,
          totalRegistrations: managerStats?.total_registrations_across_events || 0,
          pendingApproval: managerStats?.pending_events || 0
        });
      }

      if (eventsRes.data?.success) {
        // Backend returns { data: { data: [...events...], pagination: {...} } }
        const eventsData = eventsRes.data.data.data || eventsRes.data.data.events || [];
        setRecentEvents(Array.isArray(eventsData) ? eventsData : []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/event-manager/logout");
    } catch(e){}
    localStorage.removeItem("event_manager_token");
    localStorage.removeItem("event_manager_name");
    localStorage.removeItem("event_manager_email");
    router.replace("/");
  };

  return (
    <div className="flex min-h-screen bg-soft-background">
      <EventManagerSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <EventManagerHeader managerName={managerName} onLogout={handleLogout} />

        <main className="p-4 sm:p-6 md:ml-64 pt-16 sm:pt-20 pb-20 sm:pb-6">
          {/* Approval Status Banner */}
          {approvalStatus !== "approved" && (
            <div className="mb-6 p-5 bg-blue-100/30 dark:bg-blue-900/20 border-l-4 border-blue-600 rounded-lg shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-3xl">pending_actions</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-800 dark:text-blue-100 mb-2">
                    Account Pending Admin Approval
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-blue-200 leading-relaxed">
                    Your Event Manager account is awaiting admin approval. You will be able to create and manage events once your account is approved by an administrator.
                  </p>
                  <p className="text-xs text-gray-600 dark:text-blue-300 mt-3 leading-relaxed">
                    <strong>Note:</strong> Any events you create will also require admin approval before becoming active.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold mb-1 text-dark-text">
                Welcome back, {managerName}!
              </h1>
              <p className="text-sm text-gray-700">
                Here's an overview of your event management dashboard
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => router.push("/event-manager/events/create")}
                disabled={approvalStatus !== "approved"}
                className="flex-1 sm:flex-initial px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                <span>Create Event</span>
              </button>
            </div>
          </div> */}




{/* 
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Total Events"
                value={stats.totalEvents}
                icon="event"
                subtitle="All time"
              />
              <StatCard
                title="Active Events"
                value={stats.activeEvents}
                icon="event_available"
                subtitle="Currently running"
                positive
              />
              <StatCard
                title="Total Registrations"
                value={stats.totalRegistrations}
                icon="how_to_reg"
                subtitle="Across all events"
              />
              <StatCard
                title="Pending Approval"
                value={stats.pendingApproval}
                icon="pending"
                subtitle="Awaiting admin review"
              />
            </div>
          )} */}





          {loading ? (
    /* --- Premium SKELETON LOADING State (Theme-Aligned) --- */
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div 
          key={i} 
          className="
            p-6 rounded-[18px] 
            border border-light-gray-border 
            bg-card-background 
            shadow-sm 
            animate-pulse 
            transition-all duration-300
          "
        >
          {/* Title Placeholder */}
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          {/* Value Placeholder (Taller) */}
          <div className="h-9 bg-gray-300 rounded w-2/5 mb-5"></div>
          {/* Subtitle Placeholder */}
          <div className="h-3 bg-gray-100 rounded w-1/2"></div>
        </div>
      ))}
    </div>
) : (
    /* --- Final Stat Cards UI with SGT Theme Mapping --- */
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      
      {/* 1. Total Events (Primary Blue - The main brand color) */}
      <StatCard
        title="Total Events"
        value={stats.totalEvents}
        icon="event"
        subtitle="All time events hosted"
        color="primary"
      />
      
      {/* 2. Active Events (Success/Green - Positive trend indicator) */}
      <StatCard
        title="Active Events"
        value={stats.activeEvents}
        icon="event_available"
        subtitle="Currently running or approved"
        color="success"
      />
      
      {/* 3. Total Registrations (Accent Yellow/Gold - Key business metric) */}
      <StatCard
        title="Total Registrations"
        value={stats.totalRegistrations}
        icon="how_to_reg"
        subtitle="Across all events"
        color="accent"
      />
      
      {/* 4. Pending Approval (Warning/Orange - Action required) */}
      <StatCard
        title="Pending Approval"
        value={stats.pendingApproval}
        icon="pending"
        subtitle="Awaiting admin review"
        color="warning"
      />
    </div>
)}

        


          {/* Recent Events */}
<div className="bg-card-background p-4 sm:p-6 rounded-2xl border border-light-gray-border shadow-soft">
  <div className="flex items-center justify-between mb-6">
    <div>
      <h3 className="text-lg font-semibold text-dark-text">
        Recent Events
      </h3>
      <p className="text-xs text-gray-700">Your latest event activities</p>
    </div>
    <button
      onClick={() => router.push("/event-manager/events")}
      className="text-sm text-primary hover:underline font-medium"
    >
      View All
    </button>
  </div>

  {loading ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-52 bg-gray-200 rounded-2xl animate-pulse"></div>
      ))}
    </div>
  ) : recentEvents.length > 0 ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {recentEvents.map((event) => (
        <EventCard key={event.id} event={event} onClick={() => router.push(`/event-manager/events/${event.id}`)} />
      ))}
    </div>
  ) : (
    <div className="text-center py-12">
      <span className="material-symbols-outlined text-6xl text-gray-300">
        event_busy
      </span>
      <p className="text-sm text-gray-700 mt-2">No events created yet</p>
    </div>
  )}
</div>

        </main>

        <EventManagerMobileNav />
      </div>
    </div>
  );
}


function StatCard({ title, value, icon, subtitle, color = 'neutral' }) {
    
    // Theme mapping based on SGT Colors
    const getThemeStyles = (color) => {
        switch (color) {
            case "primary":
                // Royal Blue Theme (from --primary)
                return { 
                    valueText: "text-primary",
                    iconBg: "bg-primary text-white shadow-primary/30",
                };
            case "accent":
                // Accent Yellow/Gold Theme (from --accent)
                return { 
                    valueText: "text-accent",
                    iconBg: "bg-accent text-zinc-900 shadow-yellow-500/30",
                };
            case "success":
                // Green for Positive Metrics
                return { 
                    valueText: "text-emerald-600",
                    iconBg: "bg-emerald-500 text-white shadow-emerald-500/30",
                };
            case "warning":
                // Orange for Caution/Action Required
                return { 
                    valueText: "text-orange-600",
                    iconBg: "bg-orange-500 text-white shadow-orange-500/30",
                };
            default:
                // Neutral Grey Theme
                return { 
                    valueText: "text-gray-700",
                    iconBg: "bg-gray-200 text-gray-700 shadow-gray-400/20",
                };
        }
    };

    const styles = getThemeStyles(color);

    return (
        <div 
            className="
                p-6 rounded-[18px] 
                
                bg-card-background 
                shadow-sm hover:shadow-soft 
                transform transition-all duration-300 hover:scale-[1.01]
                cursor-pointer
            "
        >
            <div className="flex items-start justify-between mb-4">
                
                {/* Title and Value */}
                <div>
                    {/* Title: Subtle, uppercase, high contrast */}
                    <p className="text-xs font-semibold uppercase text-gray-700 tracking-wider">
                        {title}
                    </p>
                    {/* Value: Boldest text, uses theme color */}
                    <h3 className={`text-3xl font-extrabold ${styles.valueText} mt-1`}>
                        {value}
                    </h3>
                </div>
                
                {/* Icon Circle: Solid color, shadow for elevation */}
                <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center 
                    text-white shadow-lg 
                    ${styles.iconBg}
                `}>
                    <span className="material-symbols-outlined text-xl">
                        {icon}
                    </span>
                </div>
            </div>

            {/* Subtitle/Footer: Subtle separator added for clean division */}
            {subtitle && (
                <p className="text-xs text-gray-700 font-medium pt-3 border-t border-light-gray-border/50">
                    {subtitle}
                </p>
            )}
        </div>
    );
}





function EventCard({ event, onClick }) {

  const poster =
    event.poster_url ||
    "https://plus.unsplash.com/premium_photo-1661780400751-e8e9a09ba7b1?w=900&auto=format&fit=crop&q=60";

  /* -----------------------------------------
     ACCURATE PAID / FREE DETECTION (FIXED)
  ------------------------------------------*/
  const isPaid =
    event.is_paid ||
    event.event_type === "PAID" ||
    (event.price && Number(event.price) > 0);

  /* -----------------------------------------
     STATUS BADGE LOGIC (UNCHANGED)
  ------------------------------------------*/
  const getStatusStyles = (status) => {
    switch (status) {
      case "APPROVED":
      case "ACTIVE":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-100",
          icon: "check_circle",
        };

      case "PENDING_APPROVAL":
        return {
          bg: "bg-yellow-50 text-yellow-700 border-yellow-100",
          icon: "hourglass_top",
        };

      case "REJECTED":
      case "CANCELLED":
        return {
          bg: "bg-red-50 text-red-700 border-red-100",
          icon: "cancel",
        };

      default:
        return {
          bg: "bg-blue-50 text-primary border-blue-100",
          icon: "info",
        };
    }
  };

  const status = (event.status || "DRAFT").replace(/_/g, " ");
  const statusStyle = getStatusStyles(event.status);

  const formattedDate = event.start_date
    ? new Date(event.start_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Date TBA";

  /* -----------------------------------------
     SAFE SHORT DESCRIPTION (NEW FEATURE)
     Falls back to "No description provided"
  ------------------------------------------*/
  const shortDescription = event.description
    ? event.description.slice(0, 150)
    : "No description provided.";

  return (
    <button
      onClick={onClick}
      className="
        group relative flex flex-col w-full text-left
        rounded-[16px] overflow-hidden
        border border-light-gray-border
        bg-card-background
        transition-all duration-300 ease-out
        hover:shadow-soft hover:border-primary/30 hover:-translate-y-1
        focus:outline-none focus:ring-4 focus:ring-primary/10
      "
      aria-label={`View details for ${event.event_name}`}
    >
      {/* -------------------------------------
          POSTER
      -------------------------------------- */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-100">
        <img
          src={poster}
          alt={event.event_name}
          className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">

          {/* PAID / FREE TAG (FIXED) */}
          <span
            className={`
              backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border border-white/10 shadow-sm
              ${isPaid
                ? "bg-[#ECC94B] text-black border-[#ECC94B]"
                : "bg-white/90 text-primary-dark"
              }
            `}
          >
            {isPaid ? "Paid Event" : "Free Entry"}
          </span>

          {/* STATUS TAG */}
          <span
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md border
              ${statusStyle.bg} border-opacity-50
            `}
          >
            <span className="material-symbols-outlined text-[14px] font-bold">
              {statusStyle.icon}
            </span>
            <span className="capitalize">{status}</span>
          </span>
        </div>
      </div>

      {/* -------------------------------------
          DETAILS
      -------------------------------------- */}
      <div className="flex flex-col flex-1 p-5 gap-3">

        {/* Title */}
        <div>
          <h3 className="text-lg font-bold text-dark-text leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {event.event_name}
          </h3>

          <p className="mt-1 text-xs font-medium text-gray-700 flex items-center gap-1">
            <span className="opacity-70">Hosted by</span>
            <span className="text-primary font-semibold truncate">
              {event.created_by || "SGT University"}
            </span>
          </p>
        </div>

        {/* NEW: Short Description */}
        <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
          {shortDescription}
        </p>

        {/* Divider */}
        <div className="h-px w-full bg-light-gray-border/60" />

        {/* META ROW */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-4 text-xs text-gray-700 font-medium">

            {/* DATE */}
            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-light-gray-border border-dashed">
              <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
              <span>{formattedDate}</span>
            </div>

            {/* PARTICIPANTS */}
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-gray-700">group</span>
              <span>{event.participants_count || 0}</span>
            </div>
          </div>

          {/* ARROW */}
          <div
            className="
              flex items-center justify-center w-8 h-8 rounded-full 
              bg-blue-50 text-primary 
              group-hover:bg-primary group-hover:text-white 
              transition-all duration-300 shadow-sm
            "
          >
            <span className="material-symbols-outlined text-[18px] transform group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </div>
        </div>

      </div>
    </button>
  );
}

