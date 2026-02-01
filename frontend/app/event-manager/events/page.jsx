// "use client";

// import { useEffect, useState } from "react";
// import EventManagerSidebar from "@/components/event-manager/EventManagerSidebar";
// import EventManagerHeader from "@/components/event-manager/EventManagerHeader";
// import EventManagerMobileNav from "@/components/event-manager/EventManagerMobileNav";
// import api from "@/lib/api";
// import { useRouter } from "next/navigation";
// import { useEventManagerAuth } from "@/hooks/useAuth";

// export default function EventsListPage() {
//   const { isAuthenticated, isChecking } = useEventManagerAuth();
//   const [managerName, setManagerName] = useState("Event Manager");
//   const [events, setEvents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [statusFilter, setStatusFilter] = useState("ALL");
//   const [searchQuery, setSearchQuery] = useState("");
//   const router = useRouter();

//   useEffect(() => {
//     if (!isChecking && isAuthenticated) {
//       setManagerName(localStorage.getItem("event_manager_name") || "Event Manager");
//       fetchEvents();
//     }
//   }, [isChecking, isAuthenticated, statusFilter]);

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
//       const params = statusFilter !== "ALL" ? { status: statusFilter } : {};
//       const response = await api.get("/event-manager/events", { params });

//       if (response.data?.success) {
//         // Backend returns { data: { data: [...events...], pagination: {...} } }
//         const eventsData = response.data.data.data || response.data.data.events || [];
//         setEvents(Array.isArray(eventsData) ? eventsData : []);
//       }
//     } catch (error) {
//       console.error("Error fetching events:", error);
//     } finally {
//       setLoading(false);
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

//   const filteredEvents = events.filter(event =>
//     event.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     event.event_code.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   return (
//     <div className="flex min-h-screen bg-soft-background">
//       <EventManagerSidebar onLogout={handleLogout} />
//       <div className="flex-1 flex flex-col">
//         <EventManagerHeader managerName={managerName} onLogout={handleLogout} />

//         <main className="p-4 sm:p-6 md:ml-64 pt-16 sm:pt-20 pb-20 sm:pb-6">
//           <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
//             <div>
//               <h1 className="text-xl sm:text-2xl font-bold mb-1 text-dark-text">My Events</h1>
//               <p className="text-sm text-gray-700">
//                 Manage and track all your events
//               </p>
//             </div>
//             <button
//               onClick={() => router.push("/event-manager/events/create")}
//               className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm font-medium flex items-center gap-2"
//             >
//               <span className="material-symbols-outlined text-lg">add</span>
//               <span>Create Event</span>
//             </button>
//           </div>

//           {/* Info Banner */}
//           <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
//             <div className="flex items-start gap-3">
//               <span className="material-symbols-outlined text-blue-600 text-xl mt-0.5">info</span>
//               <div>
//                 <p className="text-sm text-blue-800">
//                   <strong>Note:</strong> All events created require admin approval before becoming active. Events with "PENDING APPROVAL" status are awaiting admin review.
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Filters */}
//           <div className="mb-6 flex flex-col sm:flex-row gap-3">
//             <div className="flex-1">
//               <div className="relative">
//                 <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-700">search</span>
//                 <input
//                   type="text"
//                   placeholder="Search events by name or code..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
//                 />
//               </div>
//             </div>
//             <select
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//               className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
//             >
//               <option value="ALL">All Status</option>
//               <option value="DRAFT">Draft</option>
//               <option value="PENDING_APPROVAL">Pending Approval</option>
//               <option value="APPROVED">Approved</option>
//               <option value="ACTIVE">Active</option>
//               <option value="COMPLETED">Completed</option>
//               <option value="CANCELLED">Rejected/Cancelled</option>
//             </select>
//           </div>

