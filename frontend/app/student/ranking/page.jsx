"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useStudentAuth } from "@/hooks/useAuth";

import StudentSidebar from "@/components/student/StudentSidebar";
import StudentHeader from "@/components/student/StudentHeader";
import StudentMobileNav from "@/components/student/StudentMobileNav";

export default function RankingPage() {
  const { isAuthenticated, isChecking } = useStudentAuth();
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(true);
  const [stalls, setStalls] = useState([]);
  const [rankings, setRankings] = useState({});
  const [submittedRankings, setSubmittedRankings] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  // ------------------ FETCH DATA ------------------
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Check if already submitted
        try {
          const submittedRes = await api.get("/student/my-submitted-rank");
          if (submittedRes.data?.success) {
            setSubmittedRankings(submittedRes.data.data);
            setLoading(false);
            return;
          }
        } catch (err) {
          // Not submitted yet, continue to fetch stalls
        }

        // Fetch school stalls
        const res = await api.get("/student/my-school-stalls");
        if (res.data?.success) {
          setStalls(res.data.data.stalls || []);
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || "Failed to load stalls";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated && !isChecking) {
      fetchData();
    }
  }, [isAuthenticated, isChecking]);

  // ------------------ HANDLE RANKING SELECTION ------------------
  const handleRankSelect = (stallId, rank) => {
    setRankings((prev) => {
      const newRankings = { ...prev };
      
      // Remove rank from other stall if it was already assigned
      Object.keys(newRankings).forEach((id) => {
        if (newRankings[id] === rank && id !== stallId) {
          delete newRankings[id];
        }
      });
      
      // Toggle: if same rank selected, deselect
      if (newRankings[stallId] === rank) {
        delete newRankings[stallId];
      } else {
        newRankings[stallId] = rank;
      }
      
      return newRankings;
    });
  };

  // ------------------ SUBMIT RANKINGS ------------------
  const handleSubmit = async () => {
    const selectedRanks = Object.entries(rankings).map(([stall_id, rank]) => ({
      stall_id,
      rank: parseInt(rank)
    }));

    if (selectedRanks.length !== 3) {
      setError("Please select exactly 3 stalls with ranks 1, 2, and 3");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const ranks = selectedRanks.map(r => r.rank).sort();
    if (ranks.join(",") !== "1,2,3") {
      setError("You must select ranks 1, 2, and 3 (no duplicates)");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await api.post("/student/submit-school-ranking", {
        rankings: selectedRanks
      });

      if (res.data?.success) {
        setSubmittedRankings(res.data.data);
        setRankings({});
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to submit rankings";
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="bg-soft-background font-sans text-dark-text antialiased min-h-screen flex">
      {/* LEFT SIDEBAR */}
      <StudentSidebar onLogout={handleLogout} />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">
        {/* TOP HEADER */}
        <StudentHeader
          theme={theme}
          toggleTheme={toggleTheme}
          title="Stall Ranking"
          onLogout={handleLogout}
        />

        {/* BODY CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 pb-32 sm:p-6 lg:p-8 lg:pb-10">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* HERO SECTION */}
            <section className="bg-blue-100 rounded-3xl overflow-hidden shadow-soft border border-blue-200">
              <div className="p-8 flex flex-col items-center gap-5">
                <div className="flex w-16 h-16 items-center justify-center rounded-full bg-white ring-1 ring-blue-200">
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontSize: "48px", fontVariationSettings: "'FILL' 1, 'wght' 500" }}
                  >
                    emoji_events
                  </span>
                </div>
                <h2 className="font-display text-3xl font-bold tracking-[-0.02em] text-center text-gray-800">
                  Rank Your School's Stalls
                </h2>
                <p className="text-gray-600 text-center">
                  Below are the stalls from YOUR SCHOOL that you have already given feedback to
                </p>
              </div>
            </section>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : submittedRankings ? (
              /* ALREADY SUBMITTED VIEW */
              <div className="bg-card-background border border-light-gray-border rounded-2xl p-8 shadow-soft">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-5xl">check_circle</span>
                  </div>
                  <h3 className="text-2xl font-bold">Rankings Submitted!</h3>
                  <p className="text-gray-700 text-center">
                    Your rankings have been recorded and cannot be changed.
                  </p>
                  
                  <div className="w-full max-w-2xl mt-6 space-y-4">
                    {submittedRankings.rankings?.map((r, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 p-4 bg-accent/10 rounded-xl border border-accent/30"
                      >
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent text-white font-bold text-xl">
                          {r.rank}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{r.stall_name}</h4>
                          <p className="text-sm text-gray-700">Stall #{r.stall_number}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-sm text-gray-700 mt-4">
                    Submitted at: {new Date(submittedRankings.submitted_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* ERROR MESSAGE - Not enough feedbacks */}
                {error && error.includes("feedback") && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-yellow-600 text-4xl">rate_review</span>
                      </div>
                      <h3 className="text-xl font-bold text-yellow-700">Feedback Required</h3>
                      <p className="text-yellow-600 text-center">{error}</p>
                      <button
                        onClick={() => router.push("/student/feedback")}
                        className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-xl hover:bg-yellow-600 transition"
                      >
                        Give Feedback to Stalls
                      </button>
                    </div>
                  </div>
                )}

                {/* OTHER ERROR MESSAGE */}
                {error && !error.includes("feedback") && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-600 text-center">{error}</p>
                  </div>
                )}

                {/* INSTRUCTIONS - Only show if no error */}
                {!error && (
                <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary text-3xl">info</span>
                    <div>
                      <h4 className="font-semibold text-dark-text mb-2">Instructions</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Below stalls are ONLY from YOUR SCHOOL and you have already given feedback to them</li>
                        <li>• Select exactly 3 stalls to rank</li>
                        <li>• Assign ranks: 1 (best), 2 (second), 3 (third)</li>
                        <li>• This is a ONE-TIME submission and cannot be changed</li>
                      </ul>
                    </div>
                  </div>
                </div>
                )}

                {/* STALL COUNT INFO */}
                {!error && stalls.length > 0 && (
                  <div className="bg-accent/10 border border-accent/30 rounded-xl p-4">
                    <p className="text-center font-semibold text-dark-text">
                      📊 You have given feedback to <span className="text-accent text-lg">{stalls.length}</span> stall{stalls.length !== 1 ? 's' : ''} from your school
                    </p>
                    <p className="text-center text-sm text-gray-700 mt-1">
                      Select your top 3 favorites from these stalls
                    </p>
                  </div>
                )}

                {/* STALLS GRID - Only show if no error */}
                {!error && stalls.length > 0 && (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stalls.map((stall) => {
                    const selectedRank = rankings[stall.stall_id];
                    return (
                      <div
                        key={stall.stall_id}
                        className={`bg-card-background border-2 rounded-2xl p-6 shadow-soft transition-all ${
                          selectedRank
                            ? "border-accent bg-accent/10"
                            : "border-light-gray-border hover:border-primary/50"
                        }`}
                      >
                        <div className="mb-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-xl font-bold">{stall.stall_name}</h3>
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-semibold whitespace-nowrap">
                              ✓ Reviewed
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            Stall #{stall.stall_number}
                          </p>
                          {stall.description && (
                            <p className="text-sm text-gray-700 mt-2 line-clamp-2">{stall.description}</p>
                          )}
                        </div>

                        {/* RANK BUTTONS */}
                        <div className="flex gap-2">
                          {[1, 2, 3].map((rank) => (
                            <button
                              key={rank}
                              onClick={() => handleRankSelect(stall.stall_id, rank)}
                              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition ${
                                selectedRank === rank
                                  ? "bg-accent text-white shadow-md"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              Rank {rank}
                            </button>
                          ))}
                        </div>

                        {selectedRank && (
                          <div className="mt-3 text-center">
                            <span className="text-sm font-semibold text-accent">
                              Selected as Rank {selectedRank}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* SUBMIT BUTTON */}
                <div className="flex justify-center">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || Object.keys(rankings).length !== 3}
                    className={`px-8 py-4 rounded-xl font-semibold text-white transition shadow-md ${
                      Object.keys(rankings).length === 3 && !submitting
                        ? "bg-primary hover:bg-primary-dark"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {submitting ? "Submitting..." : "Submit Rankings"}
                  </button>
                </div>

                {/* SELECTION SUMMARY */}
                {Object.keys(rankings).length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-center text-sm text-gray-700">
                      Selected: {Object.keys(rankings).length} / 3 stalls
                    </p>
                  </div>
                )}
                </>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* MOBILE NAV */}
      <StudentMobileNav />
    </div>
  );
}

