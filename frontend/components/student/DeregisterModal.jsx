"use client";

import { useState } from "react";
import api from "@/lib/api";

/**
 * Deregister Modal Component for Students
 * Handles event deregistration with refund calculation
 */
export default function DeregisterModal({ registration, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [refundInfo, setRefundInfo] = useState(null);
  const [loadingRefundInfo, setLoadingRefundInfo] = useState(false);

  // Fetch refund information when modal opens
  useState(() => {
    if (registration?.event_id) {
      fetchRefundInfo();
    }
  }, [registration]);

  const fetchRefundInfo = async () => {
    setLoadingRefundInfo(true);
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/student/events/${registration.event_id}/refund-info`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        setRefundInfo(response.data.data);
      }
    } catch (error) {
      console.error("Refund info error:", error);
    } finally {
      setLoadingRefundInfo(false);
    }
  };

  const handleDeregister = async () => {
    if (!confirm("Are you sure you want to cancel this registration? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await api.post(
        `/student/events/${registration.event_id}/deregister`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success) {
        alert(`Registration cancelled successfully! ${refundInfo?.refund_eligible ? `Refund of ₹${refundInfo.refund_amount} will be processed.` : ""}`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(response.data?.message || "Failed to cancel registration");
      }
    } catch (error) {
      console.error("Deregister error:", error);
      alert(error.response?.data?.message || "Failed to cancel registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-light-gray-border">
          <h2 className="text-xl font-semibold text-dark-text">Cancel Registration</h2>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-dark-text p-2"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Event Info */}
          <div className="bg-soft-background rounded-lg p-4">
            <h3 className="font-semibold text-dark-text mb-2">{registration?.event_name}</h3>
            <div className="space-y-1 text-sm text-gray-700">
              <p>Registration No: <span className="font-medium">{registration?.registration_number}</span></p>
              <p>Registered on: {registration?.registration_date ? new Date(registration.registration_date).toLocaleDateString() : "—"}</p>
              {registration?.registration_fee > 0 && (
                <p>Registration Fee: <span className="font-medium">₹{registration.registration_fee}</span></p>
              )}
            </div>
          </div>

          {/* Refund Information */}
          {loadingRefundInfo ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <p className="text-sm text-gray-700">Calculating refund...</p>
              </div>
            </div>
          ) : refundInfo ? (
            <div className={`rounded-lg p-4 ${refundInfo.refund_eligible ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex items-start gap-3">
                <span className={`material-symbols-outlined ${refundInfo.refund_eligible ? 'text-green-600' : 'text-yellow-600'}`}>
                  {refundInfo.refund_eligible ? 'check_circle' : 'info'}
                </span>
                <div className="flex-1">
                  <h4 className="font-medium text-dark-text mb-1">Refund Information</h4>
                  {refundInfo.refund_eligible ? (
                    <>
                      <p className="text-sm text-gray-700 mb-2">
                        You are eligible for a refund of:
                      </p>
                      <p className="text-2xl font-bold text-green-600 mb-1">
                        ₹{refundInfo.refund_amount}
                      </p>
                      <p className="text-xs text-gray-700">
                        ({refundInfo.refund_percentage}% of registration fee)
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-700">
                      {refundInfo.message || "No refund available for this registration"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : registration?.registration_fee === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                This is a free event. You can cancel anytime without any charges.
              </p>
            </div>
          ) : null}

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-red-600">warning</span>
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Important</p>
                <p className="text-sm text-gray-700">
                  Once you cancel, you cannot re-register if the event is full. Your spot may be given to someone on the waitlist.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-light-gray-border">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 border border-light-gray-border rounded-lg hover:bg-gray-50 transition text-dark-text disabled:opacity-50"
          >
            Keep Registration
          </button>
          <button
            onClick={handleDeregister}
            disabled={loading}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Cancelling..." : "Cancel Registration"}
          </button>
        </div>
      </div>
    </div>
  );
}