//           {/* Events Grid */}
//           {loading ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {[1, 2, 3].map(i => (
//                 <div key={i} className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm animate-pulse">
//                   <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
//                   <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
//                   <div className="h-3 bg-gray-200 rounded w-full"></div>
//                 </div>
//               ))}
//             </div>
//           ) : filteredEvents.length > 0 ? (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {filteredEvents.map((event) => (
//                 <EventCard key={event.id} event={event} onClick={() => router.push(`/event-manager/events/${event.id}`)} />
//               ))}
//             </div>
//           ) : (
//             <div className="text-center py-12">
//               <span className="material-symbols-outlined text-8xl text-gray-300">event_busy</span>
//               <p className="text-lg font-medium text-gray-700 mt-4">
//                 {searchQuery ? "No events found matching your search" : "No events created yet"}
//               </p>
//               <button
//                 onClick={() => router.push("/event-manager/events/create")}
//                 className="mt-6 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-medium"
//               >
//                 Create Your First Event
//               </button>
//             </div>
//           )}
//         </main>

//         <EventManagerMobileNav />
//       </div>
//     </div>
//   );
// }

// function EventCard({ event, onClick }) {
//   const getStatusColor = (status) => {
//     switch (status) {
//       case "APPROVED": return "bg-green-100 text-green-700";
//       case "ACTIVE": return "bg-green-100 text-green-700";
//       case "PENDING_APPROVAL": return "bg-yellow-100 text-yellow-700";
//       case "REJECTED": return "bg-red-100 text-red-700";
//       case "CANCELLED": return "bg-red-100 text-red-700";
//       case "DRAFT": return "bg-gray-100 text-gray-700";
//       case "COMPLETED": return "bg-blue-100 text-blue-700";
//       default: return "bg-gray-100 text-gray-700";
//     }
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
//   };

//   return (
//     <button
//       onClick={onClick}
//       className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all text-left group"
//     >
//       <div className="flex items-start justify-between mb-3">
//         <div className="flex-1 min-w-0">
//           <h3 className="text-base font-semibold text-dark-text truncate group-hover:text-primary transition">
//             {event.event_name}
//           </h3>
//           <p className="text-xs text-gray-700 mt-1">{event.event_code}</p>
//         </div>
//         <span className="material-symbols-outlined text-gray-700 group-hover:text-primary transition">arrow_forward</span>
//       </div>

//       <div className="space-y-2 mb-3">
//         <div className="flex items-center gap-2 text-xs text-gray-700">
//           <span className="material-symbols-outlined text-base">calendar_today</span>
//           <span>{formatDate(event.start_date)} - {formatDate(event.end_date)}</span>
//         </div>
//         <div className="flex items-center gap-2 text-xs text-gray-700">
//           <span className="material-symbols-outlined text-base">
//             {event.event_type === "FREE" ? "money_off" : "payments"}
//           </span>
//           <span>{event.event_type === "FREE" ? "Free Event" : `₹${event.price}`}</span>
//         </div>
//       </div>

//       <div className="flex items-center gap-2 flex-wrap">
//         <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${getStatusColor(event.status)}`}>
//           {event.status === "PENDING_APPROVAL" && (
//             <span className="material-symbols-outlined text-sm">pending_actions</span>
//           )}
//           {(event.status === "APPROVED" || event.status === "ACTIVE") && (
//             <span className="material-symbols-outlined text-sm">check_circle</span>
//           )}
//           {(event.status === "REJECTED" || event.status === "CANCELLED") && (
//             <span className="material-symbols-outlined text-sm">cancel</span>
//           )}
//           {event.status.replace(/_/g, " ")}
//         </span>
//         {event.max_capacity && (
//           <span className="text-xs text-gray-700">
//             Capacity: {event.max_capacity}
//           </span>
//         )}
//       </div>
//     </button>
//   );
// }




















"use client";

import { useEffect, useState } from "react";
import EventManagerSidebar from "@/components/event-manager/EventManagerSidebar";
import EventManagerHeader from "@/components/event-manager/EventManagerHeader";
import EventManagerMobileNav from "@/components/event-manager/EventManagerMobileNav";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEventManagerAuth } from "@/hooks/useAuth";
// NOTE: EventCard component is defined below, now using updated styles

