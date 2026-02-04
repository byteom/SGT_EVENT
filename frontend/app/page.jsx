"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  studentLogin,
  verifyResetCredentials,
  resetPassword,
  adminLogin,
  volunteerLogin,
  eventManagerLogin,
  saveAuthData,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  // Common states
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Multi-step flow states
  const [step, setStep] = useState(1); // 1: Login, 2: Verification, 3: Reset Password

  // Step 1: Login credentials
  const [loginId, setLoginId] = useState(""); // registration_no for students, email for others
  const [password, setPassword] = useState("");

  // Step 2: Verification credentials
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [pincode, setPincode] = useState("");
  const [registrationNo, setRegistrationNo] = useState(""); // Store from step 1

  // Step 3: Reset password
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Slideshow states
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    "/images/new_new_1.jpeg",
    "/images/new_new_2.jpeg"
  ];

  // Auto slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  // Handle Step 1: Initial Login
  async function handleLogin() {
    if (!loginId || !password) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      let response;

      if (role === "student") {
        response = await studentLogin(loginId, password);
      } else if (role === "volunteer") {
        response = await volunteerLogin(loginId, password);
      } else if (role === "admin") {
        response = await adminLogin(loginId, password);
      } else if (role === "event_manager") {
        response = await eventManagerLogin(loginId, password);
      }

      if (response.success) {
        const data = response.data.data;

        // Check if password reset is required (student only)
        if (role === "student" && data.requires_password_reset) {
          // Move to verification step
          setRegistrationNo(data.registration_no);
          setStep(2);
          setLoading(false);
          return;
        }

        // Normal login - save token and redirect
        const token = data.token;
        const userData = data[role] || data.admin || data.volunteer || data.student || data.manager;

        if (token) {
          saveAuthData(token, role, userData);

          // Redirect based on role
          if (role === "student") router.push("/student");
          else if (role === "volunteer") router.push("/volunteer");
          else if (role === "admin") router.push("/admin");
          else if (role === "event_manager") router.push("/event-manager");
        } else {
          alert("Token not received from backend!");
        }
      } else {
        alert(response.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during login");
    }

    setLoading(false);
  }

  // Handle Step 2: Identity Verification
  async function handleVerification() {
    if (!dateOfBirth || !pincode) {
      alert("Please enter date of birth and pincode");
      return;
    }

    // Validate pincode (must be 6 digits)
    if (!/^\d{6}$/.test(pincode)) {
      alert("Pincode must be exactly 6 digits");
      return;
    }

    setLoading(true);

    try {
      const response = await verifyResetCredentials(
        registrationNo,
        dateOfBirth,
        pincode
      );

      if (response.success) {
        const data = response.data.data;
        setResetToken(data.reset_token);
        setStep(3);
      } else {
        alert(response.message || "Verification failed");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during verification");
    }

    setLoading(false);
  }

  // Handle Step 3: Reset Password
  async function handleResetPassword() {
    if (!newPassword || !confirmPassword) {
      alert("Please enter both password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword(
        resetToken,
        newPassword,
        confirmPassword
      );

      if (response.success) {
        const data = response.data.data;
        const token = data.token;
        const student = data.student;

        // Save auth data and redirect
        if (token) {
          saveAuthData(token, "student", student);
          alert("Password reset successful! Redirecting...");
          router.push("/student");
        } else {
          alert("Token not received from backend!");
        }
      } else {
        alert(response.message || "Password reset failed");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during password reset");
    }

    setLoading(false);
  }

  // Reset to login screen
  function backToLogin() {
    setStep(1);
    setLoginId("");
    setPassword("");
    setDateOfBirth("");
    setPincode("");
    setNewPassword("");
    setConfirmPassword("");
    setResetToken("");
    setRegistrationNo("");
  }

  return (
    <div className="min-h-screen flex">
      
      {/* LEFT SIDE - SLIDESHOW (65%) */}
      <div className="hidden lg:block w-3/5 relative">
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={slide}
                alt={`Slide ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
          
          {/* Slide indicators */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
                  index === currentSlide 
                    ? 'bg-white scale-110' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM (35%) */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center px-6 py-10 bg-white relative">
        
        {/* Background overlay for mobile */}
        <div 
          className="absolute inset-0 lg:hidden z-0"
          style={{
            backgroundImage: "url('/images/login_page_back.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
        </div>

        <main className="relative z-10 w-full max-w-md mx-auto">

        {/* Logo */}
        <div className="flex flex-col items-center mb-4">
          <div className="w-24 h-24 mt-2">
            <Image
              src="/images/SGT-Logo.png"
              alt="SGT Logo"
              width={96}
              height={96}
              className="object-contain w-full h-full"
              loading="eager"
            />
          </div>
        </div>

        {/* Step 1: Login Screen */}
        {step === 1 && (
          <>
            <h1 className="text-3xl font-extrabold text-center text-gray-900 tracking-tight">
              Welcome Back
            </h1>

            <div className="mt-8 space-y-5">

              {/* Role */}
              <div>
                <label className="font-medium text-gray-700">
                  Role
                </label>
                <select
                  className="w-full mt-2 border border-gray-300
                  rounded-xl px-4 py-3
                  bg-white#1d2333] focus:ring-2 focus:ring-blue-600"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="student">Student</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="admin">Admin</option>
                  <option value="event_manager">Event Manager</option>
                </select>
              </div>

              {/* Login ID (Registration No for students, Email for others) */}
              <div>
                <label className="font-medium text-gray-700">
                  {role === "student" ? "Registration Number" : "Email"}
                </label>
                <input
                  type={role === "student" ? "text" : "email"}
                  placeholder={
                    role === "student"
                      ? "Enter your registration number"
                      : role === "event_manager"
                      ? "Enter your event manager email"
                      : "Enter your email"
                  }
                  className="w-full mt-2 border border-gray-300
                  rounded-xl px-4 py-3
                  bg-white#1d2333] focus:ring-2 focus:ring-blue-600"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                />
              </div>

              {/* Password */}
              <div>
                <label className="font-medium text-gray-700">
                  Password
                </label>
                <div className="relative mt-2">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full border border-gray-300
                    rounded-xl px-4 py-3 pr-12
                    bg-white#1d2333] focus:ring-2 focus:ring-blue-600"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <span
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 cursor-pointer"
                  >
                    {showPass ? (
                      <svg xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M3 3l18 18M10.58 10.58A3 3 0 0112 9c1.657 0 3 1.343 3 3 0 .436-.093.85-.26 1.22m-1.38 1.38A3 3 0 019 12c0-.436.093-.85.26-1.22" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </span>
                </div>
              </div>

            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full mt-8 py-3 bg-blue-100 text-primary border border-blue-200 rounded-xl shadow-sm disabled:opacity-60 transition-all hover:bg-blue-200 font-semibold"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </>
        )}

        {/* Step 2: Identity Verification Screen */}
        {step === 2 && (
          <>
            <h1 className="text-3xl font-extrabold text-center text-gray-900 tracking-tight">
              Identity Verification
            </h1>
            <p className="text-center text-sm text-gray-700 mt-2">
              Please verify your identity to reset your password
            </p>

            <div className="mt-8 space-y-5">

              {/* Date of Birth */}
              <div>
                <label className="font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  className="w-full mt-2 border border-gray-300
                  rounded-xl px-4 py-3
                  bg-white#1d2333] focus:ring-2 focus:ring-blue-600"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="font-medium text-gray-700">
                  Pincode
                </label>
                <input
                  type="text"
                  placeholder="Enter your 6-digit pincode"
                  maxLength="6"
                  className="w-full mt-2 border border-gray-300
                  rounded-xl px-4 py-3
                  bg-white#1d2333] focus:ring-2 focus:ring-blue-600"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                />
              </div>

            </div>

            <button
              onClick={handleVerification}
              disabled={loading}
              className="w-full mt-8 py-3 text-white rounded-xl shadow-md disabled:opacity-60 transition-all"
              style={{ backgroundColor: loading ? "#2B6CB0" : "#2B6CB0" }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#1E3A8A")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#2B6CB0")}
            >
              {loading ? "Verifying..." : "Verify Identity"}
            </button>

            <button
              onClick={backToLogin}
              className="w-full mt-4 py-3 text-gray-700 bg-gray-200 rounded-xl shadow-md hover:bg-gray-300 transition-all"
            >
              Back to Login
            </button>
          </>
        )}

        {/* Step 3: Reset Password Screen */}
        {step === 3 && (
          <>
            <h1 className="text-3xl font-extrabold text-center text-gray-900 tracking-tight">
              Reset Password
            </h1>
            <p className="text-center text-sm text-gray-700 mt-2">
              Create a new password for your account
            </p>

            <div className="mt-8 space-y-5">

              {/* New Password */}
              <div>
                <label className="font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative mt-2">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Enter new password"
                    className="w-full border border-gray-300
                    rounded-xl px-4 py-3 pr-12
                    bg-white#1d2333] focus:ring-2 focus:ring-blue-600"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 cursor-pointer"
                  >
                    {showPass ? (
                      <svg xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M3 3l18 18M10.58 10.58A3 3 0 0112 9c1.657 0 3 1.343 3 3 0 .436-.093.85-.26 1.22m-1.38 1.38A3 3 0 019 12c0-.436.093-.85.26-1.22" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </span>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="w-full mt-2 border border-gray-300
                  rounded-xl px-4 py-3
                  bg-white#1d2333] focus:ring-2 focus:ring-blue-600"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <p className="text-xs text-gray-700">
                Password must be at least 8 characters with at least one letter and one number
              </p>

            </div>

            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full mt-8 py-3 text-white rounded-xl shadow-md disabled:opacity-60 transition-all"
              style={{ backgroundColor: loading ? "#2B6CB0" : "#2B6CB0" }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#1E3A8A")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#2B6CB0")}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>

            <button
              onClick={backToLogin}
              className="w-full mt-4 py-3 text-gray-700 bg-gray-200 rounded-xl shadow-md hover:bg-gray-300 transition-all"
            >
              Back to Login
            </button>
          </>
        )}

        <p className="text-center text-sm text-gray-700 mt-4">
          Powered by SGT University
        </p>

      </main>
      </div>
    </div>
  );
}
