import api from "./api";

/**
 * Student Authentication Service
 * Handles multi-step login, verification, and password reset flow
 */

/**
 * Step 1: Student Login
 * @param {string} registration_no - Student registration number
 * @param {string} password - Student password
 * @returns {Promise<Object>} Login response with either token or password reset requirement
 */
export async function studentLogin(registration_no, password) {
  try {
    const response = await api.post("/student/login", {
      registration_no,
      password,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Login failed",
      error: error.response?.data,
    };
  }
}

/**
 * Step 2: Verify Reset Credentials
 * @param {string} registration_no - Student registration number
 * @param {string} date_of_birth - Student date of birth (YYYY-MM-DD)
 * @param {string} pincode - Student pincode (6 digits)
 * @returns {Promise<Object>} Verification response with reset_token
 */
export async function verifyResetCredentials(
  registration_no,
  date_of_birth,
  pincode
) {
  try {
    const response = await api.post("/student/verify-reset-credentials", {
      registration_no,
      date_of_birth,
      pincode,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Verification failed",
      error: error.response?.data,
    };
  }
}

/**
 * Step 3: Reset Password
 * @param {string} reset_token - Reset token from verification step
 * @param {string} new_password - New password
 * @param {string} confirm_password - Confirm new password
 * @returns {Promise<Object>} Reset response with auth token
 */
export async function resetPassword(
  reset_token,
  new_password,
  confirm_password
) {
  try {
    const response = await api.post("/student/reset-password", {
      reset_token,
      new_password,
      confirm_password,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Password reset failed",
      error: error.response?.data,
    };
  }
}

/**
 * Admin Login
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<Object>} Login response
 */
export async function adminLogin(email, password) {
  try {
    const response = await api.post("/admin/login", {
      email,
      password,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Login failed",
      error: error.response?.data,
    };
  }
}

/**
 * Volunteer Login
 * @param {string} email - Volunteer email
 * @param {string} password - Volunteer password
 * @returns {Promise<Object>} Login response
 */
export async function volunteerLogin(email, password) {
  try {
    const response = await api.post("/volunteer/login", {
      email,
      password,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Login failed",
      error: error.response?.data,
    };
  }
}

/**
 * Event Manager Login
 * @param {string} email - Event manager email
 * @param {string} password - Event manager password
 * @returns {Promise<Object>} Login response
 */
export async function eventManagerLogin(email, password) {
  try {
    const response = await api.post("/event-manager/login", {
      email,
      password,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Login failed",
      error: error.response?.data,
    };
  }
}

/**
 * Save authentication data to localStorage
 * @param {string} token - Auth token
 * @param {string} role - User role
 * @param {Object} userData - Additional user data
 */
export function saveAuthData(token, role, userData = {}) {
  if (role === "admin") {
    localStorage.setItem("admin_token", token);
    if (userData.full_name) {
      localStorage.setItem("admin_name", userData.full_name);
    }
  } else if (role === "event_manager") {
    localStorage.setItem("event_manager_token", token);
    if (userData.full_name) {
      localStorage.setItem("event_manager_name", userData.full_name);
    }
    if (userData.email) {
      localStorage.setItem("event_manager_email", userData.email);
    }
  } else {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
  }
}

/**
 * Clear all authentication data from localStorage
 */
export function clearAuthData() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_name");
  localStorage.removeItem("event_manager_token");
  localStorage.removeItem("event_manager_name");
  localStorage.removeItem("event_manager_email");
}

/**
 * Get current authentication status
 * @returns {Object} Current auth status
 */
export function getAuthStatus() {
  const token = localStorage.getItem("token");
  const adminToken = localStorage.getItem("admin_token");
  const eventManagerToken = localStorage.getItem("event_manager_token");
  const role = localStorage.getItem("role");

  return {
    isAuthenticated: !!(token || adminToken || eventManagerToken),
    role: adminToken ? "admin" : eventManagerToken ? "event_manager" : role,
    token: token || adminToken || eventManagerToken,
  };
}
