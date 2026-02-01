// "use client";

// import { useState } from "react";
// import EventManagerSidebar from "@/components/event-manager/EventManagerSidebar";
// import EventManagerHeader from "@/components/event-manager/EventManagerHeader";
// import EventManagerMobileNav from "@/components/event-manager/EventManagerMobileNav";
// import api from "@/lib/api";
// import { useRouter } from "next/navigation";
// import { useEventManagerAuth } from "@/hooks/useAuth";

// export default function CreateEventPage() {
//   const { isAuthenticated, isChecking } = useEventManagerAuth();
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);

//   const [formData, setFormData] = useState({
//     event_name: "",
//     event_code: "",
//     description: "",
//     event_type: "FREE",
//     price: "",
//     start_date: "",
//     end_date: "",
//     registration_start_date: "",
//     registration_end_date: "",
//     max_capacity: "",
//     venue: "",
//     event_category: "",
//   });

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

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     // Auto-convert event_code to uppercase
//     const finalValue = name === 'event_code' ? value.toUpperCase() : value;
//     setFormData(prev => ({
//       ...prev,
//       [name]: finalValue
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       // Validate required fields
//       const required = ['event_name', 'event_code', 'event_type', 'start_date', 'end_date', 'registration_start_date', 'registration_end_date'];
//       for (const field of required) {
//         if (!formData[field]) {
//           alert(`${field.replace(/_/g, ' ')} is required`);
//           setLoading(false);
//           return;
//         }
//       }

//       // Validate price for paid events
//       if (formData.event_type === 'PAID' && (!formData.price || parseFloat(formData.price) <= 0)) {
//         alert('Price is required for paid events');
//         setLoading(false);
//         return;
//       }

//       // Helper function to safely convert date from datetime-local format
//       const convertToISO = (dateString, fieldName) => {
//         if (!dateString || dateString.trim() === '') {
//           alert(`${fieldName} is required`);
//           throw new Error(`${fieldName} is required`);
//         }
        
//         // datetime-local gives format: YYYY-MM-DDTHH:mm
//         // We need to ensure it's valid before converting
//         console.log(`Converting ${fieldName}:`, dateString);
        
//         const date = new Date(dateString);
//         console.log(`Date object for ${fieldName}:`, date, 'Valid:', !isNaN(date.getTime()));
        
//         if (isNaN(date.getTime())) {
//           alert(`Invalid date format for ${fieldName}. Value received: "${dateString}". Please re-select the date.`);
//           throw new Error(`Invalid date format for ${fieldName}`);
//         }
        
//         return date.toISOString();
//       };

//       // Prepare payload with properly formatted dates
//       const payload = {
//         event_name: formData.event_name,
//         event_code: formData.event_code,
//         event_type: formData.event_type,
//         description: formData.description || null,
//         venue: formData.venue || null,
//         event_category: formData.event_category || null,
//         // Convert datetime-local format to ISO 8601 format
//         start_date: convertToISO(formData.start_date, 'Start Date'),
//         end_date: convertToISO(formData.end_date, 'End Date'),
//         registration_start_date: convertToISO(formData.registration_start_date, 'Registration Start Date'),
//         registration_end_date: convertToISO(formData.registration_end_date, 'Registration End Date'),
//         price: formData.event_type === 'PAID' && formData.price ? parseFloat(formData.price) : null,
//         max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
//       };

//       console.log('Sending payload:', payload);
//       const response = await api.post('/event-manager/events', payload);

//       if (response.data?.success) {
//         alert(response.data.message || 'Event created successfully!');
//         router.push('/event-manager/events');
//       }
//     } catch (error) {
//       console.error('Error creating event:', error);
//       console.error('Error response:', error.response?.data);
      
//       // Show detailed validation errors if available
//       if (error.response?.data?.errors) {
//         const errorMessages = error.response.data.errors.map(err => err.msg || err.message).join('\n');
//         alert(`Validation errors:\n${errorMessages}`);
//       } else {
//         alert(error.response?.data?.message || 'Failed to create event');
//       }
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

//   return (
//     <div className="flex min-h-screen bg-soft-background">
//       <EventManagerSidebar onLogout={handleLogout} />
//       <div className="flex-1 flex flex-col">
//         <EventManagerHeader managerName={localStorage.getItem("event_manager_name") || "Event Manager"} onLogout={handleLogout} />

