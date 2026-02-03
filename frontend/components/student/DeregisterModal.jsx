"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

/**
 * Deregister Modal Component for Students
 * Shows refund info for paid events and handles cancellation
 */
export default function DeregisterModal({ registration, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cancellation preview when modal opens
  useEffect(() => {
    if (registration?.event_id) {
      fetchCancellationPreview();
    }
  }, [registration]);

  const fetchCancellationPreview = async () => {
    setLoadingPreview(true);
    setError(null);
    try {
      // Call deregister without confirm_cancel to get preview
      const response = await api.post(
        `/student/events/${registration.event_id}/deregister`,
        { confirm_cancel: false }
      );

      if (response.data?.success) {
        setPreviewData(response.data.data);
      }
    } catch (err) {
      console.error("Preview error:", err);
      setError(err.response?.data?.message || "Failed to load cancellation details");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDeregister = async () => {
    const refundMsg = previewData?.refund_info 
      ? `\n\nRefund: ₹${previewData.refund_info.refund_amount} (${previewData.refund_info.refund_percent}%)`
      : '';
    
    if (!confirm(`Are you sure you want to cancel your registration for "${registration?.event_name}"?${refundMsg}\n\nThis action cannot be undone. You will need to pay again if you want to re-register.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        `/student/events/${registration.event_id}/deregister`,
        { confirm_cancel: true }
      );

      if (response.data?.success) {
        const data = response.data.data;
        
        // Show success message with refund info
        if (data.refund_info && data.refund_info.refund_amount > 0) {
          alert(`✅ Registration cancelled!\n\n💰 Refund: ₹${data.refund_info.refund_amount}\n📅 The refund will be processed within 5-7 business days.`);
        } else {
          alert("✅ Registration cancelled successfully!");
        }
        
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(response.data?.message || "Failed to cancel registration");
      }
    } catch (err) {
      console.error("Deregister error:", err);
      alert(err.response?.data?.message || "Failed to cancel registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft max-w-md w-full max-h-[90vh] overflow-y-auto">
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
              {registration?.registration_number && (
                <p>Registration No: <span className="font-medium">{registration.registration_number}</span></p>
              )}
              {registration?.registration_date && (
                <p>Registered on: {new Date(registration.registration_date).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loadingPreview && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <p className="text-sm text-gray-700">Loading cancellation details...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-red-600">error</span>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Preview Data - Refund Information */}
          {previewData && !loadingPreview && (
            <>
              {previewData.is_paid_event && previewData.refund_info ? (
                <div className={`rounded-lg p-4 ${previewData.refund_info.refund_amount > 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <div className="flex items-start gap-3">
                    <span className={`material-symbols-outlined ${previewData.refund_info.refund_amount > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {previewData.refund_info.refund_amount > 0 ? 'payments' : 'info'}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-medium text-dark-text mb-2">Refund Information</h4>
                      
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-700">
                          Amount Paid: <span className="font-medium">₹{previewData.refund_info.paid_amount}</span>
                        </p>
                        
                        {previewData.refund_info.refund_amount > 0 ? (
                          <>
                            <p className="text-2xl font-bold text-green-600">
                              Refund: ₹{previewData.refund_info.refund_amount}
                            </p>
                            <p className="text-xs text-gray-600">
                              ({previewData.refund_info.refund_percent}% - {previewData.refund_info.refund_reason})
                            </p>
                          </>
                        ) : (
                          <div className="bg-yellow-100 rounded p-2 mt-2">
                            <p className="text-sm text-yellow-800 font-medium">
                              ⚠️ No Refund Available
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">
                              {previewData.refund_info.refund_reason}
                            </p>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-2">
                          Days until event: {previewData.refund_info.days_until_event}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-600">info</span>
                    <p className="text-sm text-gray-700">
                      This is a free event. You can cancel without any charges.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-red-600">warning</span>
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Important</p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Once cancelled, you cannot undo this action</li>
                  <li>Your spot may be given to waitlisted students</li>
                  <li>To register again, you will need to pay the full registration fee</li>
                </ul>
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
            disabled={loading || loadingPreview || error}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Cancelling...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">cancel</span>
                Cancel Registration
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
