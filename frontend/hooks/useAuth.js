"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

/**
 * Authentication hook for admin pages
 * Verifies token exists and optionally validates with backend
 * Redirects to login if not authenticated
 */
export function useAdminAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("admin_token");
      
      if (!token) {
        // No token found, redirect to login
        router.replace("/");
        return;
      }

      // Token exists, allow access
      // Note: Token validation happens automatically via API interceptor
      // If token is invalid, the interceptor will handle logout and redirect
      setIsAuthenticated(true);
      setIsChecking(false);
    };

    checkAuth();
  }, [router]);

  return { isAuthenticated, isChecking };
}

/**
 * Authentication hook for student pages
 * Redirects to login if not authenticated
 */
export function useStudentAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      
      if (!token || role !== "student") {
        // No token or wrong role, redirect to login
        router.replace("/");
        return;
      }

      // Token exists and role is correct, allow access
      setIsAuthenticated(true);
      setIsChecking(false);
    };

    checkAuth();
  }, [router]);

  return { isAuthenticated, isChecking };
}

/**
 * Authentication hook for volunteer pages
 * Redirects to login if not authenticated
 */
export function useVolunteerAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token || role !== "volunteer") {
        // No token or wrong role, redirect to login
        router.replace("/");
        return;
      }

      // Token exists and role is correct, allow access
      setIsAuthenticated(true);
      setIsChecking(false);
    };

    checkAuth();
  }, [router]);

  return { isAuthenticated, isChecking };
}

/**
 * Authentication hook for event manager pages
 * Redirects to login if not authenticated
 */
export function useEventManagerAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("event_manager_token");

      if (!token) {
        // No token found, redirect to login
        router.replace("/");
        return;
      }

      // Token exists, allow access
      // Note: Token validation happens automatically via API interceptor
      // If token is invalid, the interceptor will handle logout and redirect
      setIsAuthenticated(true);
      setIsChecking(false);
    };

    checkAuth();
  }, [router]);

  return { isAuthenticated, isChecking };
}