//         <main className="p-4 sm:p-6 md:ml-64 pt-16 sm:pt-20 pb-20 sm:pb-6">
//           <div className="max-w-4xl mx-auto">
//             <div className="mb-6">
//               <button
//                 onClick={() => router.back()}
//                 className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary mb-4"
//               >
//                 <span className="material-symbols-outlined text-lg">arrow_back</span>
//                 <span>Back to Events</span>
//               </button>
//               <h1 className="text-2xl font-bold text-dark-text">Create New Event</h1>
//               <p className="text-sm text-gray-700 mt-1">
//                 Fill in the details to create your event
//               </p>
//             </div>

//             <form onSubmit={handleSubmit} className="bg-card-background p-6 rounded-xl border border-light-gray-border shadow-soft">
//               {/* Basic Information */}
//               <div className="mb-6">
//                 <h2 className="text-lg font-semibold text-dark-text mb-4">Basic Information</h2>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Event Name <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       type="text"
//                       name="event_name"
//                       value={formData.event_name}
//                       onChange={handleChange}
//                       required
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
//                       placeholder="Enter event name"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Event Code <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       type="text"
//                       name="event_code"
//                       value={formData.event_code}
//                       onChange={handleChange}
//                       required
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600 uppercase"
//                       placeholder="EVENT-2024"
//                       pattern="[A-Z0-9_\-]+"
//                       title="Only uppercase letters, numbers, hyphens and underscores"
//                     />
//                     <p className="text-xs text-gray-700 mt-1">Use uppercase letters, numbers, hyphens, and underscores</p>
//                   </div>

//                   <div className="md:col-span-2">
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Description
//                     </label>
//                     <textarea
//                       name="description"
//                       value={formData.description}
//                       onChange={handleChange}
//                       rows="4"
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
//                       placeholder="Describe your event"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Event Category
//                     </label>
//                     <input
//                       type="text"
//                       name="event_category"
//                       value={formData.event_category}
//                       onChange={handleChange}
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
//                       placeholder="Workshop, Conference, etc."
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Venue
//                     </label>
//                     <input
//                       type="text"
//                       name="venue"
//                       value={formData.venue}
//                       onChange={handleChange}
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
//                       placeholder="Event venue"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Pricing */}
//               <div className="mb-6">
//                 <h2 className="text-lg font-semibold text-dark-text mb-4">Pricing</h2>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Event Type <span className="text-red-500">*</span>
//                     </label>
//                     <select
//                       name="event_type"
//                       value={formData.event_type}
//                       onChange={handleChange}
//                       required
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
//                     >
//                       <option value="FREE">Free</option>
//                       <option value="PAID">Paid</option>
//                     </select>
//                   </div>

//                   {formData.event_type === 'PAID' && (
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Price (₹) <span className="text-red-500">*</span>
//                       </label>
//                       <input
//                         type="number"
//                         name="price"
//                         value={formData.price}
//                         onChange={handleChange}
//                         required={formData.event_type === 'PAID'}
//                         min="1"
//                         max="100000"
//                         className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
//                         placeholder="Enter price"
//                       />
//                     </div>
//                   )}

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Max Capacity
//                     </label>
//                     <input
//                       type="number"
//                       name="max_capacity"
//                       value={formData.max_capacity}
//                       onChange={handleChange}
//                       min="1"
//                       max="100000"
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
//                       placeholder="Leave empty for unlimited"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Dates */}
//               <div className="mb-6">
//                 <h2 className="text-lg font-semibold text-dark-text mb-4">Event Dates</h2>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Start Date <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       type="datetime-local"
//                       name="start_date"
//                       value={formData.start_date}
//                       onChange={handleChange}
//                       required
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       End Date <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       type="datetime-local"
//                       name="end_date"
//                       value={formData.end_date}
//                       onChange={handleChange}
//                       required
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Registration Start <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       type="datetime-local"
//                       name="registration_start_date"
//                       value={formData.registration_start_date}
//                       onChange={handleChange}
//                       required
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Registration End <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       type="datetime-local"
//                       name="registration_end_date"
//                       value={formData.registration_end_date}
//                       onChange={handleChange}
//                       required
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Submit Buttons */}
//               <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200">
//                 <button
//                   type="button"
//                   onClick={() => router.back()}
//                   className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {loading ? "Creating..." : "Create Event"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </main>

//         <EventManagerMobileNav />
//       </div>
//     </div>
//   );
// }





"use client";

