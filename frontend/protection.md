# Security Protection Implementation

## Overview

This document details the comprehensive security measures implemented in the SGT University Event Management System, following backend authentication patterns and best practices.

---

## Table of Contents

1. [Authentication Architecture](#authentication-architecture)
2. [Frontend Security Measures](#frontend-security-measures)
3. [Backend Security Patterns](#backend-security-patterns)
4. [Token Management](#token-management)
5. [Route Protection](#route-protection)
6. [API Security](#api-security)
7. [Error Handling](#error-handling)
8. [Security Best Practices](#security-best-practices)

---

## Authentication Architecture

### Backend Authentication Flow

The backend uses a dual-authentication system:

1. **Primary Method**: HTTP-Only Cookies (most secure)
   - Tokens stored in HTTP-Only cookies (prevents XSS attacks)
   - Automatically sent with requests
   - Not accessible via JavaScript

2. **Fallback Method**: Authorization Header
   - For mobile apps and API clients
   - Format: `Authorization: Bearer <token>`
   - Allows flexibility for different client types

### Token Structure

JWT tokens contain:
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "ADMIN" | "STUDENT" | "VOLUNTEER",
  "iat": 1234567890,
  "exp": 1234654290
}
```

- **Expiration**: 24 hours
- **Algorithm**: HS256
- **Secret**: Stored in environment variable (`JWT_SECRET`)

---

## Frontend Security Measures

### 1. Authentication Hooks

**Location**: `hooks/useAuth.js`

#### `useAdminAuth()`
- Checks for `admin_token` in localStorage
- Optionally validates token with backend via `/admin/profile` endpoint
- Redirects to login (`/`) if:
  - No token found
  - Token is invalid (401/403 response)
  - Token is expired
- Returns `{ isAuthenticated, isChecking }` state

**Implementation**:
```javascript
export function useAdminAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("admin_token");
      
      if (!token) {
        router.replace("/");
        return;
      }

      // Verify token with backend
      try {
        await api.get("/admin/profile");
        setIsAuthenticated(true);
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_name");
          router.replace("/");
          return;
        }
        setIsAuthenticated(true);
      }
      
      setIsChecking(false);
    };

    checkAuth();
  }, [router]);

  return { isAuthenticated, isChecking };
}
```

#### Similar Hooks
- `useStudentAuth()` - For student pages
- `useVolunteerAuth()` - For volunteer pages

### 2. Route Protection

**All Admin Pages Protected**:
- `/admin` (Dashboard)
- `/admin/students`
- `/admin/volunteers`
- `/admin/stalls`
- `/admin/scans`
- `/admin/analytics`
- `/admin/reports`
- `/admin/settings`
- `/admin/events`

**Protection Pattern**:
```javascript
export default function AdminPage() {
  const { isAuthenticated, isChecking } = useAdminAuth();

  // Show loading while checking
  if (isChecking) {
    return <LoadingSpinner />;
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Render protected content
  return <PageContent />;
}
```

### 3. API Interceptors

**Location**: `lib/api.js`

#### Request Interceptor
- Automatically attaches token to all requests
- Checks for `admin_token` first, then falls back to `token`
- Format: `Authorization: Bearer <token>`

```javascript
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const adminToken = localStorage.getItem("admin_token");
    const token = localStorage.getItem("token");
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
```

#### Response Interceptor
- Handles authentication errors globally
- Automatically logs out on 401/403
- Clears invalid tokens
- Redirects to login page

```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - Clear tokens and redirect
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_name");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/";
    }
    
    if (error.response?.status === 403) {
      // Forbidden - Token expired or invalid
      const message = error.response?.data?.message || "Access denied";
      if (message.includes("expired") || message.includes("Invalid")) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_name");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/";
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

## Backend Security Patterns

### 1. Authentication Middleware

**Location**: `backend/sgtu-event/server/src/middleware/auth.js`

#### `authenticateToken`
- Verifies JWT token from cookie or Authorization header
- Returns 401 if no token
- Returns 403 if token is invalid or expired
- Attaches decoded user data to `req.user`

```javascript
export const authenticateToken = (req, res, next) => {
  // Priority 1: Get token from HTTP-Only cookie
  let token = getTokenFromCookie(req);
  
  // Priority 2: Fallback to Authorization header
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  // Verify token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = decoded;
    next();
  });
};
```

#### `authorizeRoles`
- Role-based access control
- Checks if user has required role
- Returns 403 if role doesn't match

```javascript
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};
```

### 2. Route Protection

**All Admin Routes Protected**:
```javascript
// Public routes
router.post('/login', adminController.login);

// Protected routes (require authentication)
router.post('/logout', authenticateToken, adminController.logout);
router.get('/profile', authenticateToken, adminController.getProfile);
router.get('/students', authenticateToken, adminController.getAllStudents);
router.get('/volunteers', authenticateToken, adminController.getAllVolunteers);
router.get('/stalls', authenticateToken, adminController.getAllStalls);
router.get('/stats', authenticateToken, adminController.getStats);
```

### 3. Token Generation

**Location**: `backend/sgtu-event/server/src/controllers/admin.controller.js`

```javascript
const token = jwt.sign(
  { id: admin.id, email: admin.email, role: admin.role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Set secure HTTP-Only cookie
setAuthCookie(res, token);

// Also return token in response (for frontend localStorage)
return successResponse(res, {
  token,
  admin: { id, email, full_name, role }
}, 'Login successful');
```

### 4. Cookie Configuration

**Location**: `backend/sgtu-event/server/src/helpers/cookie.js`

```javascript
const COOKIE_CONFIG = {
  TOKEN_NAME: 'token',
  MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  PATH: '/',
  options: {
    httpOnly: true,  // Prevents JavaScript access (XSS protection)
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
  }
};
```

---

## Token Management

### Frontend Token Storage

**Admin Tokens**:
- `admin_token`: JWT token for admin authentication
- `admin_name`: Admin's full name (for display)

**Student/Volunteer Tokens**:
- `token`: JWT token for authentication
- `role`: User role ("student" or "volunteer")

### Token Lifecycle

1. **Login**:
   - User submits credentials
   - Backend validates and generates JWT
   - Token stored in:
     - HTTP-Only cookie (backend)
     - localStorage (frontend) - for Authorization header

2. **Request**:
   - Frontend attaches token via Authorization header
   - Backend verifies token from header or cookie
   - Request proceeds if valid

3. **Expiration**:
   - Token expires after 24 hours
   - Backend returns 403 on expired token
   - Frontend interceptor catches 403
   - User redirected to login

4. **Logout**:
   - Frontend clears localStorage
   - Backend clears HTTP-Only cookie
   - User redirected to login

### Token Validation

**Frontend Validation**:
- Checks token existence in localStorage
- Optionally validates with backend via `/admin/profile`
- Handles 401/403 responses

**Backend Validation**:
- Verifies JWT signature
- Checks expiration
- Validates token structure
- Returns appropriate error codes

---

## Route Protection

### Protected Routes

#### Admin Routes
All routes under `/admin/*` require:
- `admin_token` in localStorage
- Valid JWT token
- Admin role verification

#### Student Routes
All routes under `/student/*` require:
- `token` in localStorage
- `role === "student"`
- Valid JWT token

#### Volunteer Routes
All routes under `/volunteer/*` require:
- `token` in localStorage
- `role === "volunteer"`
- Valid JWT token

### Protection Implementation

**Pattern Used**:
```javascript
// 1. Import auth hook
import { useAdminAuth } from "@/hooks/useAuth";

// 2. Use hook in component
const { isAuthenticated, isChecking } = useAdminAuth();

// 3. Show loading state
if (isChecking) {
  return <LoadingSpinner />;
}

// 4. Block unauthorized access
if (!isAuthenticated) {
  return null; // Will redirect via hook
}

// 5. Render protected content
return <ProtectedContent />;
```

### 404 Page Security

**Location**: `app/not-found.jsx`

- Only shows quick links if user is authenticated
- Checks authentication status client-side
- Prevents unauthorized access through quick links

```javascript
const isAdminAuthenticated = isClient && localStorage.getItem("admin_token");
const isStudentAuthenticated = isClient && localStorage.getItem("token") && localStorage.getItem("role") === "student";
const isVolunteerAuthenticated = isClient && localStorage.getItem("token") && localStorage.getItem("role") === "volunteer";

// Only show links if authenticated
{isAdminAuthenticated && (
  <Link href="/admin">Admin Dashboard</Link>
)}
```

---

## API Security

### Request Security

1. **Token Attachment**:
   - Automatic via axios interceptor
   - Format: `Authorization: Bearer <token>`
   - Sent with every authenticated request

2. **CORS Configuration**:
   - Backend configured for specific origins
   - Credentials allowed (`withCredentials: true`)

3. **HTTPS**:
   - Required in production
   - Secure cookies only in production

### Response Security

1. **Error Handling**:
   - 401: Unauthorized - No token or invalid token
   - 403: Forbidden - Token expired or insufficient permissions
   - 500: Server error

2. **Automatic Logout**:
   - Frontend interceptor catches 401/403
   - Clears all tokens
   - Redirects to login

3. **Error Messages**:
   - Generic messages for security
   - Detailed errors only in development

---

## Error Handling

### Frontend Error Handling

**API Errors**:
```javascript
try {
  const response = await api.get("/admin/stats");
  // Handle success
} catch (error) {
  if (error.response?.status === 401) {
    // Already handled by interceptor
  } else if (error.response?.status === 403) {
    // Already handled by interceptor
  } else {
    // Handle other errors
    console.error("Error:", error);
  }
}
```

**Network Errors**:
- Handled gracefully
- User-friendly error messages
- Retry mechanisms where appropriate

### Backend Error Handling

**Error Middleware**:
```javascript
export const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.id || 'anonymous'
  });

  // Handle specific error types
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
  }

  // Return appropriate status code
  res.status(statusCode).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};
```

---

## Security Best Practices

### Implemented Practices

1. **JWT Tokens**:
   - ✅ 24-hour expiration
   - ✅ Secure signing with secret
   - ✅ Token validation on every request

2. **HTTP-Only Cookies**:
   - ✅ Backend sets HTTP-Only cookies
   - ✅ Prevents XSS attacks
   - ✅ Automatic token transmission

3. **Authorization Headers**:
   - ✅ Fallback for mobile/API clients
   - ✅ Automatic attachment via interceptor
   - ✅ Bearer token format

4. **Route Protection**:
   - ✅ All admin routes protected
   - ✅ Authentication hooks on every page
   - ✅ Automatic redirect on unauthorized access

5. **Token Storage**:
   - ✅ localStorage for frontend (Authorization header)
   - ✅ HTTP-Only cookies for backend (more secure)
   - ✅ Automatic cleanup on logout

6. **Error Handling**:
   - ✅ Global error interceptor
   - ✅ Automatic logout on 401/403
   - ✅ User-friendly error messages

7. **Role-Based Access**:
   - ✅ Role verification in tokens
   - ✅ Backend role authorization
   - ✅ Frontend role checks

### Security Considerations

#### Current Implementation
- ✅ Token-based authentication
- ✅ Route protection
- ✅ Automatic token validation
- ✅ Error handling
- ✅ Secure cookie configuration

#### Future Enhancements
- [ ] Token refresh mechanism
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] Content Security Policy (CSP)
- [ ] XSS protection headers
- [ ] Session management
- [ ] Two-factor authentication (2FA)
- [ ] Audit logging

---

## Security Flow Diagrams

### Login Flow

```
User → Login Page → Submit Credentials
  ↓
Backend → Validate Credentials
  ↓
Backend → Generate JWT Token
  ↓
Backend → Set HTTP-Only Cookie
  ↓
Backend → Return Token in Response
  ↓
Frontend → Store Token in localStorage
  ↓
Frontend → Redirect to Dashboard
```

### Request Flow

```
Frontend → Make API Request
  ↓
Axios Interceptor → Attach Token to Header
  ↓
Backend → Receive Request
  ↓
Backend Middleware → Verify Token
  ↓
Backend → Process Request
  ↓
Backend → Return Response
  ↓
Frontend → Handle Response
```

### Logout Flow

```
User → Click Logout
  ↓
Frontend → Clear localStorage
  ↓
Frontend → Call Backend Logout
  ↓
Backend → Clear HTTP-Only Cookie
  ↓
Frontend → Redirect to Login
```

### Error Flow

```
Request → Backend
  ↓
Backend → Token Invalid/Expired
  ↓
Backend → Return 401/403
  ↓
Frontend Interceptor → Catch Error
  ↓
Frontend → Clear Tokens
  ↓
Frontend → Redirect to Login
```

---

## Testing Security

### Manual Testing Checklist

- [x] Cannot access admin pages without login
- [x] Redirects to login on invalid token
- [x] Logs out automatically on token expiration
- [x] Clears tokens on logout
- [x] 404 page doesn't show unauthorized links
- [x] API requests include Authorization header
- [x] 401/403 errors handled gracefully
- [x] Token validation works correctly

### Security Testing

1. **Token Validation**:
   - Remove token → Should redirect to login
   - Use invalid token → Should redirect to login
   - Use expired token → Should redirect to login

2. **Route Protection**:
   - Access `/admin` without login → Should redirect
   - Access `/admin/students` without login → Should redirect
   - Access protected routes directly → Should redirect

3. **API Security**:
   - Make request without token → Should return 401
   - Make request with invalid token → Should return 403
   - Make request with expired token → Should return 403

---

## Configuration

### Environment Variables

**Backend**:
- `JWT_SECRET`: Secret key for signing tokens
- `NODE_ENV`: Environment (development/production)

**Frontend**:
- API base URL configured in `lib/api.js`
- `withCredentials: true` for cookie support

### Token Configuration

- **Expiration**: 24 hours
- **Algorithm**: HS256
- **Storage**: localStorage (frontend) + HTTP-Only cookie (backend)

---

## Troubleshooting

### Common Issues

1. **Token Not Attached**:
   - Check localStorage for token
   - Verify axios interceptor is working
   - Check network tab for Authorization header

2. **401 Unauthorized**:
   - Token missing or invalid
   - Check token in localStorage
   - Verify token format

3. **403 Forbidden**:
   - Token expired
   - Insufficient permissions
   - Check token expiration

4. **Redirect Loop**:
   - Check authentication hook
   - Verify token validation
   - Check route protection logic

---

## Conclusion

The security implementation follows industry best practices:

1. **Multi-layer Protection**:
   - Frontend route guards
   - Backend middleware
   - Token validation

2. **Automatic Security**:
   - Interceptors handle errors
   - Automatic logout on errors
   - Token validation on every request

3. **User Experience**:
   - Smooth redirects
   - Loading states
   - Clear error messages

4. **Maintainability**:
   - Centralized auth hooks
   - Reusable patterns
   - Clear documentation

---

**Last Updated**: Current Date  
**Version**: 1.0.0  
**Maintained By**: Development Team

