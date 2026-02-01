"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import api from "@/lib/api";
import { useStudentAuth } from "@/hooks/useAuth";

import StudentSidebar from "@/components/student/StudentSidebar";
import StudentHeader from "@/components/student/StudentHeader";
import StudentMobileNav from "@/components/student/StudentMobileNav";

function FeedbackRateContent() {
  const params = useSearchParams();
  const router = useRouter();

  const stallId = params.get("stallId");

  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(true);
  const [stallInfo, setStallInfo] = useState(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [navigatingBack, setNavigatingBack] = useState(false);
  const [error, setError] = useState("");

  // ------------------ THEME HANDLING ------------------
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
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

  // ------------------ LOAD STALL INFO ------------------
  useEffect(() => {
    if (!stallId) {
      router.push("/student/feedback");
      return;
    }

    // If we have stallId from URL, we need to get stall info
    // The backend scan-stall endpoint should have been called already
    // For now, we'll just proceed with the stallId
    setLoading(false);
  }, [stallId, router]);

  // ------------------ SUBMIT FEEDBACK ------------------
  async function submitFeedback() {
    if (!rating) {
      setError("Please select a rating (1-5 stars)");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!stallId) {
      setError("Stall ID is missing");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await api.post("/student/submit-feedback", {
        stall_id: stallId,
        rating: parseInt(rating),
        comment: comment || null,
      });

      if (res.data?.success) {
        router.push("/student/feedback-success");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to submit feedback";
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-dark-text mt-4">Loading stall information...</p>
        </div>
      </div>
    );
  }

  const ratingOptions = [1, 2, 3, 4, 5];

  return (
    <div className="bg-soft-background font-sans text-dark-text antialiased min-h-screen flex">
      {/* LEFT SIDEBAR */}
      <StudentSidebar onLogout={handleLogout} />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">
        {/* TOP HEADER */}
        <StudentHeader
          theme={theme}
          toggleTheme={toggleTheme}
          title="Rate This Stall"
          onLogout={handleLogout}
        />

        {/* BODY CONTENT */}
        <main className="relative flex-1 overflow-y-auto p-4 pb-32 sm:p-6 lg:p-8 lg:pb-10">
          {navigatingBack && (
            <div className="fixed inset-0 bg-white/80 z-50 flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-550 font-semibold">Taking you back to Feedback…</p>
            </div>
          )}
          <div className="max-w-5xl mx-auto space-y-8">
            {/* ERROR MESSAGE */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-soft">
                <p className="text-red-600 text-center">{error}</p>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              {/* MAIN CARD */}
              <div className="bg-card-background border border-light-gray-border rounded-3xl p-8 shadow-soft">
                <div className="flex flex-col gap-8">
                  <div className="text-center space-y-3">
                    <h1 className="text-3xl font-bold text-dark-text">Rate This Stall</h1>
                    <p className="text-gray-550">
                      Pick a score between 1 and 5 stars. Higher scores mean a better experience.
                    </p>
                  </div>

                  {/* STAR RATING */}
                  <div className="flex flex-wrap justify-center gap-3">
                    {ratingOptions.map((num) => (
                      <button
                        key={num}
                        onClick={() => setRating(num)}
                        className={`w-16 h-16 rounded-2xl font-semibold text-2xl transition-all active:scale-95 border ${
                          rating === num
                            ? "bg-primary text-white border-primary shadow-lg scale-105"
                            : "bg-white border-light-gray-border text-gray-550 hover:shadow-sm"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  {rating && (
                    <div className="text-center">
                      <p className="text-lg font-semibold text-primary">
                        You selected {rating} {rating === 1 ? "star" : "stars"}
                      </p>
                      <p className="text-sm text-gray-550 mt-2">Add a short note so stall owners know what to improve.</p>
                    </div>
                  )}

                  {/* COMMENT BOX */}
                  {rating && (
                    <div className="w-full">
                      <label className="block text-sm font-semibold mb-2 text-gray-550">
                        Comment (Optional)
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience about this stall..."
                        className="w-full p-4 border border-light-gray-border rounded-2xl bg-white text-dark-text placeholder:text-gray-700 resize-none focus:ring-2 focus:ring-primary focus:outline-none"
                        rows={4}
                      />
                    </div>
                  )}

                  {/* SUBMIT BUTTON */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={submitFeedback}
                      disabled={!rating || submitting}
                      className={`w-full px-8 py-4 rounded-2xl font-semibold text-white transition shadow-md ${
                        rating && !submitting
                          ? "bg-primary hover:bg-primary-dark"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {submitting ? "Submitting..." : "Submit Feedback"}
                    </button>

                    <button
                      onClick={() => {
                        setNavigatingBack(true);
                        router.push("/student/feedback");
                      }}
                      className="text-gray-550 hover:text-primary transition text-sm font-semibold disabled:opacity-60"
                      disabled={navigatingBack}
                    >
                      ← Back to Feedback
                    </button>
                  </div>
                </div>
              </div>

              {/* SIDE CARDS */}
              <div className="space-y-6">
                <div className="bg-card-background border border-light-gray-border rounded-3xl p-6 shadow-soft">
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary text-3xl">info</span>
                    <div>
                      <h4 className="font-semibold text-dark-text mb-2">Tips for better feedback</h4>
                      <ul className="text-sm text-gray-550 space-y-1 list-disc pl-4">
                        <li>Mention service, taste, cleanliness, or presentation.</li>
                        <li>Be honest but respectful—teams read every response.</li>
                        <li>Optional comments help organizers highlight top stalls.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-card-background border border-light-gray-border rounded-3xl p-5 text-center shadow-soft">
                  <p className="text-sm text-gray-550">
                    💡 Rating scale: 1 (Poor) · 5 (Excellent). You can only submit once per stall.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MOBILE NAV */}
      <StudentMobileNav />
    </div>
  );
}

export default function FeedbackRatePage() {
  const { isAuthenticated, isChecking } = useStudentAuth();

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
    <Suspense fallback={
      <div className="min-h-screen bg-soft-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-dark-text mt-4">Loading...</p>
        </div>
      </div>
    }>
      <FeedbackRateContent />
    </Suspense>
  );
}
