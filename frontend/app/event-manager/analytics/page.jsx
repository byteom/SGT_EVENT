// "use client";

// import { useEffect, useState } from "react";
// import EventManagerSidebar from "@/components/event-manager/EventManagerSidebar";
// import EventManagerHeader from "@/components/event-manager/EventManagerHeader";
// import EventManagerMobileNav from "@/components/event-manager/EventManagerMobileNav";
// import api from "@/lib/api";
// import { useRouter } from "next/navigation";
// import { useEventManagerAuth } from "@/hooks/useAuth";

// export default function AnalyticsPage() {
//   const { isAuthenticated, isChecking } = useEventManagerAuth();
//   const [events, setEvents] = useState([]);
//   const [selectedEvent, setSelectedEvent] = useState(null);
//   const [analytics, setAnalytics] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   useEffect(() => {
//     if (!isChecking && isAuthenticated) {
//       fetchEvents();
//     }
//   }, [isChecking, isAuthenticated]);

//   useEffect(() => {
//     if (selectedEvent) {
//       fetchAnalytics(selectedEvent);
//     }
//   }, [selectedEvent]);

//   if (isChecking) {
//     return (
//       <div className="min-h-screen bg-soft-background flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
//           <p className="text-dark-text">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!isAuthenticated) {
//     return null;
//   }

//   const fetchEvents = async () => {
//     try {
//       setLoading(true);
//       const response = await api.get("/event-manager/events");

