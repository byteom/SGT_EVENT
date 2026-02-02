"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import { useStudentAuth } from "@/hooks/useAuth";
import StudentSidebar from "@/components/student/StudentSidebar";
import StudentHeader from "@/components/student/StudentHeader";
import StudentMobileNav from "@/components/student/StudentMobileNav";

export default function StudentEventDetailPage() {
  const { isAuthenticated, isChecking } = useStudentAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id;

  const [theme, setTheme] = useState("light");
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  useEffect(() => {
    if (!isChecking && isAuthenticated && eventId) {
      fetchEventDetails();
    }
  }, [isChecking, isAuthenticated, eventId]);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/student/events/${eventId}`);

      if (response.data?.success) {
        setEvent(response.data.data?.event || null);
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
      alert(error.response?.data?.message || "Failed to load event details");
      router.push("/student/events");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterFree = async () => {
    if (!confirm("Register for this free event?")) return;

    try {
      setRegistering(true);
      const response = await api.post(`/student/events/${eventId}/register`);

      if (response.data?.success) {
        alert(response.data.message || "Registration successful!");
        router.push("/student/my-events");
      }
    } catch (error) {
      console.error("Error registering for event:", error);
      alert(error.response?.data?.message || "Failed to register");
    } finally {
      setRegistering(false);
    }
  };

  const handleInitiatePayment = async () => {
    try {
      setRegistering(true);
      console.log("Initiating payment for event:", eventId);
      
      const response = await api.post(`/student/events/${eventId}/payment/initiate`);
      console.log("Payment initiate response:", response.data);

      if (response.data?.success) {
        const paymentData = response.data.data;
        console.log("Payment data:", paymentData);

        // Check if Razorpay is loaded
        if (typeof window.Razorpay === "undefined") {
          alert("Payment gateway not loaded. Please refresh the page and try again.");
          return;
        }

        // Initialize Razorpay
        const options = {
          key: paymentData.razorpay_key,
          amount: paymentData.order.amount * 100, // Razorpay expects amount in paise
          currency: paymentData.order.currency,
          name: "SGT Event Portal",
          description: paymentData.event?.name || event.event_name,
          order_id: paymentData.order.order_id,
          handler: async (razorpayResponse) => {
            // Verify payment
            try {
              console.log("🎉 Payment handler called!");
              console.log("📋 Razorpay response:", razorpayResponse);

              // Show processing message
              setRegistering(true);

              // Try to verify via backend endpoint
              try {
                console.log("📤 Sending verify request...");
                const verifyRes = await api.post(`/student/events/${eventId}/payment/verify`, {
                  razorpay_order_id: razorpayResponse.razorpay_order_id,
                  razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                  razorpay_signature: razorpayResponse.razorpay_signature,
                });

                console.log("✅ Verify response:", verifyRes.data);

                if (verifyRes.data?.success) {
                  setRegistering(false);
                  alert("✅ Payment successful! Registration complete.");
                  console.log("🚀 Redirecting to my-events...");
                  router.push("/student/my-events");
                  return;
                }
              } catch (verifyError) {
                console.log("❌ Verify endpoint error:", verifyError);
                console.log("❌ Error status:", verifyError.response?.status);

                // If verify endpoint returns 404, payment might be processed via webhook
                if (verifyError.response?.status === 404) {
                  console.log("⏳ Verify endpoint not available, checking registration status...");

                  // Wait a bit for webhook to process
                  await new Promise(resolve => setTimeout(resolve, 2000));

                  // Poll the event details to check if registration succeeded
                  let attempts = 0;
                  const maxAttempts = 5;

                  while (attempts < maxAttempts) {
                    try {
                      const eventCheck = await api.get(`/student/events/${eventId}`);
                      if (eventCheck.data?.success && eventCheck.data.data?.event?.is_registered) {
                        setRegistering(false);
                        alert("✅ Payment successful! Registration complete.");
                        router.push("/student/my-events");
                        return;
                      }
                      // Wait before next attempt
                      await new Promise(resolve => setTimeout(resolve, 2000));
                      attempts++;
                    } catch (pollError) {
                      console.error("Error polling registration status:", pollError);
                      attempts++;
                      await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                  }

                  // After polling, show success message with instruction
                  setRegistering(false);
                  alert("✅ Payment successful! Please check 'My Events' to confirm your registration.");
                  router.push("/student/my-events");
                  return;
                }

                // For other errors, show error message
                throw verifyError;
              }
            } catch (finalError) {
              console.error("Payment verification error:", finalError);
              setRegistering(false);
              alert("❌ " + (finalError.response?.data?.message || "Payment verification failed. If payment was deducted, please check 'My Events' or contact support."));
            }
          },
          prefill: {
            name: paymentData.student?.name || localStorage.getItem("student_name") || "",
            email: paymentData.student?.email || localStorage.getItem("student_email") || "",
            contact: paymentData.student?.contact || "",
          },
          theme: {
            color: "#2563eb",
          },
          modal: {
            ondismiss: function() {
              console.log("⚠️ Payment modal closed/dismissed by user");
              setRegistering(false);
              // Check if payment was successful by refreshing the event details
              fetchEventDetails();
            },
            confirm_close: true,
            escape: false,
          },
        };

        console.log("🚀 Opening Razorpay checkout with options:", options);
        const razorpay = new window.Razorpay(options);
        
        razorpay.on('payment.failed', function(response) {
          console.log("❌ Payment failed:", response.error);
          alert("Payment failed: " + response.error.description);
          setRegistering(false);
        });
        
        console.log("🔓 Calling razorpay.open()");
        razorpay.open();
        console.log("✅ Razorpay modal should be visible now");
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage = error.response?.data?.message || "Failed to initiate payment. Please try again.";
      alert(errorMessage);
    } finally {
      setRegistering(false);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const isRegistrationOpen = () => {
    if (!event) return false;
    const now = new Date();
    const regStart = new Date(event.registration_start_date);
    const regEnd = new Date(event.registration_end_date);
    return now >= regStart && now <= regEnd;
  };

  const isEventFull = () => {
    if (!event) return false;
    // If max_capacity is null, event has unlimited spots
    if (event.max_capacity === null || event.max_capacity === undefined) return false;
    // Check is_full flag from backend or calculate
    return event.is_full || (event.current_registrations >= event.max_capacity);
  };

  const getAvailableSpots = () => {
    if (!event) return null;
    if (event.max_capacity === null || event.max_capacity === undefined) return null;
    return Math.max(0, event.max_capacity - (event.current_registrations || 0));
  };

  return (
    <div className="bg-soft-background font-sans text-dark-text antialiased min-h-screen flex">
      <StudentSidebar onLogout={handleLogout} />

      <div className="flex-1 flex flex-col">
        <StudentHeader theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-4 pb-32 sm:p-6 lg:p-8 lg:pb-10">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span>Back to Events</span>
            </button>

            {event && (
              <>
                {/* Event Header Card */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold text-dark-text mb-2">{event.event_name}</h1>
                      <p className="text-sm text-gray-700">{event.event_code}</p>
                    </div>
                    <span className={`text-sm px-4 py-2 rounded-full font-medium ${
                      event.event_type === "FREE"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {event.event_type === "FREE" ? "Free Event" : `₹${event.price}`}
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-gray-700 mb-4">{event.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem icon="calendar_today" label="Event Date" value={`${formatDate(event.start_date)} - ${formatDate(event.end_date)}`} />
                    <InfoItem icon="location_on" label="Venue" value={event.venue || "Not specified"} />
                    <InfoItem icon="category" label="Category" value={event.event_category || "General"} />
                    <InfoItem icon="groups" label="Capacity" value={event.max_capacity ? `${event.max_capacity} attendees` : "Unlimited"} />
                  </div>
                </div>

                {/* Registration Info Card */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h2 className="text-lg font-semibold text-dark-text mb-4">Registration Information</h2>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="material-symbols-outlined text-primary">event_available</span>
                      <span className="text-gray-700">
                        Registration Opens: <strong>{formatDate(event.registration_start_date)}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="material-symbols-outlined text-red-600">event_busy</span>
                      <span className="text-gray-700">
                        Registration Closes: <strong>{formatDate(event.registration_end_date)}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="material-symbols-outlined text-green-600">confirmation_number</span>
                      <span className="text-gray-700">
                        Available Spots: <strong>
                          {getAvailableSpots() === null 
                            ? "Unlimited" 
                            : getAvailableSpots() > 0 
                              ? getAvailableSpots() 
                              : "Event Full"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Registration Status Banner */}
                  {!isRegistrationOpen() && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                      <p className="text-sm text-yellow-800">
                        {new Date() < new Date(event.registration_start_date)
                          ? "Registration has not opened yet."
                          : "Registration has closed."}
                      </p>
                    </div>
                  )}

                  {isEventFull() && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                      <p className="text-sm text-red-800">
                        This event has reached maximum capacity.
                      </p>
                    </div>
                  )}

                  {event.is_registered && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-green-600">check_circle</span>
                        <span className="text-sm text-green-800 font-medium">
                          You are already registered for this event
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Register Button */}
                  {!event.is_registered && isRegistrationOpen() && !isEventFull() && (
                    <button
                      onClick={event.event_type === "FREE" ? handleRegisterFree : handleInitiatePayment}
                      disabled={registering}
                      className="w-full px-6 py-3 bg-blue-100 text-primary border border-blue-200 rounded-lg hover:bg-blue-200 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {registering ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">how_to_reg</span>
                          <span>{event.event_type === "FREE" ? "Register Now" : `Pay ₹${event.price} & Register`}</span>
                        </>
                      )}
                    </button>
                  )}

                  {event.is_registered && (
                    <button
                      onClick={() => router.push("/student/my-events")}
                      className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                    >
                      View My Registrations
                    </button>
                  )}
                </div>
              </>
            )}

          </div>
        </main>

        <StudentMobileNav />
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="material-symbols-outlined text-primary text-xl mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-700">{label}</p>
        <p className="text-sm text-dark-text font-medium">{value}</p>
      </div>
    </div>
  );
}
