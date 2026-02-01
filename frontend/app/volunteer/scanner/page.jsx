"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useVolunteerAuth } from "@/hooks/useAuth";

import VolunteerSidebar from "@/components/volunteer/VolunteerSidebar";
import VolunteerHeader from "@/components/volunteer/VolunteerHeader";
import VolunteerMobileNav from "@/components/volunteer/VolunteerMobileNav";

export default function VolunteerScannerPage() {
  const { isAuthenticated, isChecking } = useVolunteerAuth();
  const router = useRouter();
  const html5QrRef = useRef(null);
  const mountedRef = useRef(true);

  const [status, setStatus] = useState("initializing");
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("light");
  const [volunteerName, setVolunteerName] = useState("Volunteer");
  const [cameras, setCameras] = useState([]);
  const [currentCameraId, setCurrentCameraId] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const cleanupInProgressRef = useRef(false);

  // Success overlay state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Retry counter for camera errors
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  // Prevent duplicate scans
  const lastScannedQrRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  const SCAN_COOLDOWN = 5000; // 5 seconds cooldown between scans
  const isRestartingRef = useRef(false);
  const [showReadyButton, setShowReadyButton] = useState(false);

  /* LOAD THEME + VOLUNTEER NAME */
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");

    const savedName = localStorage.getItem("volunteer_name");
    if (savedName) setVolunteerName(savedName);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const handleLogout = () => {
    api.post("/volunteer/logout", {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    }).finally(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("volunteer_name");
      window.location.href = "/";
    });
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
        // Wait for page to fully mount (prevents navigation issues)
        await new Promise(resolve => setTimeout(resolve, 300));

        if (!mountedRef.current) return;

        console.log("🔧 Loading QR scanner library...");
        // Load library - using unpkg as backup if jsdelivr fails
        try {
          await loadScript("https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js");
        } catch (cdnErr) {
          console.warn("⚠️ Primary CDN failed, trying alternate...");
          await loadScript("https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js");
        }

        if (!mountedRef.current) return;

        // Additional wait for library to be fully ready
        await new Promise(resolve => setTimeout(resolve, 300));

        if (!mountedRef.current) return;

        console.log("📷 Requesting camera permission...");
        
        // Check if mediaDevices is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error("❌ getUserMedia not supported");
          setError("Camera not supported on this browser. Please use Chrome, Safari, or Firefox.");
          setStatus("error");
          return;
        }
        
        // First, request camera permission explicitly
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: { ideal: "environment" }
            } 
          });
          
          // Stop the stream immediately - we just needed permission
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
        // Get available cameras
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
        setCameras(availableCameras);

        // Select back camera by default (environment-facing)
        let selectedCamera = availableCameras.find(cam =>
          cam.label.toLowerCase().includes("back") ||
          cam.label.toLowerCase().includes("rear") ||
          cam.label.toLowerCase().includes("environment")
        );

        // Fallback: use last camera (usually back camera on mobile)
        if (!selectedCamera) {
          selectedCamera = availableCameras[availableCameras.length - 1];
        }

        if (mountedRef.current) {
          setCurrentCameraId(selectedCamera.id);
          console.log("✅ Camera selected:", selectedCamera.label);
        }

      } catch (err) {
        console.error("⚠️ Camera initialization failed:", {
          name: err?.name,
          message: err?.message,
          stack: err?.stack
        });

        // Navigation errors are common - retry once
        if (!mountedRef.current) return;

        console.log("🔄 Retrying camera initialization in 2s...");
        setError("Initializing camera...");
        setStatus("initializing");

        setTimeout(async () => {
          if (!mountedRef.current) return;

          try {
            // Request permission first on retry too
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                  facingMode: { ideal: "environment" }
                } 
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

    initCameras();

    return () => {
      console.log("🧹 Component unmounting - cleaning up camera");
      mountedRef.current = false;

      // Force cleanup on unmount
      if (html5QrRef.current) {
        try {
          html5QrRef.current.stop().catch(() => {});
          html5QrRef.current.clear().catch(() => {});
        } catch (e) {
          // Ignore
        }
        html5QrRef.current = null;
      }

      // Stop all video tracks
      const videoElement = document.querySelector("#html5qr-reader video");
      if (videoElement && videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => {
          try {
            track.stop();
          } catch (e) {
            // Ignore
          }
        });
      }
    };
  }, []);

  /* CLEANUP SCANNER HELPER */
  const cleanupScanner = async () => {
    if (cleanupInProgressRef.current) {
      console.log("⏳ Cleanup already in progress, skipping...");
      return;
    }

    cleanupInProgressRef.current = true;

    try {
      if (html5QrRef.current && isScanning) {
        console.log("🧹 Cleaning up scanner...");
        
        try {
          console.log("🛑 Stopping scanner...");
          await html5QrRef.current.stop();
          console.log("✅ Scanner stopped successfully");
        } catch (stopErr) {
          console.log("ℹ️ Stop error (may not be running):", stopErr?.message || "Unknown");
        }
        
        // Clear the scanner instance
        try {
          await html5QrRef.current.clear();
        } catch (clearErr) {
          console.log("ℹ️ Clear error:", clearErr?.message || "Unknown");
        }
        
        html5QrRef.current = null;
      }
      
      // Extra: Stop all media tracks to ensure camera is fully released
      try {
        const videoElement = document.querySelector("#html5qr-reader video");
        if (videoElement) {
          // Stop media tracks first (before pausing to avoid play/pause conflicts)
          if (videoElement.srcObject) {
            const tracks = videoElement.srcObject.getTracks();
            tracks.forEach(track => {
              try {
                track.stop();
                console.log("🛑 Stopped media track:", track.kind);
              } catch (e) {
                // Ignore track stop errors
              }
            });
            videoElement.srcObject = null;
          }

          // Now safely pause and clean up video element
          try {
            videoElement.pause();
          } catch (e) {
            // Ignore pause errors (play might not have started)
          }

          // Remove src to prevent media errors
          videoElement.removeAttribute("src");
          try {
            videoElement.load();
          } catch (e) {
            // Ignore load errors
          }
        }
      } catch (mediaErr) {
        // Silent cleanup - errors here are expected during rapid cleanup
      }
      
      setIsScanning(false);
    } catch (err) {
      console.log("ℹ️ Cleanup handled:", err.name);
      // Force clear even if error
      html5QrRef.current = null;
      setIsScanning(false);
    } finally {
      cleanupInProgressRef.current = false;
    }
  };

  /* START SCANNING WHEN CAMERA IS SELECTED */
  useEffect(() => {
    if (!currentCameraId || !mountedRef.current) return;

    const startScanner = async () => {
      try {
        setStatus("starting");
        setError(null);

        // Clean up any existing scanner first
        await cleanupScanner();

        // Longer delay to ensure camera is fully released
        await new Promise(resolve => setTimeout(resolve, 400));

        if (!mountedRef.current) return;

        const Html5Qrcode = window.Html5Qrcode;
        const scanner = new Html5Qrcode("html5qr-reader");
        html5QrRef.current = scanner;

        const config = {
          fps: 10, // Balanced speed - prevents too many rapid scans
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          // Optimize for mobile
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        };

        console.log("📷 Starting scanner with camera:", currentCameraId);

        await scanner.start(
          currentCameraId,
          config,
          onScanSuccess,
          onScanFailure
        );

        setIsScanning(true);
        setStatus("scanning");
        retryCountRef.current = 0; // Reset retry counter on success
        console.log("✅ Scanner started successfully");

      } catch (err) {
        console.warn("⚠️ Scanner start issue:", err?.name || "Unknown");
        
        // Check if it's the NotReadableError (camera busy/in use)
        const errorMsg = err?.message || "";
        if (err?.name === "NotReadableError" || errorMsg.includes("Could not start video source")) {
          retryCountRef.current += 1;

          if (retryCountRef.current > MAX_RETRIES) {
            console.warn("⚠️ Max camera retries reached");
            setError("Camera unavailable. Please refresh the page.");
            setStatus("error");
            return;
          }

          console.log(`🔄 Camera busy, retry ${retryCountRef.current}/${MAX_RETRIES} in 2s...`);
          setError(`Camera busy, retrying (${retryCountRef.current}/${MAX_RETRIES})...`);
          setStatus("error");

          // Wait longer and retry
          setTimeout(() => {
            if (mountedRef.current) {
              console.log("♻️ Retrying camera after busy error...");
              const cameraId = currentCameraId;
              setCurrentCameraId(null);
              setTimeout(() => {
                if (mountedRef.current) {
                  setCurrentCameraId(cameraId);
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

    // Cleanup function when camera changes or component unmounts
    return () => {
      const cleanup = async () => {
        console.log("🧹 Camera ID changed or unmounting - cleaning scanner");
        if (html5QrRef.current) {
          try {
            await html5QrRef.current.stop();
            await html5QrRef.current.clear();
            html5QrRef.current = null;
          } catch (e) {
            html5QrRef.current = null;
          }
        }
        setIsScanning(false);
      };
      cleanup();
    };
  }, [currentCameraId]);

  /* HANDLE SUCCESSFUL SCAN */
  const onScanSuccess = async (decodedText) => {
    // CRITICAL: Immediate check to prevent ANY duplicate processing
    if (isProcessing || isRestartingRef.current || showReadyButton) {
      console.log("⏸️ Scanner locked - ignoring scan");
      return;
    }

    // Check cooldown period and duplicate QR
    const now = Date.now();
    const timeSinceLastScan = now - lastScanTimeRef.current;

    if (lastScannedQrRef.current === decodedText && timeSinceLastScan < SCAN_COOLDOWN) {
      console.log(`⏸️ Cooldown active, ignoring duplicate`);
      return;
    }

    // LOCK IMMEDIATELY - Set all flags at once
    setIsProcessing(true);
    isRestartingRef.current = true;
    lastScannedQrRef.current = decodedText;
    lastScanTimeRef.current = now;

    console.log("🎯 QR Code Scanned:", decodedText.substring(0, 50) + "...");

    // CRITICAL: Stop scanner FIRST before any processing
    try {
      if (html5QrRef.current && isScanning) {
        console.log("🛑 Stopping scanner immediately...");
        await html5QrRef.current.stop();
        html5QrRef.current = null;
        setIsScanning(false);
      }
    } catch (e) {
      console.log("Scanner already stopped");
    }

    // Now process the scan
    await processScan(decodedText);
  };

  /* HANDLE SCAN ERRORS (silent) */
  const onScanFailure = (error) => {
    // Silent - no need to log every frame that fails to detect QR
  };

  /* PROCESS SCANNED QR CODE */
  const processScan = async (qrToken) => {
    try {
      setStatus("processing");

      console.log("📤 Sending scan request...");
      console.log("🔑 QR Token (first 50 chars):", qrToken.substring(0, 50) + "...");
      
      const res = await api.post("/volunteer/scan/student", {
        qr_code_token: qrToken,
      });

      console.log("📥 Response received:", res.data);
      
      const data = res.data?.data;

      if (!data || !data.student) {
        throw new Error("Invalid response from server");
      }

      // Backend returns action: 'ENTRY' or 'EXIT'
      const type = data.action === "ENTRY" ? "IN" : "OUT";
      
      console.log(`✅ ${data.action} successful for ${data.student.full_name}`);
      console.log(`📊 Student total scan count: ${data.student.total_scan_count}`);
      console.log(`📊 Student is inside event: ${data.student.is_inside_event}`);
      console.log(`🎯 Action type: ${type} (${data.action})`);

      // Show success overlay instead of navigating
      setSuccessData({
        name: data.student.full_name,
        reg: data.student.registration_no,
        type: type,
        count: data.student.total_scan_count,
        isIn: type === "IN"
      });
      setShowSuccess(true);
      setStatus("success");

      // Show success for 1.5 seconds, then show ready button
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessData(null);
        setShowReadyButton(true); // Show button instead of auto-restart
        setStatus("waiting"); // New status
        setIsProcessing(false);
        isRestartingRef.current = false;
        console.log("✅ Scan complete - waiting for user to continue");
      }, 1500);

    } catch (err) {
      console.warn("⚠️ Scan failed:", err.response?.status || err.name);
      
      // Extract detailed error message
      let errorMsg = "Scan failed";
      
      if (err?.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err?.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err?.message) {
        errorMsg = err.message;
      }
      
      // Log details only in development
      if (process.env.NODE_ENV === 'development') {
        console.log("📊 Error details:", {
          status: err.response?.status,
          message: err.response?.data?.message,
          token: err.response?.data?.qr_code_token ? "Present" : "Missing"
        });
      }
      
      setError(errorMsg);
      setStatus("error");

      // Show ready button after error
      setTimeout(() => {
        setError(null);
        setShowReadyButton(true);
        setStatus("waiting");
        setIsProcessing(false);
        isRestartingRef.current = false;
        console.log("❌ Error - waiting for user to retry");
      }, 2000);
    }
  };

  /* RESTART SCANNER FOR NEXT STUDENT */
  const handleReadyForNextScan = async () => {
    console.log("🔄 User clicked - restarting scanner for next student");
    setShowReadyButton(false);
    setStatus("initializing");

    // Clear all locks and tracking
    lastScannedQrRef.current = null;
    lastScanTimeRef.current = 0;
    setIsProcessing(false);
    isRestartingRef.current = false;

    // Force cleanup any existing scanner
    try {
      if (html5QrRef.current) {
        await html5QrRef.current.stop();
        html5QrRef.current = null;
      }
    } catch (e) {
      // Ignore
    }
    setIsScanning(false);

    // Restart camera with delay
    const cameraId = currentCameraId;
    setCurrentCameraId(null);
    setTimeout(() => {
      if (mountedRef.current) {
        console.log("▶️ Restarting camera for next scan");
        setCurrentCameraId(cameraId);
      }
    }, 500);
  };

  /* SWITCH CAMERA */
  const switchCamera = async () => {
    if (cameras.length < 2) return;

    try {
      setStatus("switching");

      // Properly cleanup current scanner
      await cleanupScanner();

      // Proper delay for camera to fully release
      await new Promise(resolve => setTimeout(resolve, 400));

      // Find next camera
      const currentIndex = cameras.findIndex(cam => cam.id === currentCameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCamera = cameras[nextIndex];

      console.log("🔄 Switching to camera:", nextCamera.label);
      setCurrentCameraId(nextCamera.id);

    } catch (err) {
      console.error("Camera switch error:", err);
      setError("Failed to switch camera");
      setStatus("error");
    }
  };

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-soft-background#0d1220] flex items-center justify-center">
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
    <div className="flex min-h-screen bg-soft-background#0d1220]">

      {/* LEFT SIDEBAR */}
      <VolunteerSidebar onLogout={handleLogout} />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <VolunteerHeader
          theme={theme}
          toggleTheme={toggleTheme}
          volunteerName={volunteerName}
          onLogout={handleLogout}
        />

        {/* SCANNER */}
        <main className="p-4 lg:p-6 flex flex-col items-center">

          <h1 className="text-2xl font-bold mb-4 lg:mb-6 text-center">Scan Student QR Code</h1>

          {/* SCANNER CONTAINER */}
          <div className="relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl w-full max-w-md aspect-square mb-4">
            
            {/* QR Scanner View */}
            <div id="html5qr-reader" className="w-full h-full" />

            {/* Scanner Frame Overlay */}
            <div className="absolute inset-6 pointer-events-none">
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-xl" />
              
              {/* Scan Line Animation */}
              {status === "scanning" && (
                <div className="absolute left-0 w-full h-1 bg-[#ECC94B] animate-scan-line shadow-[0_0_18px_4px_rgba(236,201,75,0.5)]" />
              )}
            </div>

            {/* Camera Switch Button */}
            {cameras.length > 1 && status === "scanning" && (
              <button
                onClick={switchCamera}
                className="absolute top-4 right-4 z-10 bg-white/90 p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform"
                aria-label="Switch camera"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-gray-800"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z" />
                  <circle cx="12" cy="13" r="4" />
                  <path d="M12 4v1M4 12h1M12 20v1M20 12h1" />
                  <path d="M15 8l3-3M6 3l3 3" />
                </svg>
              </button>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-4"></div>
                  <p className="text-white font-semibold">Processing...</p>
                </div>
              </div>
            )}
          </div>

          {/* Ready for Next Scan Button */}
          {showReadyButton && (
            <div className="w-full max-w-md mb-4">
              <button
                onClick={handleReadyForNextScan}
                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl
                shadow-lg hover:shadow-xl active:scale-95 transition-all text-lg flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
                <span>Ready for Next Student</span>
              </button>
              <p className="text-center text-sm text-gray-700 mt-3">
                Move the QR code away, then click to continue
              </p>
            </div>
          )}

          {/* Status Message */}
          <div className="w-full max-w-md">
            {status === "waiting" && (
              <div className="bg-green-100 border border-green-300 rounded-xl p-4 text-center">
                <p className="text-green-800 font-medium">
                  ✅ Scan complete! Click button above when ready
                </p>
              </div>
            )}

            {status === "initializing" && (
              <div className="bg-blue-100 border border-blue-300 rounded-xl p-4 text-center">
                <p className="text-blue-800 font-medium">
                  🔄 Initializing camera...
                </p>
              </div>
            )}

            {status === "starting" && (
              <div className="bg-blue-100 border border-blue-300 rounded-xl p-4 text-center">
                <p className="text-blue-800 font-medium">
                  📷 Starting scanner...
                </p>
              </div>
            )}

            {status === "scanning" && !isProcessing && (
              <div className="bg-green-100 border border-green-300 rounded-xl p-4 text-center">
                <p className="text-green-800 font-medium">
                  ✅ Ready! Point camera at QR code
                </p>
              </div>
            )}

            {status === "processing" && (
              <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4 text-center">
                <p className="text-yellow-800 font-medium">
                  ⏳ Processing scan...
                </p>
              </div>
            )}

            {status === "switching" && (
              <div className="bg-purple-100 border border-purple-300 rounded-xl p-4 text-center">
                <p className="text-purple-800 font-medium">
                  🔄 Switching camera...
                </p>
              </div>
            )}

            {status === "error" && error && (
              <div className="bg-red-100 border border-red-300 rounded-xl p-4 text-center">
                <p className="text-red-800 font-semibold mb-2">
                  ❌ Error
                </p>
                <p className="text-red-700 text-sm mb-3">
                  {error}
                </p>
                {retryCountRef.current <= MAX_RETRIES && !error.includes("Please") && error.includes("Retrying") && (
                  <p className="text-red-600 text-xs">
                    Auto-retrying...
                  </p>
                )}
                <div className="flex gap-2 justify-center mt-3">
                  {(error.includes("Please") || !error.includes("Retrying")) && (
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                    >
                      Refresh Page
                    </button>
                  )}
                  {error.includes("Failed to access camera") && !error.includes("Retrying") && (
                    <button
                      onClick={() => {
                        setError(null);
                        setStatus("initializing");
                        window.location.reload();
                      }}
                      className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          {status === "scanning" && !isProcessing && (
            <div className="w-full max-w-md mt-6 bg-card-light rounded-xl p-5 shadow-soft">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">info</span>
                How to Scan
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Hold your device steady and center the QR code</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Ensure good lighting for best results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>The scan will process automatically</span>
                </li>
                {cameras.length > 1 && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Tap the camera icon to switch cameras</span>
                  </li>
                )}
              </ul>
            </div>
          )}

        </main>
      </div>

      {/* MOBILE NAV */}
      <VolunteerMobileNav />
      
      {/* SUCCESS OVERLAY - Fast inline notification */}
      {showSuccess && successData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-card-background rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scaleIn">

            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg animate-success-pulse
                ${successData.isIn
                  ? "bg-green-100"
                  : "bg-yellow-100"}`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-12 h-12 ${successData.isIn ? "text-green-600" : "text-yellow-600"}`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4.5-4.5 1.41-1.41L10 13.17l7.09-7.09L18.5 7.5 10 16.5z" />
                </svg>
              </div>
            </div>

            {/* Status Title */}
            <h2 className="text-2xl font-bold text-center mb-1 text-dark-text">
              {successData.isIn ? "Checked In ✓" : "Checked Out ✓"}
            </h2>
            
            <p className="text-center text-gray-700 text-sm mb-5">
              Scan successful
            </p>

            {/* Student Info */}
            <div className="bg-soft-background#0d1220] border-2 border-primary rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white">person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base text-dark-text truncate">{successData.name}</p>
                  <p className="text-xs text-gray-700">ID: {successData.reg}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-light-gray-border">
                <span className="text-xs text-gray-700">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                  ${successData.isIn 
                    ? "bg-green-100 text-green-700" 
                    : "bg-yellow-100 text-yellow-700"}`}>
                  {successData.isIn ? "INSIDE" : "EXITED"}
                </span>
              </div>
              
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-700">Total Scans</span>
                <span className="text-xs font-bold text-primary">{successData.count}</span>
              </div>
            </div>

            {/* Auto-resume indicator */}
            <div className="flex items-center justify-center gap-2 text-primary">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-sm font-semibold">Ready for next scan</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