//       if (response.data?.success) {
//         // Backend returns { data: { data: [...events...], pagination: {...} } }
//         const eventsData = response.data.data.data || response.data.data.events || [];
//         const eventsList = Array.isArray(eventsData) ? eventsData : [];
//         setEvents(eventsList);
//         if (eventsList.length > 0) {
//           setSelectedEvent(eventsList[0].id);
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching events:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchAnalytics = async (eventId) => {
//     try {
//       const response = await api.get(`/event-manager/events/${eventId}/analytics`);

//       if (response.data?.success) {
//         setAnalytics(response.data.data);
//       }
//     } catch (error) {
//       console.error("Error fetching analytics:", error);
//       setAnalytics(null);
//     }
//   };

//   const handleLogout = async () => {
//     try {
//       await api.post("/event-manager/logout");
//     } catch(e){}
//     localStorage.removeItem("event_manager_token");
//     localStorage.removeItem("event_manager_name");
//     localStorage.removeItem("event_manager_email");
//     router.replace("/");
//   };

//   const selectedEventData = events.find(e => e.id === selectedEvent);

//   return (
//     <div className="flex min-h-screen bg-soft-background">
//       <EventManagerSidebar onLogout={handleLogout} />
//       <div className="flex-1 flex flex-col">
//         <EventManagerHeader managerName={localStorage.getItem("event_manager_name") || "Event Manager"} onLogout={handleLogout} />

//         <main className="p-4 sm:p-6 md:ml-64 pt-16 sm:pt-20 pb-20 sm:pb-6">
//           <div className="max-w-7xl mx-auto">
//             <div className="mb-6">
//               <h1 className="text-2xl font-bold text-dark-text mb-1">Analytics & Insights</h1>
//               <p className="text-sm text-gray-700">
//                 Detailed performance metrics for your events
//               </p>
//             </div>

//             {/* Event Selector */}
//             <div className="mb-6 bg-card-background p-4 rounded-xl border border-light-gray-border">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Select Event
//               </label>
//               <select
//                 value={selectedEvent || ""}
//                 onChange={(e) => setSelectedEvent(e.target.value)}
//                 className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
//               >
//                 {events.map((event) => (
//                   <option key={event.id} value={event.id}>
//                     {event.event_name} ({event.event_code})
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {loading ? (
//               <div className="space-y-4">
//                 {[1, 2, 3].map(i => (
//                   <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
//                 ))}
//               </div>
//             ) : events.length === 0 ? (
//               <div className="text-center py-12 bg-card-background rounded-xl border border-light-gray-border">
//                 <span className="material-symbols-outlined text-6xl text-gray-300">event_busy</span>
//                 <p className="text-gray-700 mt-2">No events created yet</p>
//                 <button
//                   onClick={() => router.push("/event-manager/events/create")}
//                   className="mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-medium"
//                 >
//                   Create Your First Event
//                 </button>
//               </div>
//             ) : analytics ? (
//               <div className="space-y-6">
//                 {/* Event Info Card */}
//                 {selectedEventData && (
//                   <div className="bg-card-background p-6 rounded-xl border border-light-gray-border">
//                     <h2 className="text-lg font-semibold text-dark-text mb-2">
//                       {selectedEventData.event_name}
//                     </h2>
//                     <div className="flex flex-wrap gap-3 items-center">
//                       <span className="text-sm text-gray-700">{selectedEventData.event_code}</span>
//                       <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(selectedEventData.status)}`}>
//                         {selectedEventData.status.replace(/_/g, " ")}
//                       </span>
//                       <span className="text-sm text-gray-700">
//                         {selectedEventData.event_type === "FREE" ? "Free Event" : `₹${selectedEventData.price}`}
//                       </span>
//                     </div>
//                   </div>
//                 )}

//                 {/* Key Metrics */}
//                 <div>
//                   <h2 className="text-lg font-semibold text-dark-text mb-4">Key Metrics</h2>
//                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//                     <MetricCard
//                       title="Total Registrations"
//                       value={analytics.stats?.total_registrations || 0}
//                       icon="how_to_reg"
//                       color="blue"
//                     />
//                     <MetricCard
//                       title="Confirmed"
//                       value={analytics.stats?.registrations?.confirmed || 0}
//                       icon="check_circle"
//                       color="green"
//                     />
//                     <MetricCard
//                       title="Total Revenue"
//                       value={`₹${analytics.stats?.total_revenue || 0}`}
//                       icon="payments"
//                       color="purple"
//                     />
//                     <MetricCard
//                       title="Volunteers"
//                       value={analytics.stats?.volunteers?.total_volunteers || 0}
//                       icon="groups"
//                       color="orange"
//                     />
//                   </div>
//                 </div>

//                 {/* Registration Breakdown */}
//                 {analytics.stats?.registrations && (
//                   <div className="bg-card-background p-6 rounded-xl border border-light-gray-border">
//                     <h2 className="text-lg font-semibold text-dark-text mb-4">Registration Status</h2>
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                       <StatusCard label="Confirmed" value={analytics.stats.registrations.confirmed || 0} color="green" />
//                       <StatusCard label="Pending" value={analytics.stats.registrations.pending || 0} color="yellow" />
//                       <StatusCard label="Cancelled" value={analytics.stats.registrations.cancelled || 0} color="red" />
//                       <StatusCard label="Waitlisted" value={analytics.stats.registrations.waitlisted || 0} color="gray" />
//                     </div>
//                   </div>
//                 )}

//                 {/* Payment Breakdown */}
//                 {analytics.stats?.payment_breakdown && (
//                   <div className="bg-card-background p-6 rounded-xl border border-light-gray-border">
//                     <h2 className="text-lg font-semibold text-dark-text mb-4">Payment Status</h2>
//                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//                       <StatusCard
//                         label="Completed"
//                         value={analytics.stats.payment_breakdown.completed || 0}
//                         color="green"
//                       />
//                       <StatusCard
//                         label="Pending"
//                         value={analytics.stats.payment_breakdown.pending || 0}
//                         color="yellow"
//                       />
//                       <StatusCard
//                         label="Failed"
//                         value={analytics.stats.payment_breakdown.failed || 0}
//                         color="red"
//                       />
//                     </div>
//                   </div>
//                 )}

//                 {/* Volunteer Performance */}
//                 {analytics.volunteer_performance && analytics.volunteer_performance.length > 0 && (
//                   <div className="bg-card-background p-6 rounded-xl border border-light-gray-border">
//                     <h2 className="text-lg font-semibold text-dark-text mb-4">Top Performing Volunteers</h2>
//                     <div className="space-y-3">
//                       {analytics.volunteer_performance.slice(0, 5).map((vol, idx) => (
//                         <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                           <div className="flex items-center gap-3">
//                             <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm">
//                               {idx + 1}
//                             </div>
//                             <div>
//                               <p className="font-medium text-dark-text">{vol.volunteer_name || "Unknown"}</p>
//                               <p className="text-xs text-gray-700">{vol.assigned_location || "No location"}</p>
//                             </div>
//                           </div>
//                           <div className="text-right">
//                             <p className="font-semibold text-dark-text">{vol.total_scans || 0}</p>
//                             <p className="text-xs text-gray-700">scans</p>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {/* Capacity Info */}
//                 {analytics.stats?.capacity_info && (
//                   <div className="bg-card-background p-6 rounded-xl border border-light-gray-border">
//                     <h2 className="text-lg font-semibold text-dark-text mb-4">Capacity Information</h2>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                       <div>
//                         <p className="text-sm text-gray-700">Max Capacity</p>
//                         <p className="text-2xl font-bold text-dark-text">
//                           {analytics.stats.capacity_info.max_capacity || "Unlimited"}
//                         </p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-700">Current Registrations</p>
//                         <p className="text-2xl font-bold text-primary">
//                           {analytics.stats.capacity_info.current_registrations || 0}
//                         </p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-700">Available Spots</p>
//                         <p className="text-2xl font-bold text-green-600">
//                           {analytics.stats.capacity_info.available_spots === null
//                             ? "Unlimited"
//                             : analytics.stats.capacity_info.available_spots}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <div className="text-center py-12 bg-card-background rounded-xl border border-light-gray-border">
//                 <span className="material-symbols-outlined text-6xl text-gray-300">analytics</span>
//                 <p className="text-gray-700 mt-2">Analytics data not available for this event</p>
//               </div>
//             )}
//           </div>
//         </main>

//         <EventManagerMobileNav />
//       </div>
//     </div>
//   );
// }

// function MetricCard({ title, value, icon, color }) {
//   const colorClasses = {
//     blue: "bg-blue-100 text-blue-600",
//     green: "bg-green-100 text-green-600",
//     purple: "bg-purple-100 text-purple-600",
//     orange: "bg-orange-100 text-orange-600",
//   };

//   return (
//     <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
//       <div className="flex items-start justify-between mb-3">
//         <div>
//           <p className="text-xs font-medium text-gray-700">{title}</p>
//           <h3 className="text-2xl font-bold text-dark-text mt-1">{value}</h3>
//         </div>
//         <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
//           <span className="material-symbols-outlined text-xl">{icon}</span>
//         </div>
//       </div>
//     </div>
//   );
// }

// function StatusCard({ label, value, color }) {
//   const colorClasses = {
//     green: "text-green-600",
//     yellow: "text-yellow-600",
//     red: "text-red-600",
//     gray: "text-gray-700",
//   };

//   return (
//     <div className="text-center">
//       <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
//       <p className="text-sm text-gray-700 mt-1">{label}</p>
//     </div>
//   );
// }

// function getStatusColor(status) {
//   switch (status) {
//     case "APPROVED": return "bg-green-100 text-green-700";
//     case "ACTIVE": return "bg-green-100 text-green-700";
//     case "PENDING_APPROVAL": return "bg-yellow-100 text-yellow-700";
//     case "REJECTED": return "bg-red-100 text-red-700";
//     case "CANCELLED": return "bg-red-100 text-red-700";
//     case "DRAFT": return "bg-gray-100 text-gray-700";
//     case "COMPLETED": return "bg-blue-100 text-blue-700";
//     default: return "bg-gray-100 text-gray-700";
//   }
// }






"use client";

import { useEffect, useState } from "react";
import EventManagerSidebar from "@/components/event-manager/EventManagerSidebar";
import EventManagerHeader from "@/components/event-manager/EventManagerHeader";
import EventManagerMobileNav from "@/components/event-manager/EventManagerMobileNav";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEventManagerAuth } from "@/hooks/useAuth";

/* ======================================================
   MAIN PAGE COMPONENT
====================================================== */
export default function AnalyticsPage() {
  /* -----------------------------
     🔐 AUTH / STATE HOOKS
  ------------------------------ */
  const { isAuthenticated, isChecking } = useEventManagerAuth();

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  /* ======================================================
     📡 FETCH EVENTS & ANALYTICS
  ====================================================== */
  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      fetchEvents();
    }
  }, [isChecking, isAuthenticated]);

  useEffect(() => {
    if (selectedEvent) {
      fetchAnalytics(selectedEvent);
    }
  }, [selectedEvent]);

  /* ======================================================
     CONDITIONAL RETURNS
  ====================================================== */
  if (isChecking) {
    return (
      <div className="min-h-screen bg-soft-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-dark-text">Loading Analytics Platform...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  /* ======================================================
     📡 API FUNCTIONS
  ====================================================== */

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/event-manager/events");

      if (res.data?.success) {
        const data = res.data.data?.data || res.data.data?.events || [];
        const list = Array.isArray(data) ? data : [];

        setEvents(list);

        if (list.length > 0) {
          setSelectedEvent(list[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (eventId) => {
    try {
      const [analyticsRes, registrationsRes] = await Promise.all([
        api.get(`/event-manager/events/${eventId}/analytics`).catch(() => ({ data: { success: false, data: null } })),
        api.get(`/event-manager/events/${eventId}/registrations`).catch(() => ({ data: { data: { data: [] } } }))
      ]);

      if (analyticsRes.data?.success) {
        setAnalytics(analyticsRes.data.data);
      } else {
        setAnalytics(null);
      }

      if (registrationsRes.data?.success) {
        setRegistrations(registrationsRes.data.data.data || []);
      } else {
        setRegistrations([]);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setAnalytics(null);
      setRegistrations([]);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/event-manager/logout");
    } catch {}
    localStorage.removeItem("event_manager_token");
    localStorage.removeItem("event_manager_name");
    localStorage.removeItem("event_manager_email");
    router.replace("/");
  };

  const selectedEventData = events.find((e) => e.id === selectedEvent);

  /* ======================================================
     🎨 PREMIUM UI STARTS HERE
  ====================================================== */
  return (
    <div className="flex min-h-screen bg-soft-background">
      <EventManagerSidebar onLogout={handleLogout} />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        <EventManagerHeader managerName={localStorage.getItem("event_manager_name") || "Event Manager"} onLogout={handleLogout} />

        <main className="p-4 sm:p-6 md:ml-64 pt-20 sm:pt-24 pb-20">

          <div className="max-w-7xl mx-auto">

            {/* HEADER */}
            {/* <div className="mb-8">
              <h1 className="text-3xl font-bold font-display text-dark-text">Analytics Dashboard</h1>
              <p className="text-base text-gray-700 mt-1">
                Real-time performance metrics and insights for your events.
              </p>
            </div> */}

            {/* EVENT SELECTOR (Sleek Input Style) */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-dark-text mb-2 pl-1">
                Select Event for Analysis
              </label>

              <select
                value={selectedEvent || ""}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="
                  w-full md:w-96 px-4 py-3 border border-light-gray-border
                  rounded-xl bg-card-background 
                  text-dark-text font-medium shadow-sm
                  focus:ring-2 focus:ring-primary focus:border-primary transition-all
                "
              >
                {events.length === 0 ? (
                    <option value="" disabled>No events available</option>
                ) : (
                    events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                            {ev.event_name} ({ev.event_code})
                        </option>
                    ))
                )}
              </select>
            </div>

            {/* CONTENT LOGIC */}
            {loading ? (
              <LoadingSkeleton />
            ) : events.length === 0 ? (
              <EmptyState router={router} />
            ) : analytics ? (
              <AnalyticsContent selectedEventData={selectedEventData} analytics={analytics} registrations={registrations} />
            ) : (
              <NoAnalyticsState />
            )}

          </div>
        </main>

        <EventManagerMobileNav />
      </div>
    </div>
  );
}

/* ======================================================
   REUSABLE UI SUB COMPONENTS
====================================================== */

function LoadingSkeleton() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse"></div>
        ))}
      </div>
    );
  }