export default function EventsListPage() {
  const { isAuthenticated, isChecking } = useEventManagerAuth();
  const [managerName, setManagerName] = useState("Event Manager");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // --- FUNCTIONALITY (UNCHANGED) ---
  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      setManagerName(localStorage.getItem("event_manager_name") || "Event Manager");
      fetchEvents();
    }
  }, [isChecking, isAuthenticated, statusFilter]);

  if (isChecking) {
    // SGT Theme Loading State
    return (
      <div className="min-h-screen bg-soft-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-dark-text">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const fetchEvents = async () => {
    // ... (fetchEvents logic remains the same)
    try {
      setLoading(true);
      const params = statusFilter !== "ALL" ? { status: statusFilter } : {};
      const response = await api.get("/event-manager/events", { params });

      if (response.data?.success) {
        const eventsData = response.data.data.data || response.data.data.events || [];
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // ... (handleLogout logic remains the same)
    try {
      await api.post("/event-manager/logout");
    } catch(e){}
    localStorage.removeItem("event_manager_token");
    localStorage.removeItem("event_manager_name");
    localStorage.removeItem("event_manager_email");
    router.replace("/");
  };

  const filteredEvents = events.filter(event =>
    event.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.event_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-soft-background">
      <EventManagerSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <EventManagerHeader managerName={managerName} onLogout={handleLogout} />

        <main className="p-4 sm:p-6 md:ml-64 pt-20 sm:pt-24 pb-20 sm:pb-6">
          
          {/* --- TOP BAR: Title & Action Button --- */}
          {/* <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-display text-dark-text mb-1">My Events</h1>
              <p className="text-base text-gray-700">
                Manage and track all your scheduled events
              </p>
            </div>
            <button
              onClick={() => router.push("/event-manager/events/create")}
              className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition text-base font-medium flex items-center gap-2 shadow-soft hover:shadow-md"
            >
              <span className="material-symbols-outlined text-xl">add</span>
              <span>Create New Event</span>
            </button>
          </div> */}

          {/* --- FILTERS & SEARCH (Modern Stack) --- */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-700">search</span>
                <input
                  type="text"
                  placeholder="Search events by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  // Uses the beautiful input style from CreateEventPage
                  className="w-full pl-12 pr-4 py-2.5 border border-light-gray-border rounded-xl bg-card-background text-dark-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 shadow-sm placeholder:text-gray-700"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-light-gray-border rounded-xl bg-card-background text-dark-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 shadow-sm sm:w-56"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Rejected/Cancelled</option>
            </select>
          </div>
          
          {/* --- INFO BANNER (Stylized) --- */}
          <div className="mb-8 p-4 bg-primary/10 border border-primary/40 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-xl mt-0.5">info</span>
              <div>
                <p className="text-sm text-primary">
                  <strong>Approval Workflow:</strong> All new events require admin approval. Events with the PENDING APPROVAL status are awaiting review.
                </p>
              </div>
            </div>
          </div>


          {/* --- EVENTS GRID & STATES --- */}
          {loading ? (
            /* SKELETON LOADING */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div 
                    key={i} 
                    className="
                        h-64 rounded-[20px] 
                        border border-light-gray-border 
                        bg-card-background 
                        shadow-sm 
                        animate-pulse
                    "
                >
                    <div className="h-2/3 bg-gray-200 rounded-t-[20px]"></div>
                    <div className="p-4">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            /* EVENTS GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard 
                    key={event.id} 
                    event={event} 
                    onClick={() => router.push(`/event-manager/events/${event.id}`)} 
                />
              ))}
            </div>
          ) : (
            /* EMPTY STATE */
            <div className="text-center py-20 bg-card-background rounded-xl border border-light-gray-border">
              <span className="material-symbols-outlined text-8xl text-gray-300">inventory_2</span>
              <p className="text-xl font-semibold text-dark-text mt-4">
                {searchQuery ? "No results found" : "No events created yet"}
              </p>
              <p className="text-sm text-gray-700 mt-2 mb-6">
                {searchQuery ? "Try adjusting your search filters." : "Start by creating your first event proposal."}
              </p>
              <button
                onClick={() => router.push("/event-manager/events/create")}
                className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition font-medium shadow-soft"
              >
                <span className="flex items-center gap-2"><span className="material-symbols-outlined">add</span> Create Event</span>
              </button>
            </div>
          )}
        </main>

        <EventManagerMobileNav />
      </div>
    </div>
  );
}







// function EventCard({ event, onClick }) {
    
//     // 1. Image & Fallback (Added for premium look)
//     const poster =
//         event.poster_url ||
//         "https://plus.unsplash.com/premium_photo-1661780400751-e8e9a09ba7b1?w=900&auto=format&fit=crop&q=60"; // Default image

//     // 2. SGT Theme Status Logic (Based on previous logic)
//     const getStatusStyles = (status) => {
//         switch (status) {
//             case "APPROVED":
//             case "ACTIVE":
//                 // Success: Green
//                 return { 
//                     bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", 
//                     icon: "check_circle" 
//                 };
//             case "PENDING_APPROVAL":
//                 // Warning: Accent Gold/Yellow
//                 return { 
//                     bg: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30", 
//                     icon: "hourglass_top" 
//                 };
//             case "REJECTED":
//             case "CANCELLED":
//                 // Error: Red
//                 return { 
//                     bg: "bg-red-500/10 text-red-600 border-red-500/30", 
//                     icon: "cancel" 
//                 };
//             case "COMPLETED":
//                 // Completed: Primary Blue (Muted)
//                 return { 
//                     bg: "bg-primary/10 text-primary border-primary/30", 
//                     icon: "event_seen" 
//                 };
//             default: // DRAFT, etc.
//                 // Neutral: Grey/Muted
//                 return { 
//                     bg: "bg-gray-500/10 text-gray-700 border-gray-500/30", 
//                     icon: "edit_note" 
//                 };
//         }
//     };

//     const status = (event.status || "DRAFT").replace(/_/g, " ");
//     const statusStyle = getStatusStyles(event.status);

//     const formatDate = (dateString) => {
//         const date = new Date(dateString);
//         return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
//     };

//     return (
//         <button
//             onClick={onClick}
//             className="
//                 group relative flex flex-col w-full text-left
//                 rounded-[20px] overflow-hidden
//                 border border-light-gray-border
//                 bg-card-background
//                 transition-all duration-300 ease-out
//                 hover:shadow-soft hover:border-primary/40 hover:-translate-y-0.5
//                 focus:outline-none focus:ring-4 focus:ring-primary/10
//             "
//         >
//             {/* --- TOP IMAGE/HEADER --- */}
//             <div className="relative w-full h-32 overflow-hidden bg-gray-100">
//                 <img
//                     src={poster}
//                     alt={event.event_name}
//                     className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
//                     loading="lazy"
//                 />
                
//                 {/* Soft Overlay */}
//                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

//                 {/* Status Badge (Top-Right Glassy) */}
//                 <span 
//                     className={`
//                         absolute top-3 right-3 text-[11px] font-bold uppercase tracking-wider 
//                         px-3 py-1 rounded-full backdrop-blur-sm border
//                         ${statusStyle.bg}
//                     `}
//                 >
//                     <span className="flex items-center gap-1.5">
//                         <span className="material-symbols-outlined text-sm">{statusStyle.icon}</span>
//                         {status}
//                     </span>
//                 </span>
//             </div>

//             {/* --- CONTENT AREA --- */}
//             <div className="p-4 flex flex-col flex-1">
                
//                 {/* Title & Code */}
//                 <div className="mb-2">
//                     <h3 className="text-lg flex-nowrap font-semibold text-dark-text line-clamp-2 group-hover:text-primary transition-colors leading-snug">
//                         {event.event_name}
//                     </h3>
//                     <p className="text-xs text-gray-700 mt-1 font-medium">{event.event_code}</p>
//                 </div>

//                 {/* Meta Data */}
//                 <div className="space-y-2 mt-2 mb-4">
//                     {/* Date */}
//                     <div className="flex items-center gap-2 text-sm text-gray-700">
//                         <span className="material-symbols-outlined text-base text-primary">calendar_today</span>
//                         <span className="font-medium">
//                             {formatDate(event.start_date)} – {formatDate(event.end_date)}
//                         </span>
//                     </div>
//                     {/* Pricing */}
//                     <div className="flex items-center gap-2 text-sm">
//                         <span className={`material-symbols-outlined text-base ${event.event_type === "FREE" ? 'text-emerald-500' : 'text-accent'}`}>
//                             {event.event_type === "FREE" ? "money_off" : "payments"}
//                         </span>
//                         <span className={`font-medium ${event.event_type === "FREE" ? 'text-emerald-600' : 'text-accent'}`}>
//                             {event.event_type === "FREE" ? "Free Event" : `₹${event.price || '—'}`}
//                         </span>
//                     </div>
//                 </div>

//                 {/* Footer/Action */}
//                 <div className="mt-auto pt-3 border-t border-light-gray-border/50 flex items-center justify-between">
//                     <div className="text-xs text-gray-700 font-medium">
//                         {event.max_capacity ? `Capacity: ${event.max_capacity}` : 'Unlimited Capacity'}
//                     </div>
//                      <span className="material-symbols-outlined text-gray-700 group-hover:text-primary transition transform group-hover:translate-x-1">
//                         arrow_forward
//                     </span>
//                 </div>
//             </div>
//         </button>
//     );
// }





function EventCard({ event, onClick }) {
    
    // 1. Image & Fallback (Larger Ratio)
    const poster =
        event.poster_url ||
        "https://images.unsplash.com/photo-1540552737691-897715f5c531?q=80&w=2000&auto=format&fit=crop"; // Better, more vibrant default image

    // 2. SGT Theme Status Logic (Focus on Primary & Accent)
    const getStatusStyles = (status) => {
        switch (status) {
            case "APPROVED":
            case "ACTIVE":
                // Primary Blue (Best status for visibility)
                return { 
                    bg: "bg-primary text-white shadow-lg shadow-primary/30", 
                    text: "text-white", 
                    icon: "check_circle" 
                };
            case "PENDING_APPROVAL":
                // Accent Gold (Requires attention/Action)
                return { 
                    bg: "bg-accent text-zinc-900 shadow-lg shadow-accent/30", 
                    text: "text-zinc-900", 
                    icon: "hourglass_top" 
                };
            case "REJECTED":
            case "CANCELLED":
                // Muted Red/Warning (Needs visibility but not primary focus)
                return { 
                    bg: "bg-red-500/10 text-red-600 border border-red-500/30", 
                    text: "text-red-600", 
                    icon: "cancel" 
                };
            default: // DRAFT, COMPLETED, etc.
                // Neutral Grey (Less important status)
                return { 
                    bg: "bg-gray-200 text-gray-700", 
                    text: "text-gray-700", 
                    icon: "edit_note" 
                };
        }
    };

    const status = (event.status || "DRAFT").replace(/_/g, " ");
    const statusStyle = getStatusStyles(event.status);

    const formatShortDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <button
            onClick={onClick}
            className="
                group relative flex flex-col w-full text-left
                rounded-[20px] overflow-hidden
                border border-light-gray-border
                bg-card-background
                transition-all duration-300 ease-out
                hover:shadow-soft hover:border-primary/40 hover:-translate-y-0.5
                focus:outline-none focus:ring-4 focus:ring-primary/10
            "
        >
            {/* --- POSTER AREA (Better Ratio) --- */}
            <div className="relative w-full aspect-[4/2.2] overflow-hidden bg-gray-100">
                <img
                    // src={poster}
                    src="https://plus.unsplash.com/premium_photo-1706625661544-cf6ad6902f57?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8c3VjY2Vzc3xlbnwwfHwwfHx8MA%3D%3D"
                    alt={event.event_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
                
                {/* Overlay with subtle blue gradient (branding) */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />

                {/* Status Badge (Top-Right High Contrast) */}
                <span 
                    className={`
                        absolute top-4 right-4 text-[11px] font-extrabold uppercase tracking-wider 
                        px-3 py-1.5 rounded-full shadow-md
                        ${statusStyle.bg}
                    `}
                >
                    <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">{statusStyle.icon}</span>
                        {status}
                    </span>
                </span>
            </div>

            {/* --- CONTENT AREA (Emphasis on Text) --- */}
            <div className="p-5 flex flex-col flex-1">
                
                {/* Title & Code (Stronger Font) */}
                <div className="mb-3">
                    {/* Title: Changed to line-clamp-2 to handle long names, but looks solid */}
                    <h3 className="text-xl font-extrabold text-dark-text line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                        {event.event_name}
                    </h3>
                    <p className="text-xs text-gray-700 mt-1.5 font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">qr_code</span> 
                        <span className="uppercase">{event.event_code}</span>
                    </p>
                </div>

                {/* --- META DATA (Clean 3-Column Layout) --- */}
                <div className="grid grid-cols-3 divide-x divide-light-gray-border border-y border-light-gray-border py-3 mb-4">
                    
                    {/* Date */}
                    <div className="flex flex-col items-center justify-center px-1">
                        <span className="material-symbols-outlined text-primary text-xl">calendar_today</span>
                        <span className="text-xs font-bold text-dark-text mt-1.5">
                            {formatShortDate(event.start_date)}
                        </span>
                        <span className="text-[10px] text-gray-700">Date</span>
                    </div>

                    {/* Time */}
                    <div className="flex flex-col items-center justify-center px-1">
                        <span className="material-symbols-outlined text-primary text-xl">schedule</span>
                        <span className="text-xs font-bold text-dark-text mt-1.5">
                            {formatTime(event.start_date)}
                        </span>
                        <span className="text-[10px] text-gray-700">Time</span>
                    </div>

                    {/* Price/Type (Highlighting Free/Paid) */}
                    <div className="flex flex-col items-center justify-center px-1">
                        <span className={`material-symbols-outlined text-xl ${event.event_type === "FREE" ? 'text-emerald-500' : 'text-accent'}`}>
                            {event.event_type === "FREE" ? "confirmation_number" : "payments"}
                        </span>
                        <span className={`text-xs font-bold mt-1.5 ${event.event_type === "FREE" ? 'text-emerald-600' : 'text-accent'}`}>
                            {event.event_type === "FREE" ? "FREE" : `₹${event.price || '—'}`}
                        </span>
                        <span className="text-[10px] text-gray-700">Ticket</span>
                    </div>
                </div>

                {/* --- FOOTER/ACTION (Cleaned up) --- */}
                <div className="mt-auto flex items-center justify-between pt-1">
                    <div className="text-xs text-gray-700 font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-gray-700">group</span>
                        <span className="mt-0.5">
                            {event.max_capacity ? `Max: ${event.max_capacity}` : 'Unlimited'}
                        </span>
                    </div>
                     <span className="
                        w-8 h-8 flex items-center justify-center 
                        rounded-full border border-light-gray-border
                        bg-gray-50 
                        text-gray-700 group-hover:bg-primary group-hover:text-white 
                        transition-all duration-300 transform group-hover:translate-x-1
                     ">
                        <span className="material-symbols-outlined text-xl">
                            arrow_forward
                        </span>
                    </span>
                </div>
            </div>
        </button>
    );
}