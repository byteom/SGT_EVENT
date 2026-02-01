"use client";

import { useRouter } from "next/navigation";
import { useStudentAuth } from "@/hooks/useAuth";

export default function FeedbackSuccess() {
  const { isAuthenticated, isChecking } = useStudentAuth();
  const router = useRouter();

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-soft-background text-center">

      <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center mb-6 shadow-md">
        <span className="material-symbols-outlined text-green-600 text-6xl">
          check_circle
        </span>
      </div>

      <h1 className="text-3xl font-bold mb-2 text-dark-text">
        Feedback Submitted!
      </h1>

      <p className="text-gray-700 mb-6">
        Thank you for sharing your experience.
      </p>

      <button
        onClick={() => router.push("/student")}
        className="px-8 py-3 bg-primary text-white rounded-xl"
      >
        Back to Home
      </button>
    </div>
  );
}
