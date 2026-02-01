"use client";

import { useState, useEffect } from "react";
import EventManagerSidebar from "@/components/event-manager/EventManagerSidebar";
import EventManagerHeader from "@/components/event-manager/EventManagerHeader";
import EventManagerMobileNav from "@/components/event-manager/EventManagerMobileNav";
import api from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { useEventManagerAuth } from "@/hooks/useAuth";

export default function EditEventPage() {
  const { isAuthenticated, isChecking } = useEventManagerAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [event, setEvent] = useState(null);

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

  useEffect(() => {
    if (!isChecking && isAuthenticated && eventId) {
      fetchEventDetails();
    }
  }, [isChecking, isAuthenticated, eventId]);

  if (isChecking || loading) {
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

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/event-manager/events/${eventId}`);

      if (response.data?.success) {
        const eventData = response.data.data.event;
        setEvent(eventData);

        // Check if event can be edited - only DRAFT and PENDING_APPROVAL are editable
        if (!['DRAFT', 'PENDING_APPROVAL'].includes(eventData.status)) {
          alert(`Cannot edit event with status: ${eventData.status}. Only DRAFT and PENDING_APPROVAL events can be edited.`);
          router.push(`/event-manager/events/${eventId}`);
          return;
        }

        // Convert ISO dates to datetime-local format
        const toDatetimeLocal = (isoString) => {
          if (!isoString) return "";
          const date = new Date(isoString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        setFormData({
          event_name: eventData.event_name || "",
          event_code: eventData.event_code || "",
          description: eventData.description || "",
          event_type: eventData.event_type || "FREE",
          price: eventData.price || "",
          start_date: toDatetimeLocal(eventData.start_date),
          end_date: toDatetimeLocal(eventData.end_date),
          registration_start_date: toDatetimeLocal(eventData.registration_start_date),
          registration_end_date: toDatetimeLocal(eventData.registration_end_date),
          max_capacity: eventData.max_capacity || "",
          venue: eventData.venue || "",
          event_category: eventData.event_category || "",
        });
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      alert(error.response?.data?.message || 'Failed to load event');
      router.push('/event-manager/events');
    } finally {
      setLoading(false);
    }
  };

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
    setSubmitting(true);

    try {
      // Validate required fields
      const required = ['event_name', 'event_code', 'event_type', 'start_date', 'end_date', 'registration_start_date', 'registration_end_date'];
      for (const field of required) {
        if (!formData[field]) {
          alert(`${field.replace(/_/g, ' ')} is required`);
          setSubmitting(false);
          return;
        }
      }

      // Validate price for paid events
      if (formData.event_type === 'PAID' && (!formData.price || parseFloat(formData.price) <= 0)) {
        alert('Price is required for paid events');
        setSubmitting(false);
        return;
      }

      // Helper function to safely convert date from datetime-local format
      const convertToISO = (dateString, fieldName) => {
        if (!dateString || dateString.trim() === '') {
          alert(`${fieldName} is required`);
          throw new Error(`${fieldName} is required`);
        }

        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
          alert(`Invalid date format for ${fieldName}. Please re-select the date.`);
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

      console.log('Sending update payload:', payload);
      const response = await api.put(`/event-manager/events/${eventId}`, payload);

      if (response.data?.success) {
        alert(response.data.message || 'Event updated successfully!');
        router.push(`/event-manager/events/${eventId}`);
      }
    } catch (error) {
      console.error('Error updating event:', error);
      console.error('Error response:', error.response?.data);

      // Show detailed validation errors if available
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg || err.message).join('\n');
        alert(`Validation errors:\n${errorMessages}`);
      } else {
        alert(error.response?.data?.message || 'Failed to update event');
      }
    } finally {
      setSubmitting(false);
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

        <main className="p-4 sm:p-6 md:ml-64 pt-16 sm:pt-20 pb-20 sm:pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => router.push(`/event-manager/events/${eventId}`)}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary mb-4"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                <span>Back to Event Details</span>
              </button>
              <h1 className="text-2xl font-bold text-dark-text">Edit Event</h1>
              <p className="text-sm text-gray-700 mt-1">
                Update your event details
              </p>
            </div>

            {/* Status Warning */}
            {event && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-600 text-xl mt-0.5">info</span>
                  <div>
                    <p className="text-sm text-blue-800">
                      <strong>Current Status:</strong> {event.status.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Only DRAFT and PENDING_APPROVAL events can be edited. Once approved or active, events cannot be modified.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-card-background p-6 rounded-xl border border-light-gray-border shadow-soft">
              {/* Basic Information */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-dark-text mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="event_name"
                      value={formData.event_name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                      placeholder="Enter event name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="event_code"
                      value={formData.event_code}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600 uppercase"
                      placeholder="EVENT-2024"
                      pattern="[A-Z0-9_\-]+"
                      title="Only uppercase letters, numbers, hyphens and underscores"
                    />
                    <p className="text-xs text-gray-700 mt-1">Use uppercase letters, numbers, hyphens, and underscores</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                      placeholder="Describe your event"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Category
                    </label>
                    <input
                      type="text"
                      name="event_category"
                      value={formData.event_category}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                      placeholder="Workshop, Conference, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venue
                    </label>
                    <input
                      type="text"
                      name="venue"
                      value={formData.venue}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                      placeholder="Event venue"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-dark-text mb-4">Pricing</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="event_type"
                      value={formData.event_type}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="FREE">Free</option>
                      <option value="PAID">Paid</option>
                    </select>
                  </div>

                  {formData.event_type === 'PAID' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required={formData.event_type === 'PAID'}
                        min="1"
                        max="100000"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                        placeholder="Enter price"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Capacity
                    </label>
                    <input
                      type="number"
                      name="max_capacity"
                      value={formData.max_capacity}
                      onChange={handleChange}
                      min="1"
                      max="100000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-dark-text mb-4">Event Dates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Start <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="registration_start_date"
                      value={formData.registration_start_date}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration End <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="registration_end_date"
                      value={formData.registration_end_date}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push(`/event-manager/events/${eventId}`)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Updating..." : "Update Event"}
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
