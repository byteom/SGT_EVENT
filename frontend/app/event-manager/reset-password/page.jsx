"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";

/**
 * Event Manager Password Reset Flow - Step 2: Reset Password
 */
export default function EventManagerResetPasswordPage() {
  const [formData, setFormData] = useState({
    new_password: "",
    confirm_password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if user has completed step 1
    const resetToken = localStorage.getItem("em_reset_token");
    if (!resetToken) {
      window.location.href = "/event-manager/forgot-password";
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.new_password !== formData.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    if (formData.new_password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const resetToken = localStorage.getItem("em_reset_token");
      const response = await api.post("/event-manager/reset-password", {
        reset_token: resetToken,
        new_password: formData.new_password
      });

      if (response.data?.success) {
        setSuccess(true);
        // Clear reset token
        localStorage.removeItem("em_reset_token");
        localStorage.removeItem("em_reset_phone");

        // Redirect after 2 seconds
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else {
        setError(response.data?.message || "Failed to reset password");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-soft-background flex items-center justify-center p-4">
        <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
          </div>
          <h2 className="text-2xl font-bold text-dark-text mb-2">Password Reset Successful!</h2>
          <p className="text-gray-700 mb-4">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-background flex items-center justify-center p-4">
      <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-4xl">vpn_key</span>
          </div>
          <h1 className="text-2xl font-bold text-dark-text mb-2">Create New Password</h1>
          <p className="text-gray-700 text-sm">Enter your new password below</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              New Password *
            </label>
            <input
              type="password"
              required
              value={formData.new_password}
              onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              className="w-full px-4 py-3 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter new password"
              minLength={6}
            />
            <p className="text-xs text-gray-700 mt-1">Minimum 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              required
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              className="w-full px-4 py-3 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/event-manager/forgot-password" className="text-primary text-sm hover:underline">
            Back to Verification
          </Link>
        </div>
      </div>
    </div>
  );
}
