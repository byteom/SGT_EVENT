"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useStudentAuth } from "@/hooks/useAuth";

import StudentSidebar from "@/components/student/StudentSidebar";
import StudentHeader from "@/components/student/StudentHeader";
import StudentMobileNav from "@/components/student/StudentMobileNav";

export default function StudentProfilePage() {
  const { isAuthenticated, isChecking } = useStudentAuth();
  const router = useRouter();

  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  // ------------------ FETCH STUDENT PROFILE ------------------
  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = localStorage.getItem("token");

        const res = await api.get("/student/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const studentData = res.data?.data || {};
        setStudent(studentData);
        setEmail(studentData.email || "");
      } catch (err) {
        console.error(err);
        alert("Failed to load profile.");
      }
      setLoading(false);
    }

    if (isAuthenticated && !isChecking) {
      fetchProfile();
    }
  }, [isAuthenticated, isChecking]);

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

  const goTo = (path) => router.push(path);

  // ------------------ UPDATE PROFILE ------------------
  const handleUpdateProfile = async () => {
    setUpdateError("");
    setUpdateSuccess("");

    if (password && password !== confirmPassword) {
      setUpdateError("Passwords do not match");
      return;
    }

    if (password && password.length < 6) {
      setUpdateError("Password must be at least 6 characters");
      return;
    }

    setUpdating(true);

    try {
      const updateData = {};
      if (email && email !== student?.email) {
        updateData.email = email;
      }
      if (password) {
        updateData.password = password;
      }

      if (Object.keys(updateData).length === 0) {
        setUpdateError("No changes to save");
        setUpdating(false);
        return;
      }

      const res = await api.put("/student/profile", updateData);

      if (res.data?.success) {
        setUpdateSuccess("Profile updated successfully!");
        setStudent(res.data.data);
        setPassword("");
        setConfirmPassword("");
        setEditing(false);
        setTimeout(() => setUpdateSuccess(""), 3000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update profile";
      setUpdateError(errorMsg);
    } finally {
      setUpdating(false);
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

  const handleLogout = async () => {
    try {
      await api.post("/student/logout");
    } catch (error) {
      // Logout even if API call fails
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/";
    }
  };

  return (
    <div className="bg-soft-background font-sans text-dark-text antialiased min-h-screen flex">

      {/* ------------------ LEFT SIDEBAR ------------------ */}
      <StudentSidebar onLogout={handleLogout} />

      {/* ------------------ MAIN CONTENT AREA ------------------ */}
      <div className="flex-1 flex flex-col">

        {/* ------------------ HEADER (with dynamic title) ------------------ */}
        <StudentHeader 
          theme={theme} 
          toggleTheme={toggleTheme} 
          title="My Profile!"
          onLogout={handleLogout}
        />

        {/* ------------------ MAIN BODY ------------------ */}
        <main className="flex-1 overflow-y-auto p-4 pb-32 sm:p-6 lg:p-8 lg:pb-10">
          <div className="max-w-4xl mx-auto">

            {loading ? (
              <LoadingBlock />
            ) : (
              <>
                {/* ---------- BIG PROFILE CARD ---------- */}
                <ProfileHero student={student} />

                {/* ---------- UPDATE PROFILE SECTION ---------- */}
                {editing ? (
                  <div className="mt-10 bg-card-background border border-light-gray-border rounded-2xl p-8 shadow-soft">
                    <h3 className="text-2xl font-bold mb-6">Update Profile</h3>
                    
                    {updateError && (
                      <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-600">{updateError}</p>
                      </div>
                    )}

                    {updateSuccess && (
                      <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-green-600">{updateSuccess}</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full p-3 border border-light-gray-border rounded-xl bg-white text-dark-text"
                          placeholder="Enter your email"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                          New Password (leave blank to keep current)
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full p-3 border border-light-gray-border rounded-xl bg-white text-dark-text"
                          placeholder="Enter new password"
                        />
                      </div>

                      {password && (
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">
                            Confirm Password
                          </label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 border border-light-gray-border rounded-xl bg-white text-dark-text"
                            placeholder="Confirm new password"
                          />
                        </div>
                      )}

                      <div className="flex gap-4 mt-6">
                        <button
                          onClick={handleUpdateProfile}
                          disabled={updating}
                          className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
                            updating
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-blue-100 text-primary border border-blue-200 hover:bg-blue-200"
                          }`}
                        >
                          {updating ? "Updating..." : "Save Changes"}
                        </button>
                        <button
                          onClick={() => {
                            setEditing(false);
                            setEmail(student?.email || "");
                            setPassword("");
                            setConfirmPassword("");
                            setUpdateError("");
                            setUpdateSuccess("");
                          }}
                          className="px-6 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* ---------- STUDENT DETAILS GRID ---------- */}
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <DetailCard title="Registration No" value={student?.registration_no} icon="badge" />
                      <DetailCard title="School" value={student?.school_name} icon="school" />
                      <DetailCard title="Email" value={student?.email} icon="mail" />
                      <DetailCard title="Phone" value={student?.phone || "—"} icon="call" />
                      <DetailCard title="Member Since" value={student?.created_at ? new Date(student.created_at).toLocaleDateString() : "—"} icon="calendar_today" />
                    </div>

                    {/* ---------- ACTION BUTTONS ---------- */}
                    <div className="mt-10 mb-20 flex flex-wrap justify-center gap-4">
                      <button
                        onClick={() => setEditing(true)}
                        className="px-8 py-3 rounded-xl bg-blue-100 text-primary border border-blue-200 font-semibold inline-flex items-center gap-2 shadow-soft hover:bg-blue-200 transition"
                      >
                        <span className="material-symbols-outlined">edit</span>
                        Edit Profile
                      </button>
                      <button
                        onClick={() => goTo("/student/qr")}
                        className="px-8 py-3 rounded-xl bg-blue-100 text-primary border border-blue-200 font-semibold inline-flex items-center gap-2 shadow-soft hover:bg-blue-200 transition"
                      >
                        <span className="material-symbols-outlined">qr_code_2</span>
                        View My QR
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

          </div>
        </main>

      </div>

      {/* ------------------ MOBILE NAV ------------------ */}
      <StudentMobileNav active="profile" />

    </div>
  );
}

/* ============================================================
    SMALL COMPONENTS
============================================================ */

function LoadingBlock() {
  return (
    <div className="flex flex-col items-center mt-20">
      <div className="animate-spin h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent"></div>
      <p className="text-gray-700 mt-4">Loading profile...</p>
    </div>
  );
}

function ProfileHero({ student }) {
  return (
    <div className="
      bg-blue-100 border border-blue-200
      p-10 rounded-3xl shadow-soft relative overflow-hidden
    ">
      <div className="relative flex flex-col md:flex-row items-center gap-8">
        
        <div className="w-32 h-32 rounded-full bg-white ring-2 ring-blue-200 flex items-center justify-center text-4xl font-bold text-primary shadow-xl">
          {student?.full_name?.[0] || "S"}
        </div>

        <div>
          <h2 className="text-3xl font-bold text-gray-800">{student?.full_name}</h2>
          <p className="text-gray-600 mt-1">{student?.email}</p>
          <p className="text-gray-600 text-sm">Reg No: {student?.registration_no}</p>
        </div>

      </div>
    </div>
  );
}

function DetailCard({ title, value, icon }) {
  return (
    <div className="
      bg-card-background 
      border border-light-gray-border 
      rounded-2xl p-6 shadow-soft 
      hover:shadow-md transition-all
      flex items-start gap-4
    ">
      <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center">
        <span className="material-symbols-outlined text-primary">{icon}</span>
      </div>

      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-gray-700 mt-1">{value || "—"}</p>
      </div>
    </div>
  );
}