function EmptyState({ router }) {
  return (
    <div className="text-center py-16 bg-card-background rounded-2xl border border-light-gray-border shadow-soft">
      <span className="material-symbols-outlined text-7xl text-gray-300">event_busy</span>
      <p className="text-lg font-semibold text-gray-700 mt-4">
        You have not created any events yet.
      </p>
      <p className="text-sm text-gray-700 mt-1 mb-6">
        Start by creating your first event to see performance metrics here.
      </p>
      <button
        onClick={() => router.push("/event-manager/events/create")}
        className="mt-4 px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition font-bold shadow-md shadow-primary/30"
      >
        <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Create New Event
        </span>
      </button>
    </div>
  );
}

function NoAnalyticsState() {
  return (
    <div className="text-center py-16 bg-card-background rounded-2xl border border-light-gray-border shadow-soft">
      <span className="material-symbols-outlined text-7xl text-gray-300">analytics_outline</span>
      <p className="text-lg font-semibold text-gray-700 mt-4">
        Analytics Not Available
      </p>
      <p className="text-sm text-gray-700 mt-1">
        This event may not have any registrations or data yet.
      </p>
    </div>
  );
}

function AnalyticsContent({ selectedEventData, analytics, registrations }) {
  // Calculate correct registration counts based on payment status
  const getCorrectCounts = () => {
    if (!registrations || registrations.length === 0) {
      return {
        total: 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0,
        waitlisted: 0
      };
    }

    const isPaidEvent = selectedEventData?.event_type === 'PAID';

    // Total - all registrations
    const total = registrations.length;

    // Confirmed - only payment completed
    const confirmed = registrations.filter(reg => {
      if (isPaidEvent) {
        return reg.payment_status === 'COMPLETED';
      }
      return reg.registration_status === 'CONFIRMED' || 
             reg.payment_status === 'NOT_REQUIRED' || 
             reg.payment_status === 'COMPLETED';
    }).length;

    // Pending - payment pending wale
    const pending = registrations.filter(reg => {
      if (isPaidEvent) {
        return reg.payment_status === 'PENDING';
      }
      return reg.registration_status === 'PENDING';
    }).length;

    const cancelled = registrations.filter(reg => 
      reg.registration_status === 'CANCELLED' || reg.payment_status === 'FAILED'
    ).length;

    const waitlisted = registrations.filter(reg => 
      reg.registration_status === 'WAITLISTED'
    ).length;

    return {
      total,
      confirmed,
      pending,
      cancelled,
      waitlisted
    };
  };

  const counts = getCorrectCounts();

  return (
    <div className="space-y-8">
      {/* Event Summary */}
      {selectedEventData && (
        <div className="bg-card-background p-6 rounded-2xl border border-light-gray-border shadow-soft">
          <h2 className="text-2xl font-extrabold text-dark-text mb-1">
            {selectedEventData.event_name}
          </h2>

          <div className="flex flex-wrap gap-x-6 gap-y-2 items-center mt-3">
            <p className="text-sm text-gray-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">qr_code</span>
                <span className="font-semibold uppercase">{selectedEventData.event_code}</span>
            </p>

            <span className={`text-xs px-3 py-1.5 rounded-full font-bold tracking-wider ${getStatusColor(selectedEventData.status)}`}>
              {selectedEventData.status.replace(/_/g, " ")}
            </span>

            <p className="text-sm text-gray-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">sell</span>
                <span className="font-semibold">
                    {selectedEventData.event_type === "FREE"
                        ? "Free Event"
                        : `₹${selectedEventData.price}`}
                </span>
            </p>
          </div>
        </div>
      )}

      {/* Key Metrics (Premium Cards) */}
      <div>
        <h2 className="text-xl font-semibold text-dark-text mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">speed</span> Key Performance Indicators
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total Registrations" value={counts.total} icon="how_to_reg" color="primary" />
          <MetricCard title="Confirmed Attendees" value={counts.confirmed} icon="check_circle" color="emerald" />
          <MetricCard title="Total Revenue" value={`₹${analytics.stats?.total_revenue || 0}`} icon="payments" color="fuchsia" />
          <MetricCard title="Active Volunteers" value={analytics.stats?.volunteers?.total_volunteers || 0} icon="groups" color="accent" />
        </div>
      </div>

      {/* Registration Breakdown */}
      <SectionCard title="Registration Status Breakdown" icon="timeline">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatusCard label="Confirmed" value={counts.confirmed} icon="verified" color="emerald" />
          <StatusCard label="Pending" value={counts.pending} icon="hourglass_empty" color="accent" />
          <StatusCard label="Cancelled" value={counts.cancelled} icon="block" color="red" />
          <StatusCard label="Waitlisted" value={counts.waitlisted} icon="list_alt" color="gray" />
        </div>
      </SectionCard>

      {/* Payment Breakdown (Conditional render for paid events) */}
      {selectedEventData?.event_type !== "FREE" && analytics.stats?.payment_breakdown && (
        <SectionCard title="Payment Status Breakdown" icon="account_balance_wallet">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <StatusCard label="Completed" value={analytics.stats.payment_breakdown.completed || 0} icon="credit_card" color="emerald" />
            <StatusCard label="Pending" value={analytics.stats.payment_breakdown.pending || 0} icon="schedule" color="accent" />
            <StatusCard label="Failed" value={analytics.stats.payment_breakdown.failed || 0} icon="dangerous" color="red" />
          </div>
        </SectionCard>
      )}

      {/* Volunteer Performance */}
      {analytics.volunteer_performance?.length > 0 && (
        <SectionCard title="Top Performing Volunteers" icon="star">
          <div className="space-y-4">
            {analytics.volunteer_performance.slice(0, 5).map((vol, idx) => (
              <VolunteerCard vol={vol} idx={idx} key={idx} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Capacity Info */}
      {analytics.stats?.capacity_info && (
        <SectionCard title="Capacity & Slot Information" icon="groups_2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CapacityItem label="Max Capacity" value={analytics.stats.capacity_info.max_capacity || "Unlimited"} icon="group" color="gray" />
            <CapacityItem label="Current Registrations" value={analytics.stats.capacity_info.current_registrations || 0} icon="how_to_reg" color="primary" />
            <CapacityItem label="Available Spots" value={analytics.stats.capacity_info.available_spots ?? "Unlimited"} icon="event_seat" color="emerald" />
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/* ======================================================
   SUB COMPONENTS
====================================================== */

function SectionCard({ title, icon, children }) {
  return (
    <div className="bg-card-background p-6 rounded-2xl border border-light-gray-border shadow-soft">
      <h2 className="text-xl font-semibold text-dark-text mb-5 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function MetricCard({ title, value, icon, color }) {
  const colorMap = {
    primary: "bg-primary/10 text-primary border-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500",
    fuchsia: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500",
    accent: "bg-accent/10 text-accent border-accent",
  };
  
  const iconColorMap = {
      primary: "bg-primary text-white",
      emerald: "bg-emerald-500 text-white",
      fuchsia: "bg-fuchsia-500 text-white",
      accent: "bg-accent text-zinc-900",
  }

  const baseClasses = colorMap[color] || colorMap.primary;
  const iconClasses = iconColorMap[color] || iconColorMap.primary;

  return (
    <div className={`
        p-5 rounded-2xl bg-card-background 
        border border-light-gray-border shadow-soft
        relative overflow-hidden
        hover:shadow-lg transition-all duration-300
    `}>
        {/* Color Indicator Bar */}
        <div className={`absolute top-0 left-0 w-full h-1 ${baseClasses} bg-opacity-70`} />

      <div className="flex items-center justify-between pt-2">
        <div>
          <h3 className="text-3xl font-extrabold text-dark-text mb-1">{value}</h3>
          <p className="text-sm text-gray-700 font-medium">{title}</p>
        </div>

        <div className={`p-2 rounded-full ${iconClasses} shadow-md`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, color, icon }) {
  const colors = {
    emerald: "text-emerald-500 bg-emerald-500/10",
    accent: "text-accent bg-accent/10",
    red: "text-red-600 bg-red-500/10",
    gray: "text-gray-700 bg-gray-500/10",
  };
  
  const baseClasses = colors[color] || colors.gray;

  return (
    <div className={`p-4 rounded-xl text-center border border-light-gray-border/50 ${baseClasses}`}>
        <span className={`material-symbols-outlined text-2xl font-bold ${colors[color]}`}>{icon}</span>
        <p className={`text-2xl font-extrabold mt-1 ${colors[color]}`}>{value}</p>
        <p className="text-sm text-gray-700 font-medium mt-1">{label}</p>
    </div>
  );
}

function VolunteerCard({ vol, idx }) {
    const isTopPerformer = idx < 3;
    
    const colorClass = isTopPerformer 
        ? (idx === 0 ? "bg-accent text-zinc-900 shadow-md shadow-accent/40" : "bg-primary/20 text-primary")
        : "bg-gray-50 text-dark-text";

    const ringClass = idx === 0 ? "ring-2 ring-accent/50" : "";

    return (
        <div className={`flex items-center justify-between p-4 rounded-xl transition-all ${colorClass}`}>
            <div className="flex items-center gap-4">
                {/* Ranking Badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm ${
                    idx === 0 ? "bg-accent text-zinc-900 " + ringClass : "bg-primary text-white"
                }`}>
                    #{idx + 1}
                </div>
                <div>
                    <p className="font-semibold text-dark-text">{vol.volunteer_name || "Unknown Volunteer"}</p>
                    <p className="text-xs text-gray-700 mt-0.5">
                        <span className="material-symbols-outlined text-xs align-middle mr-1">location_on</span>
                        {vol.assigned_location || "No Location Assigned"}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className={`text-xl font-extrabold ${isTopPerformer ? 'text-primary' : 'text-gray-700'}`}>{vol.total_scans || 0}</p>
                <p className="text-xs text-gray-700">Total Scans</p>
            </div>
        </div>
    );
}

function CapacityItem({ label, value, icon, color }) {
  const colorMap = {
    primary: "text-primary",
    emerald: "text-emerald-500",
    gray: "text-gray-700",
  };
  
  const baseClasses = colorMap[color] || colorMap.gray;

  return (
    <div className="p-4 bg-soft-background rounded-xl">
      <div className="flex items-center gap-2">
        <span className={`material-symbols-outlined text-xl ${baseClasses}`}>{icon}</span>
        <p className="text-sm text-gray-700 font-medium">{label}</p>
      </div>
      <p className={`text-3xl font-extrabold mt-1 ${baseClasses}`}>{value}</p>
    </div>
  );
}

/* ======================================================
   STATUS BADGE COLOR
====================================================== */
function getStatusColor(status) {
  switch (status) {
    case "APPROVED":
    case "ACTIVE":
      return "bg-emerald-500/10 text-emerald-600";

    case "PENDING_APPROVAL":
      return "bg-accent/10 text-accent";

    case "REJECTED":
    case "CANCELLED":
      return "bg-red-500/10 text-red-700";

    case "DRAFT":
      return "bg-gray-100 text-gray-700";

    case "COMPLETED":
      return "bg-primary/10 text-primary";

    default:
      return "bg-gray-200 text-gray-700";
  }
}