import { useState } from "react";
import EventManagerSidebar from "@/components/event-manager/EventManagerSidebar";
import EventManagerHeader from "@/components/event-manager/EventManagerHeader";
import EventManagerMobileNav from "@/components/event-manager/EventManagerMobileNav";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEventManagerAuth } from "@/hooks/useAuth";

// Helper component for styled input - MOVED OUTSIDE to prevent re-creation
const StyledInput = ({ label, required, children, helperText }) => (
  <div>
      <label className="block text-sm font-medium text-dark-text mb-2 flex items-center gap-1">
          {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {helperText && <p className="text-xs text-gray-700 mt-1 pl-1">{helperText}</p>}
  </div>
);

// Class for all input fields (for consistency)
const inputClass = "w-full px-4 py-2.5 border border-light-gray-border rounded-xl bg-card-background text-dark-text focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 shadow-sm placeholder:text-gray-700";

export default function CreateEventPage() {
  const { isAuthenticated, isChecking } = useEventManagerAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    event_name: "",
    event_code: "",
    description: "",
    event_type: "FREE",
    price: "",
    start_date: "",
    end_date: "",
    registration_start_date: "",
    registration_end_date: "",
    max_capacity: "",
    venue: "",
    event_category: "",
  });

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Auto-convert event_code to uppercase
    const finalValue = name === 'event_code' ? value.toUpperCase() : value;
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // --- VALIDATION LOGIC (UNCHANGED) ---
      const required = ['event_name', 'event_code', 'event_type', 'start_date', 'end_date', 'registration_start_date', 'registration_end_date'];
      for (const field of required) {
        if (!formData[field]) {
          alert(`${field.replace(/_/g, ' ')} is required`);
          setLoading(false);
          return;
        }
      }

      if (formData.event_type === 'PAID' && (!formData.price || parseFloat(formData.price) <= 0)) {
        alert('Price is required for paid events');
        setLoading(false);
        return;
      }

      const convertToISO = (dateString, fieldName) => {
        if (!dateString || dateString.trim() === '') {
          alert(`${fieldName} is required`);
          throw new Error(`${fieldName} is required`);
        }
        
        console.log(`Converting ${fieldName}:`, dateString);
        
        const date = new Date(dateString);
        console.log(`Date object for ${fieldName}:`, date, 'Valid:', !isNaN(date.getTime()));
        
        if (isNaN(date.getTime())) {
          alert(`Invalid date format for ${fieldName}. Value received: "${dateString}". Please re-select the date.`);
          throw new Error(`Invalid date format for ${fieldName}`);
        }
        
        return date.toISOString();
      };

      // Prepare payload with properly formatted dates
      const payload = {
        event_name: formData.event_name,
        event_code: formData.event_code,
        event_type: formData.event_type,
        description: formData.description || null,
        venue: formData.venue || null,
        event_category: formData.event_category || null,
        start_date: convertToISO(formData.start_date, 'Start Date'),
        end_date: convertToISO(formData.end_date, 'End Date'),
        registration_start_date: convertToISO(formData.registration_start_date, 'Registration Start Date'),
        registration_end_date: convertToISO(formData.registration_end_date, 'Registration End Date'),
        price: formData.event_type === 'PAID' && formData.price ? parseFloat(formData.price) : null,
        max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
      };

      console.log('Sending payload:', payload);
      const response = await api.post('/event-manager/events', payload);

      if (response.data?.success) {
        alert(response.data.message || 'Event created successfully!');
        router.push('/event-manager/events');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg || err.message).join('\n');
        alert(`Validation errors:\n${errorMessages}`);
      } else {
        alert(error.response?.data?.message || 'Failed to create event');
      }
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
        <EventManagerHeader managerName={localStorage.getItem("event_manager_name") || "Event Manager"} onLogout={handleLogout} />

        <main className="p-4 sm:p-6 md:ml-64 pt-20 sm:pt-24 pb-20 sm:pb-6">
          <div className="max-w-4xl mx-auto">
            
            {/* --- HEADER BLOCK (Sleek) --- */}
            <div className="mb-8">
              {/* <button
                onClick={() => router.back()}
                className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-primary transition-colors mb-4 group"
              >
                <span className="material-symbols-outlined text-lg group-hover:translate-x-[-2px] transition-transform">arrow_back</span>
                <span>Back to All Events</span>
              </button> */}
              <h1 className="text-3xl font-bold text-dark-text font-display">Create New Event</h1>
              <p className="text-base text-gray-700 mt-1">
                Centralize your event details and publishing settings.
              </p>
            </div>
            
            {/* --- MAIN FORM CARD (Elevated) --- */}
            <form onSubmit={handleSubmit} className="bg-card-background p-6 sm:p-8 rounded-[24px] border border-light-gray-border shadow-soft">
              
              {/* === 1. BASIC INFORMATION === */}
              <div className="pb-8 border-b border-light-gray-border mb-8">
                <h2 className="text-xl font-semibold text-dark-text mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">info</span> Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <StyledInput label="Event Name" required>
                    <input
                      type="text"
                      name="event_name"
                      value={formData.event_name}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="e.g., Annual Tech Summit 2025"
                    />
                  </StyledInput>

                  <StyledInput label="Event Code" required helperText="Must be unique (e.g., SUMMIT-25). Auto-converts to uppercase.">
                    <input
                      type="text"
                      name="event_code"
                      value={formData.event_code}
                      onChange={handleChange}
                      required
                      className={`${inputClass} uppercase`}
                      placeholder="e.g., ATS-2025"
                      pattern="[A-Z0-9_\-]+"
                      title="Only uppercase letters, numbers, hyphens and underscores"
                    />
                  </StyledInput>

                  <div className="md:col-span-2">
                    <StyledInput label="Short Description">
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          rows="4"
                          className={inputClass}
                          placeholder="Provide a compelling summary of your event."
                        />
                    </StyledInput>
                  </div>

                  <StyledInput label="Event Category">
                    <input
                      type="text"
                      name="event_category"
                      value={formData.event_category}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="e.g., Workshop, Conference, Webinar"
                    />
                  </StyledInput>

                  <StyledInput label="Venue">
                    <input
                      type="text"
                      name="venue"
                      value={formData.venue}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="e.g., SGT Auditorium, Online/Zoom"
                    />
                  </StyledInput>
                </div>
              </div>

              {/* === 2. PRICING & CAPACITY === */}
              <div className="pb-8 border-b border-light-gray-border mb-8">
                <h2 className="text-xl font-semibold text-dark-text mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">currency_rupee</span> Pricing & Capacity
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Event Type */}
                  <StyledInput label="Event Type" required>
                    <select
                      name="event_type"
                      value={formData.event_type}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      <option value="FREE">Free</option>
                      <option value="PAID">Paid</option>
                    </select>
                  </StyledInput>

                  {/* Price */}
                  <StyledInput label="Price (₹)" required={formData.event_type === 'PAID'}>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required={formData.event_type === 'PAID'}
                      min="1"
                      max="100000"
                      disabled={formData.event_type === 'FREE'}
                      className={`${inputClass} ${formData.event_type === 'FREE' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="Enter price"
                    />
                  </StyledInput>
                  
                  {/* Max Capacity */}
                  <StyledInput label="Max Capacity" helperText="Leave empty for unlimited participants.">
                    <input
                      type="number"
                      name="max_capacity"
                      value={formData.max_capacity}
                      onChange={handleChange}
                      min="1"
                      max="100000"
                      className={inputClass}
                      placeholder="e.g., 500"
                    />
                  </StyledInput>
                </div>
              </div>

              {/* === 3. DATES & TIMING === */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-dark-text mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">date_range</span> Event & Registration Dates
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Event Start */}
                  <StyledInput label="Event Start Date & Time" required>
                    <input
                      type="datetime-local"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </StyledInput>

                  {/* Event End */}
                  <StyledInput label="Event End Date & Time" required>
                    <input
                      type="datetime-local"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </StyledInput>
                  
                  {/* Registration Start */}
                  <StyledInput label="Registration Start Date" required>
                    <input
                      type="datetime-local"
                      name="registration_start_date"
                      value={formData.registration_start_date}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </StyledInput>

                  {/* Registration End */}
                  <StyledInput label="Registration End Date" required>
                    <input
                      type="datetime-local"
                      name="registration_end_date"
                      value={formData.registration_end_date}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </StyledInput>
                </div>
              </div>

              {/* --- SUBMIT BUTTONS (SGT Style) --- */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 border-t border-light-gray-border/50 mt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-lg focus:ring-4 focus:ring-primary/20"
                >
                  {loading ? (
                      <span className="flex items-center gap-2 justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                          Creating...
                      </span>
                  ) : (
                      "Create Event"
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>

        <EventManagerMobileNav />
      </div>
    </div>
  );
}