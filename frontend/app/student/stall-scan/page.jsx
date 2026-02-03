"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useStudentAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

import StudentSidebar from "@/components/student/StudentSidebar";
import StudentHeader from "@/components/student/StudentHeader";
import StudentMobileNav from "@/components/student/StudentMobileNav";

export default function StallScanPage() {
  // Add custom styles for centering the scanner video
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      #stall-qr-reader {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      #stall-qr-reader video {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        border-radius: 0 !important;
      }
      #stall-qr-reader__scan_region {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      #stall-qr-reader__dashboard_section_csr {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const { isAuthenticated, isChecking } = useStudentAuth();
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("initializing");
  const [cameras, setCameras] = useState([]);
  const [currentCameraId, setCurrentCameraId] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const html5QrRef = useRef(null);
  const mountedRef = useRef(true);
  const cleanupInProgressRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

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

  /* LOAD HTML5-QRCODE LIBRARY */
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  /* INITIALIZE CAMERAS */
  useEffect(() => {
    mountedRef.current = true;
    let initAttempted = false;

    const initCameras = async () => {
      if (initAttempted) return;
      initAttempted = true;

      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!mountedRef.current) return;

        console.log("🔧 Loading QR scanner library...");
        try {
          await loadScript("https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js");
        } catch (cdnErr) {
          console.warn("⚠️ Primary CDN failed, trying alternate...");
          await loadScript("https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js");
        }

        if (!mountedRef.current) return;
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!mountedRef.current) return;

        console.log("📷 Requesting camera permission...");
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error("❌ getUserMedia not supported");
          setError("Camera not supported on this browser. Please use Chrome, Safari, or Firefox.");
          setStatus("error");
          return;
        }
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: { ideal: "environment" } } 
          });
          stream.getTracks().forEach(track => track.stop());
          console.log("✅ Camera permission granted");
        } catch (permErr) {
          console.error("⚠️ Camera permission error:", {
            name: permErr.name,
            message: permErr.message
          });
          
          let errorMsg = "Camera permission denied. Please allow camera access.";
          if (permErr.name === "NotFoundError") {
            errorMsg = "No camera found on this device.";
          } else if (permErr.name === "NotAllowedError") {
            errorMsg = "Camera permission denied. Please allow camera access in browser settings.";
          } else if (permErr.name === "NotReadableError") {
            errorMsg = "Camera is being used by another app. Please close other apps and try again.";
          }
          
          setError(errorMsg);
          setStatus("error");
          return;
        }
        
        if (!mountedRef.current) return;
        
        console.log("📷 Getting available cameras...");
        const Html5Qrcode = window.Html5Qrcode;
        
        if (!Html5Qrcode) {
          throw new Error("Html5Qrcode library not loaded");
        }
        
        const availableCameras = await Html5Qrcode.getCameras();
        if (!mountedRef.current) return;

        if (!availableCameras || availableCameras.length === 0) {
          console.warn("⚠️ No cameras found");
          setError("No cameras found on this device");
          setStatus("error");
          return;
        }

        console.log("✅ Found", availableCameras.length, "camera(s)");
        availableCameras.forEach((cam, idx) => {
          console.log(`📷 Camera ${idx + 1}:`, cam.label, `(ID: ${cam.id})`);
        });
        
        setCameras(availableCameras);

        let selectedCamera = availableCameras.find(cam =>
          cam.label.toLowerCase().includes("back") ||
          cam.label.toLowerCase().includes("rear") ||
          cam.label.toLowerCase().includes("environment")
        );

        if (!selectedCamera) {
          selectedCamera = availableCameras[availableCameras.length - 1];
        }

        if (mountedRef.current) {
          setCurrentCameraId(selectedCamera.id);
          console.log("✅ Camera selected:", selectedCamera.label);
          console.log("🎥 Total cameras in state:", availableCameras.length);
        }

      } catch (err) {
        console.error("⚠️ Camera initialization failed:", {
          name: err?.name,
          message: err?.message
        });

        if (!mountedRef.current) return;

        console.log("🔄 Retrying camera initialization in 2s...");
        setError("Initializing camera...");
        setStatus("initializing");

        setTimeout(async () => {
          if (!mountedRef.current) return;

          try {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: { ideal: "environment" } } 
              });
              stream.getTracks().forEach(track => track.stop());
              console.log("✅ Camera permission granted on retry");
            } catch (permErr) {
              console.error("⚠️ Permission denied on retry:", permErr.name);
              let errorMsg = "Camera access denied.";
              if (permErr.name === "NotReadableError") {
                errorMsg = "Camera is busy. Close other apps using camera.";
              }
              setError(errorMsg);
              setStatus("error");
              return;
            }
            
            const Html5Qrcode = window.Html5Qrcode;
            if (!Html5Qrcode) {
              throw new Error("Library not loaded");
            }

            const availableCameras = await Html5Qrcode.getCameras();
            if (availableCameras && availableCameras.length > 0) {
              setCameras(availableCameras);

              let selectedCamera = availableCameras.find(cam =>
                cam.label.toLowerCase().includes("back") ||
                cam.label.toLowerCase().includes("rear") ||
                cam.label.toLowerCase().includes("environment")
              );

              if (!selectedCamera) {
                selectedCamera = availableCameras[availableCameras.length - 1];
              }

              if (mountedRef.current) {
                setCurrentCameraId(selectedCamera.id);
                setError(null);
                console.log("✅ Camera retry successful");
              }
            } else {
              setError("No cameras found on this device");
              setStatus("error");
            }
          } catch (retryErr) {
            console.error("⚠️ Camera retry failed:", {
              name: retryErr?.name,
              message: retryErr?.message
            });
            
            let errorMsg = "Camera initialization failed.";
            if (retryErr?.name === "NotFoundError") {
              errorMsg = "No camera detected. Please check device settings.";
            } else if (retryErr?.name === "NotReadableError") {
              errorMsg = "Camera is busy. Close other apps and refresh.";
            } else if (retryErr?.message?.includes("Library")) {
              errorMsg = "Scanner library failed to load. Check internet connection.";
            }
            
            setError(errorMsg);
            setStatus("error");
          }
        }, 2000);
      }
    };

    if (isAuthenticated && !isChecking) {
      initCameras();
    }

    return () => {
      console.log("🧹 Component unmounting");
      mountedRef.current = false;

      if (html5QrRef.current) {
        try {
          html5QrRef.current.stop().catch(() => {});
          html5QrRef.current.clear().catch(() => {});
        } catch (e) {}
        html5QrRef.current = null;
      }

      const videoElement = document.querySelector("#stall-qr-reader video");
      if (videoElement && videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => {
          try {
            track.stop();
          } catch (e) {}
        });
      }
    };
  }, [isAuthenticated, isChecking]);

  /* CLEANUP SCANNER */
  const cleanupScanner = async () => {
    if (cleanupInProgressRef.current) {
      console.log("⏳ Cleanup already in progress");
      return;
    }

    cleanupInProgressRef.current = true;

    try {
      if (html5QrRef.current && isScanning) {
        console.log("🧹 Cleaning up scanner...");
        
        try {
          await html5QrRef.current.stop();
          console.log("✅ Scanner stopped");
        } catch (stopErr) {
          console.log("ℹ️ Stop error:", stopErr?.message || "Unknown");
        }
        
        try {
          await html5QrRef.current.clear();
        } catch (clearErr) {
          console.log("ℹ️ Clear error:", clearErr?.message || "Unknown");
        }
        
        html5QrRef.current = null;
      }
      
      try {
        const videoElement = document.querySelector("#stall-qr-reader video");
        if (videoElement) {
          videoElement.pause();
          
          if (videoElement.srcObject) {
            const tracks = videoElement.srcObject.getTracks();
            tracks.forEach(track => {
              track.stop();
              console.log("🛑 Stopped track:", track.kind);
            });
            videoElement.srcObject = null;
          }
          
          videoElement.removeAttribute("src");
          videoElement.load();
        }
      } catch (mediaErr) {
        console.log("ℹ️ Media cleanup:", mediaErr?.message || "Unknown");
      }
      
      setIsScanning(false);
    } catch (err) {
      console.log("ℹ️ Cleanup handled:", err?.name);
      html5QrRef.current = null;
      setIsScanning(false);
    } finally {
      cleanupInProgressRef.current = false;
    }
  };

  /* START SCANNER */
  useEffect(() => {
    if (!currentCameraId || !mountedRef.current) return;

    const startScanner = async () => {
      try {
        setStatus("starting");
        setError(null);

        await cleanupScanner();
        await new Promise(resolve => setTimeout(resolve, 400));

        if (!mountedRef.current) return;

        const Html5Qrcode = window.Html5Qrcode;
        const scanner = new Html5Qrcode("stall-qr-reader");
        html5QrRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        };

        console.log("📷 Starting scanner with camera:", currentCameraId);

        await scanner.start(
          currentCameraId,
          config,
          onScanSuccess,
          () => {} // Silent failure handler
        );

        setIsScanning(true);
        setStatus("scanning");
        retryCountRef.current = 0;
        console.log("✅ Scanner started successfully");

      } catch (err) {
        console.warn("⚠️ Scanner start issue:", err?.name || "Unknown");
        
        const errorMsg = err?.message || "";
        if (err?.name === "NotReadableError" || errorMsg.includes("Could not start video source")) {
          retryCountRef.current += 1;
          
          if (retryCountRef.current > MAX_RETRIES) {
            console.warn("⚠️ Max camera retries reached");
            setError("Camera unavailable. Close apps using camera, then refresh.");
            setStatus("error");
            return;
          }
          
          console.log(`🔄 Camera retry ${retryCountRef.current}/${MAX_RETRIES}...`);
          setError(`Camera busy. Auto-retry ${retryCountRef.current}/${MAX_RETRIES}...`);
          setStatus("error");
          
          setTimeout(async () => {
            if (mountedRef.current) {
              console.log("🔄 Attempting camera recovery...");
              html5QrRef.current = null;
              setIsScanning(false);
              setError(null);
              setStatus("initializing");
              
              const retryCamera = currentCameraId;
              setCurrentCameraId(null);
              
              setTimeout(() => {
                if (mountedRef.current) {
                  console.log("🔄 Retrying with camera:", retryCamera);
                  setCurrentCameraId(retryCamera);
                }
              }, 1000);
            }
          }, 2000);
        } else {
          setError(err?.message || "Failed to start scanner");
          setStatus("error");
        }
      }
    };

    startScanner();

    return () => {
      cleanupScanner();
    };
  }, [currentCameraId]);

  /* HANDLE SCAN SUCCESS */
  const onScanSuccess = async (decodedText) => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    console.log("🎯 Stall QR Scanned:", decodedText.substring(0, 50) + "...");

    await cleanupScanner();

    try {
      setStatus("processing");
      
      console.log("📤 Sending stall scan request...");
      const res = await api.post("/student/scan-stall", {
        stall_qr_token: decodedText
      });

      console.log("📥 Response received:", res.data);

      if (res.data?.success) {
        const stallData = res.data.data;
        console.log("✅ Stall scan successful:", stallData.stall.stall_name);
        
        // Navigate to feedback rate page
        router.push(`/student/feedback-rate?stallId=${stallData.stall.id}`);
      }
    } catch (err) {
      console.warn("⚠️ Stall scan failed:", err.response?.status || err.name);
      
      const errorMsg = err.response?.data?.message || 
                       err.response?.data?.error || 
                       err?.message ||
                       "Failed to scan stall QR code";
      
      setError(errorMsg);
      setStatus("error");
      
      // Restart scanner after error
      setTimeout(() => {
        setError(null);
        setIsProcessing(false);
        
        if (mountedRef.current) {
          console.log("▶️ Restarting scanner after error...");
          setStatus("initializing");
          const cameraId = currentCameraId;
          setCurrentCameraId(null);
          setTimeout(() => setCurrentCameraId(cameraId), 400);
        }
      }, 2000);
    }
  };

  /* SWITCH CAMERA */
  const switchCamera = async () => {
    if (cameras.length < 2) return;

    try {
      setStatus("switching");
      
      await cleanupScanner();
      await new Promise(resolve => setTimeout(resolve, 400));

      const currentIndex = cameras.findIndex(cam => cam.id === currentCameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCamera = cameras[nextIndex];

      console.log("🔄 Switching to camera:", nextCamera.label);
      setCurrentCameraId(nextCamera.id);
      
    } catch (err) {
      console.error("⚠️ Camera switch error:", err);
      setError("Failed to switch camera");
      setTimeout(() => setError(null), 2000);
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
    <div className="flex bg-soft-background font-sans text-dark-text antialiased min-h-screen">
      
      {/* FIXED SIDEBAR */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-64">
        <StudentSidebar onLogout={handleLogout} />
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        
        {/* FIXED HEADER */}
        <div className="sticky top-0 z-40">
          <StudentHeader
            theme={theme}
            toggleTheme={toggleTheme}
            onLogout={handleLogout}
          />
        </div>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 pb-32 sm:p-6 lg:p-8 lg:pb-10">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Page Title */}
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Scan Stall QR Code</h1>
              <p className="text-gray-600 text-sm mt-2">Point camera at the stall's QR code</p>
            </div>

            {/* Scanner Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              
              {/* Header with Camera Switch */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      status === "scanning" ? "bg-green-400 animate-pulse" :
                      status === "processing" ? "bg-blue-400 animate-pulse" :
                      status === "error" ? "bg-red-400" :
                      "bg-yellow-400 animate-pulse"
                    }`}></div>
                    <div className="text-white">
                      <p className="font-semibold text-sm">
                        {status === "scanning" && "Ready to Scan"}
                        {status === "processing" && "Processing..."}
                        {status === "error" && "Camera Error"}
                        {(status === "initializing" || status === "starting") && "Loading..."}
                        {status === "switching" && "Switching Camera..."}
                      </p>
                    </div>
                  </div>
                  
                  {/* Camera Switch Button */}
                  {cameras.length > 1 && (
                    <button
                      onClick={switchCamera}
                      disabled={status === "switching" || status === "processing" || status === "error"}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Switch Camera"
                    >
                      <span className="material-symbols-outlined text-white text-xl">cameraswitch</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Scanner Area */}
              <div className="p-4">
                <div className="relative bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center" style={{ aspectRatio: "1", maxHeight: "400px" }}>
                  
                  {/* Scanner div */}
                  <div id="stall-qr-reader" className="w-full h-full flex items-center justify-center"></div>
                  
                  {/* Scanning Frame Corners */}
                  {status === "scanning" && (
                    <>
                      <div className="absolute top-4 left-4 w-8 h-8 border-l-3 border-t-3 border-green-400"></div>
                      <div className="absolute top-4 right-4 w-8 h-8 border-r-3 border-t-3 border-green-400"></div>
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-3 border-b-3 border-green-400"></div>
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-3 border-b-3 border-green-400"></div>
                    </>
                  )}
                  
                  {/* Status Overlays */}
                  {status === "initializing" && (
                    <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center text-white p-6">
                        <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-500 border-t-transparent mx-auto mb-3"></div>
                        <p className="text-sm font-semibold">Initializing Camera...</p>
                      </div>
                    </div>
                  )}
                  
                  {status === "starting" && (
                    <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center text-white p-6">
                        <div className="animate-spin rounded-full h-12 w-12 border-3 border-green-500 border-t-transparent mx-auto mb-3"></div>
                        <p className="text-sm font-semibold">Starting Scanner...</p>
                      </div>
                    </div>
                  )}
                  
                  {status === "switching" && (
                    <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center text-white p-6">
                        <div className="animate-spin rounded-full h-12 w-12 border-3 border-purple-500 border-t-transparent mx-auto mb-3"></div>
                        <p className="text-sm font-semibold">Switching Camera...</p>
                      </div>
                    </div>
                  )}
                  
                  {status === "processing" && (
                    <div className="absolute inset-0 bg-green-600/90 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center text-white p-6">
                        <span className="material-symbols-outlined text-5xl mb-3">check_circle</span>
                        <p className="text-lg font-bold">QR Code Detected!</p>
                        <p className="text-xs mt-1">Processing...</p>
                      </div>
                    </div>
                  )}
                  
                  {status === "error" && (
                    <div className="absolute inset-0 bg-red-600/90 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center text-white p-6">
                        <span className="material-symbols-outlined text-5xl mb-3">error</span>
                        <p className="text-lg font-bold mb-2">Camera Error</p>
                        <p className="text-xs mb-4">{error || "Check permissions"}</p>
                        <button
                          onClick={() => window.location.reload()}
                          className="px-4 py-2 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition text-sm"
                        >
                          Reload Page
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Instructions */}
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-blue-700">💡 Tip:</span> Hold the QR code steady within the frame. Make sure you're checked in at the event first.
                  </p>
                </div>
                
                {/* Error Alert */}
                {error && status !== "error" && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-red-500">error</span>
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="mt-4 flex gap-3">
                  {/* Camera Switch Button - Mobile Friendly */}
                  {cameras.length > 1 && (
                    <button
                      onClick={switchCamera}
                      disabled={status === "switching" || status === "processing" || status === "error"}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-xl">cameraswitch</span>
                      <span className="text-sm">Switch</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => router.push("/student/my-visits")}
                    className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition shadow-md flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-xl">rate_review</span>
                    <span className="text-sm">My Feedback</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* MOBILE NAV */}
        <StudentMobileNav />
      </div>
    </div>
  );
}
