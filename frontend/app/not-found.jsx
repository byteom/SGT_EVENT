"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotFound() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if user is authenticated (client-side only)
  const isAdminAuthenticated = isClient && localStorage.getItem("admin_token");
  const isStudentAuthenticated = isClient && localStorage.getItem("token") && localStorage.getItem("role") === "student";
  const isVolunteerAuthenticated = isClient && localStorage.getItem("token") && localStorage.getItem("role") === "volunteer";

  return (
    <div className="min-h-screen bg-soft-background flex items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl sm:text-[12rem] font-bold text-primary/20 leading-none">
            404
          </h1>
        </div>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-primary">error_outline</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl font-bold text-dark-text mb-4">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-lg text-gray-700 mb-8">
          Oops! The page you're looking for doesn't exist or is under construction.
        </p>

        {/* Info Card */}
        <div className="bg-card-background rounded-xl border border-light-gray-border shadow-soft p-6 mb-8">
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">construction</span>
              <div>
                <h3 className="font-semibold text-dark-text mb-1">Page Under Construction</h3>
                <p className="text-sm text-gray-700">
                  This page might be currently under development and will be available soon.
                </p>
              </div>
            </div>
            <div className="border-t border-light-gray-border"></div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">edit</span>
              <div>
                <h3 className="font-semibold text-dark-text mb-1">Check the URL</h3>
                <p className="text-sm text-gray-700">
                  You might have misspelled the URL. Please check the address and try again.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 border border-light-gray-border rounded-lg hover:bg-soft-background transition text-dark-text font-medium flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Go Back
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-medium flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">home</span>
            Go to Home
          </Link>
        </div>

        {/* Quick Links - Only show if authenticated */}
        {(isAdminAuthenticated || isStudentAuthenticated || isVolunteerAuthenticated) && (
          <div className="mt-12 pt-8 border-t border-light-gray-border">
            <p className="text-sm text-gray-700 mb-4">Quick Links:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {isAdminAuthenticated && (
                <Link
                  href="/admin"
                  className="px-4 py-2 text-sm bg-card-background border border-light-gray-border rounded-lg hover:bg-soft-background transition text-dark-text"
                >
                  Admin Dashboard
                </Link>
              )}
              {isStudentAuthenticated && (
                <Link
                  href="/student"
                  className="px-4 py-2 text-sm bg-card-background border border-light-gray-border rounded-lg hover:bg-soft-background transition text-dark-text"
                >
                  Student Portal
                </Link>
              )}
              {isVolunteerAuthenticated && (
                <Link
                  href="/volunteer"
                  className="px-4 py-2 text-sm bg-card-background border border-light-gray-border rounded-lg hover:bg-soft-background transition text-dark-text"
                >
                  Volunteer Portal
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

