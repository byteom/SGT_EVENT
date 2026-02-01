"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useStudentAuth } from "@/hooks/useAuth";

import StudentSidebar from "@/components/student/StudentSidebar";
import StudentHeader from "@/components/student/StudentHeader";
import StudentMobileNav from "@/components/student/StudentMobileNav";

export default function FeedbackPage() {
  const { isAuthenticated, isChecking } = useStudentAuth();
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [scanning, setScanning] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [transitioningToRate, setTransitioningToRate] = useState(false);
  const [scannedStall, setScannedStall] = useState(null);
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

  // ------------------ QR SCANNER ------------------
  useEffect(() => {
    if (!scanning) return;

    let scanner;
    let video;

    async function loadScanner() {
      try {
        const QrScanner = (await import("qr-scanner")).default;
        video = document.getElementById("qr-video");
        setScannerLoading(true);

        scanner = new QrScanner(
          video,
          async (result) => {
            try {
              const stall_qr_token = result.data;
              
              // Call backend to scan stall
              const res = await api.post("/student/scan-stall", {
                stall_qr_token: stall_qr_token
              });

              if (res.data?.success) {
                const stallData = res.data.data;
                setScannedStall(stallData);
                setScanning(false);
                setTransitioningToRate(true);
                setScannerLoading(false);
                scanner.stop();
                
                // Navigate to feedback rate page with stall info
                router.push(`/student/feedback-rate?stallId=${stallData.stall.id}`);
              }
            } catch (err) {
              const errorMsg = err.response?.data?.message || "Invalid QR code or you must be checked in";
              setError(errorMsg);
              setTimeout(() => setError(""), 3000);
            }
          },
          { returnDetailedScanResult: true }
        );

        scanner.start();
        setScannerLoading(false);
      } catch (err) {
        console.error("Scanner error:", err);
        setError("Failed to load camera");
        setScanning(false);
        setScannerLoading(false);
      }
    }

    loadScanner();

    return () => {
      if (scanner) scanner.stop();
      setScannerLoading(false);
    };
  }, [scanning, router]);

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
          title="Stall Feedback"
          onLogout={handleLogout}
        />

        {/* BODY CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 pb-32 sm:p-6 lg:p-8 lg:pb-10">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* HERO SECTION */}
            <section className="relative flex flex-col items-stretch justify-start rounded-3xl overflow-hidden shadow-soft text-white">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                }}
              ></div>
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at top right, rgba(255,255,255,0.2), transparent 50%), radial-gradient(circle at bottom left, rgba(236,201,75,0.15), transparent 60%)",
                }}
              />
              <div className="relative p-8 flex flex-col items-center gap-5">
                <div className="flex w-16 h-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
                <span
                    className="material-symbols-outlined text-accent"
                    style={{ fontSize: "48px", fontVariationSettings: "'FILL' 1, 'wght' 500" }}
                  >
                    rate_review
                  </span>
                </div>
                <h2 className="font-display text-3xl font-bold tracking-[-0.02em] text-center">
                  Scan Stall QR Code
                </h2>
                <p className="text-white/80 text-center">
                  Scan a stall's QR code to provide feedback
                </p>
              </div>
            </section>

            {/* SCAN SECTION */}
            <div className="bg-card-background border border-light-gray-border rounded-2xl p-8 shadow-soft">
              {!scanning ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="w-36 h-36 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-7xl">qr_code_scanner</span>
                  </div>
                  <h3 className="text-2xl font-bold">Ready to Scan</h3>
                  <p className="text-gray-700 text-center">
                    Click the button below to start scanning a stall's QR code
                  </p>
                  <button
                    onClick={() => {
                      setScanning(true);
                      setScannerLoading(true);
                      setTransitioningToRate(false);
                      setError("");
                    }}
                    className="px-8 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition shadow-md"
                  >
                    Start Scanning
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                    <div className="w-full max-w-md bg-card-background p-4 rounded-2xl shadow-md border border-light-gray-border relative">
                    {scannerLoading && (
                        <div className="absolute inset-0 bg-white/80 rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-700">
                          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-sm text-gray-550">Opening camera…</p>
                        </div>
                      )}
                      <video id="qr-video" className="w-full rounded-xl" />
                  </div>
                  {error && (
                    <div className="w-full max-w-md bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-600 text-center">{error}</p>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setScanning(false);
                      setScannerLoading(false);
                      setTransitioningToRate(false);
                      setError("");
                    }}
                    className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition"
                  >
                    Cancel Scanning
                  </button>
                  <p className="text-sm text-gray-700 text-center">
                    Point your camera at the stall's QR code
                  </p>
                </div>
              )}
            </div>

            {/* INFO SECTION */}
            <div className="bg-accent/10 border border-accent/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-accent text-3xl">info</span>
                <div>
                  <h4 className="font-semibold text-dark-text mb-2">Important Notes</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• You must be checked in at the event to scan stalls</li>
                    <li>• Each stall can only receive one feedback from you</li>
                    <li>• Rating should be between 1 and 5 stars</li>
                    <li>• You can submit feedback for up to 200 stalls</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
          {transitioningToRate && (
            <div className="fixed inset-0 bg-white/80 z-40 flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-700 font-semibold">Opening feedback form…</p>
            </div>
          )}
        </main>
      </div>

      {/* MOBILE NAV */}
      <StudentMobileNav />
    </div>
  );
}

