"use client";

import { useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

/**
 * Student Password Reset Flow - Step 1: Verify Credentials
 */
export default function StudentForgotPasswordPage() {
  const [formData, setFormData] = useState({
    registration_no: "",
    date_of_birth: "",
    pincode: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/student/verify-reset-credentials", formData);
      
      if (response.data?.success) {
        // Store verification token and redirect
        localStorage.setItem("reset_token", response.data.data.reset_token);
        localStorage.setItem("reset_reg_no", formData.registration_no);
        window.location.href = "/student/reset-password";
      } else {
        setError(response.data?.message || "Verification failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify credentials. Please check your information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-soft-background flex items-center justify-center p-4">
      <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-4xl">lock_reset</span>
          </div>
          <h1 className="text-2xl font-bold text-dark-text mb-2">Reset Password</h1>
          <p className="text-gray-700 text-sm">Enter your details to verify your identity</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              Registration Number *
            </label>
            <input
              type="text"
              required
              value={formData.registration_no}
              onChange={(e) => setFormData({ ...formData, registration_no: e.target.value })}
              className="w-full px-4 py-3 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your registration number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              Date of Birth *
            </label>
            <input
              type="date"
              required
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="w-full px-4 py-3 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              Pincode *
            </label>
            <input
              type="text"
              required
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              className="w-full px-4 py-3 border border-light-gray-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your pincode"
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-primary text-sm hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
