# SGT Event Frontend - Technical Documentation

## 📚 Table of Contents
1. [Next.js App Router Architecture](#1-nextjs-app-router-architecture)
2. [React Hooks Deep Dive](#2-react-hooks-deep-dive)
3. [State Management](#3-state-management)
4. [API Layer & Axios Interceptors](#4-api-layer--axios-interceptors)
5. [Authentication Implementation](#5-authentication-implementation)
6. [QR Code Implementation](#6-qr-code-implementation)
7. [Payment Gateway Integration](#7-payment-gateway-integration)
8. [WebSocket Real-time Updates](#8-websocket-real-time-updates)
9. [Tailwind CSS Architecture](#9-tailwind-css-architecture)
10. [Performance Optimizations](#10-performance-optimizations)
11. [Error Handling Patterns](#11-error-handling-patterns)
12. [Code Patterns Used](#12-code-patterns-used)

---

## 1. Next.js App Router Architecture

### What is App Router?
Next.js 13+ introduced App Router which uses **file-based routing** in the `app/` folder.

### Folder = Route
```
app/
├── page.jsx                    → /
├── admin/
│   ├── page.jsx               → /admin
│   ├── events/
│   │   └── page.jsx           → /admin/events
│   └── students/
│       └── page.jsx           → /admin/students
├── student/
│   ├── page.jsx               → /student
│   └── events/
│       ├── page.jsx           → /student/events
│       └── [id]/
│           └── page.jsx       → /student/events/123 (dynamic)
```

### Dynamic Routes `[id]`
```jsx
// app/student/events/[id]/page.jsx
import { useParams } from "next/navigation";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id;  // URL se id nikal li
  
  // /student/events/abc123 → eventId = "abc123"
}
```

### Layout System
```jsx
// app/layout.jsx - Root layout (sabhi pages pe apply)
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <link href="https://fonts.googleapis.com/..." />  {/* Fonts */}
        <script src="https://checkout.razorpay.com/..." /> {/* Razorpay */}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### "use client" Directive
```jsx
"use client";  // Ye line zaroori hai client-side features ke liye

// Without "use client" → Server Component (no useState, useEffect, browser APIs)
// With "use client" → Client Component (useState, useEffect, localStorage sab kaam karega)
```

---

## 2. React Hooks Deep Dive

### useState - State Management
```jsx
const [loading, setLoading] = useState(false);
const [events, setEvents] = useState([]);
const [selectedEvent, setSelectedEvent] = useState(null);

// Usage:
setLoading(true);           // Simple value
setEvents([...events, newEvent]);  // Array update
setSelectedEvent(prev => ({ ...prev, name: "New Name" }));  // Object update
```

### useEffect - Side Effects
```jsx
// Component mount pe ek baar
useEffect(() => {
  fetchData();
}, []);  // Empty dependency array

// Jab dependency change ho
useEffect(() => {
  if (eventId) {
    fetchEventDetails(eventId);
  }
}, [eventId]);  // eventId change hone pe run hoga

// Cleanup function
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  
  return () => {
    clearInterval(timer);  // Component unmount pe cleanup
  };
}, []);
```

### useRef - Mutable Reference
```jsx
const html5QrRef = useRef(null);        // QR scanner instance
const mountedRef = useRef(true);         // Component mounted check
const lastScanTimeRef = useRef(0);       // Last scan timestamp

// useRef vs useState:
// useState → Re-render hota hai value change pe
// useRef → Re-render NAHI hota, direct mutation allowed
```

### useRouter - Navigation
```jsx
import { useRouter } from "next/navigation";

const router = useRouter();

router.push("/student/events");     // Navigate with history
router.replace("/");                // Navigate without history (back nahi ja sakte)
router.back();                      // Go back
```

### useParams - URL Parameters
```jsx
import { useParams } from "next/navigation";

// URL: /student/events/abc-123
const params = useParams();
console.log(params.id);  // "abc-123"
```

### Custom Hook Example
```jsx
// hooks/useAuth.js
export function useStudentAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      
      if (!token || role !== "student") {
        router.replace("/");  // Not authenticated
        return;
      }
      
      setIsAuthenticated(true);
      setIsChecking(false);
    };
    
    checkAuth();
  }, [router]);

  return { isAuthenticated, isChecking };
}

// Usage in component:
const { isAuthenticated, isChecking } = useStudentAuth();

if (isChecking) return <Loading />;
if (!isAuthenticated) return null;
```

---

## 3. State Management

### Local State (useState)
```jsx
// Component-level state
const [events, setEvents] = useState([]);
const [loading, setLoading] = useState(false);
```

### Zustand (Global State)
```jsx
// lib/store.js
import { create } from 'zustand';

const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  notifications: [],
  addNotification: (notif) => set((state) => ({
    notifications: [...state.notifications, notif]
  })),
}));

// Usage:
const user = useStore((state) => state.user);
const setUser = useStore((state) => state.setUser);
```

### SWR (Data Fetching + Caching)
```jsx
import useSWR from 'swr';

const fetcher = (url) => api.get(url).then(res => res.data);

function EventsList() {
  const { data, error, isLoading, mutate } = useSWR('/events', fetcher);
  
  // Auto re-fetch on focus
  // Auto caching
  // mutate() for manual refresh
  
  if (isLoading) return <Loading />;
  if (error) return <Error />;
  
  return <div>{data.map(...)}</div>;
}
```

---

## 4. API Layer & Axios Interceptors

### Axios Instance Creation
```jsx
// lib/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://sgtu-event-backend.vercel.app/api",
  withCredentials: true,  // Cookies bhejna hai
});
```

### Request Interceptor (Before Request)
```jsx
api.interceptors.request.use(
  (config) => {
    // Request bhejne se pehle token add karo
    if (typeof window !== "undefined") {
      const adminToken = localStorage.getItem("admin_token");
      const eventManagerToken = localStorage.getItem("event_manager_token");
      const token = localStorage.getItem("token");

      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      } else if (eventManagerToken) {
        config.headers.Authorization = `Bearer ${eventManagerToken}`;
      } else if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

### Response Interceptor (After Response)
```jsx
api.interceptors.response.use(
  (response) => response,  // Success - as is return
  (error) => {
    // Error handling
    if (error.response?.status === 401) {
      // Token invalid - logout
      localStorage.clear();
      window.location.href = "/";
    }
    
    if (error.response?.status === 403) {
      // Token expired
      if (error.response?.data?.message?.includes("expired")) {
        localStorage.clear();
        window.location.href = "/";
      }
    }
    
    return Promise.reject(error);
  }
);
```

### API Call Pattern
```jsx
// GET Request
const fetchEvents = async () => {
  try {
    setLoading(true);
    const response = await api.get("/student/events");
    
    if (response.data?.success) {
      setEvents(response.data.data.events);
    }
  } catch (error) {
    console.error("Error:", error);
    alert(error.response?.data?.message || "Failed to fetch");
  } finally {
    setLoading(false);
  }
};

// POST Request
const createEvent = async (eventData) => {
  try {
    const response = await api.post("/event-manager/events", eventData);
    
    if (response.data?.success) {
      alert("Event created!");
      router.push("/event-manager/events");
    }
  } catch (error) {
    alert(error.response?.data?.message || "Failed to create");
  }
};

// DELETE Request
const deleteEvent = async (id) => {
  if (!confirm("Are you sure?")) return;
  
  try {
    await api.delete(`/event-manager/events/${id}`);
    fetchEvents();  // Refresh list
  } catch (error) {
    alert("Failed to delete");
  }
};
```

---

## 5. Authentication Implementation

### Login Flow Code
```jsx
// lib/auth.js
export async function studentLogin(registrationNo, password) {
  try {
    const response = await api.post("/student/login", {
      registration_no: registrationNo,
      password: password,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Login failed",
    };
  }
}

export function saveAuthData(token, role, userData) {
  if (role === "admin") {
    localStorage.setItem("admin_token", token);
    localStorage.setItem("admin_name", userData?.name || "Admin");
  } else if (role === "event_manager") {
    localStorage.setItem("event_manager_token", token);
    localStorage.setItem("event_manager_name", userData?.name);
    localStorage.setItem("event_manager_email", userData?.email);
  } else {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
  }
}
```

### Protected Route Pattern
```jsx
export default function ProtectedPage() {
  const { isAuthenticated, isChecking } = useStudentAuth();
  
  // Loading state
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  
  // Not authenticated - hook will redirect, return null
  if (!isAuthenticated) {
    return null;
  }
  
  // Authenticated - show content
  return <div>Protected Content</div>;
}
```

### JWT Token Structure
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.  // Header (base64)
eyJpZCI6IjEyMyIsInJvbGUiOiJzdHVkZW50In0.  // Payload (base64)
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV  // Signature

// Decoded Payload:
{
  "id": "123",
  "role": "student",
  "exp": 1234567890  // Expiry timestamp
}
```

---

## 6. QR Code Implementation

### QR Code Generation (Student Side)
```jsx
import QRCode from "react-qr-code";

function StudentQRPage() {
  const [registrations, setRegistrations] = useState([]);
  
  return (
    <div>
      {registrations.map((reg) => (
        <div key={reg.id} className="bg-white p-4 rounded-lg">
          <QRCode
            value={reg.qr_code_data}  // Backend se aaya QR data
            size={200}
            level="H"  // Error correction level
          />
          <p>{reg.event_name}</p>
        </div>
      ))}
    </div>
  );
}
```

### QR Code Scanning (Volunteer Side)
```jsx
import { Html5Qrcode } from "html5-qrcode";

function ScannerPage() {
  const html5QrRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const startScanner = async (cameraId) => {
    try {
      // Create instance
      html5QrRef.current = new Html5Qrcode("qr-reader");
      
      // Start scanning
      await html5QrRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,  // Success callback
        onScanError     // Error callback
      );
      
      setIsScanning(true);
    } catch (err) {
      console.error("Camera error:", err);
    }
  };
  
  const onScanSuccess = async (decodedText) => {
    // Duplicate scan prevention
    const now = Date.now();
    if (now - lastScanTimeRef.current < 5000) return;
    lastScanTimeRef.current = now;
    
    try {
      // API call to verify QR
      const response = await api.post("/check-in-out/scan", {
        qr_data: decodedText,
        scan_type: "CHECK_IN",
      });
      
      if (response.data?.success) {
        // Show success
        setSuccessData(response.data.data);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Scan failed");
    }
  };
  
  const stopScanner = async () => {
    if (html5QrRef.current?.isScanning) {
      await html5QrRef.current.stop();
      html5QrRef.current.clear();
    }
    setIsScanning(false);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);
  
  return (
    <div>
      <div id="qr-reader" style={{ width: "100%" }} />
      <button onClick={isScanning ? stopScanner : startScanner}>
        {isScanning ? "Stop" : "Start"} Scanner
      </button>
    </div>
  );
}
```

### Camera Selection
```jsx
const [cameras, setCameras] = useState([]);

useEffect(() => {
  const getCameras = async () => {
    const devices = await Html5Qrcode.getCameras();
    setCameras(devices);
    
    // Default: back camera prefer karo
    const backCamera = devices.find(d => 
      d.label.toLowerCase().includes("back")
    );
    setCurrentCameraId(backCamera?.id || devices[0]?.id);
  };
  
  getCameras();
}, []);
```

---

## 7. Payment Gateway Integration

### Razorpay Flow
```
1. Frontend: Initiate Payment API call
2. Backend: Create Razorpay Order, return order_id
3. Frontend: Open Razorpay Checkout
4. User: Completes payment
5. Razorpay: Returns payment response
6. Frontend: Verify Payment API call
7. Backend: Verify signature, confirm registration
```

### Implementation
```jsx
// Step 1: Load Razorpay Script (in layout.jsx)
<script src="https://checkout.razorpay.com/v1/checkout.js" />

// Step 2: Initiate Payment
const handleInitiatePayment = async () => {
  try {
    setLoading(true);
    
    // API call to create order
    const response = await api.post(`/student/events/${eventId}/payment/initiate`);
    
    if (response.data?.success) {
      const paymentData = response.data.data;
      
      // Step 3: Open Razorpay
      const options = {
        key: paymentData.razorpay_key,
        amount: paymentData.order.amount * 100,  // Paise mein
        currency: "INR",
        name: "SGT Event Portal",
        description: `Registration for ${eventName}`,
        order_id: paymentData.order.id,
        
        handler: async function (response) {
          // Step 4: Payment successful, verify
          await verifyPayment(response);
        },
        
        prefill: {
          name: studentName,
          email: studentEmail,
        },
        
        theme: {
          color: "#2563eb",
        },
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    }
  } catch (error) {
    alert("Failed to initiate payment");
  } finally {
    setLoading(false);
  }
};

// Step 5: Verify Payment
const verifyPayment = async (razorpayResponse) => {
  try {
    const response = await api.post(`/student/events/${eventId}/payment/verify`, {
      razorpay_order_id: razorpayResponse.razorpay_order_id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature,
    });
    
    if (response.data?.success) {
      alert("Payment successful! Registration confirmed.");
      router.push("/student/my-events");
    }
  } catch (error) {
    alert("Payment verification failed");
  }
};
```

### Payment Status Handling
```jsx
// Registration statuses:
// PENDING → Payment initiated but not completed
// COMPLETED → Payment successful
// FAILED → Payment failed

// Display logic:
const getPaymentBadge = (status) => {
  switch (status) {
    case "COMPLETED":
      return <span className="bg-green-100 text-green-700">Paid</span>;
    case "PENDING":
      return <span className="bg-yellow-100 text-yellow-700">Pending</span>;
    case "FAILED":
      return <span className="bg-red-100 text-red-700">Failed</span>;
    default:
      return null;
  }
};
```

---

## 8. WebSocket Real-time Updates

### WebSocket Connection
```jsx
// lib/websocket.js
import ReconnectingWebSocket from "reconnecting-websocket";

const WS_URL = "wss://sgtu-event-backend.vercel.app/ws";

export function createWebSocket(token) {
  const ws = new ReconnectingWebSocket(`${WS_URL}?token=${token}`);
  
  ws.onopen = () => {
    console.log("WebSocket connected");
  };
  
  ws.onclose = () => {
    console.log("WebSocket disconnected");
  };
  
  return ws;
}
```

### useWebSocket Hook
```jsx
// hooks/useWebSocket.js
export function useWebSocket(onMessage) {
  const wsRef = useRef(null);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    wsRef.current = createWebSocket(token);
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    
    return () => {
      wsRef.current?.close();
    };
  }, [onMessage]);
  
  const sendMessage = (message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };
  
  return { sendMessage };
}

// Usage:
function LiveScansPage() {
  const [scans, setScans] = useState([]);
  
  useWebSocket((data) => {
    if (data.type === "NEW_SCAN") {
      setScans(prev => [data.scan, ...prev]);
    }
  });
  
  return <ScansList scans={scans} />;
}
```

---

## 9. Tailwind CSS Architecture

### Configuration
```js
// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  darkMode: "class",  // Dark mode via class
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        "primary-dark": "#1d4ed8",
        accent: "#f59e0b",
        "dark-background": "#0f172a",
        "card-dark": "#1e293b",
      },
    },
  },
};
```

### Responsive Design
```jsx
// Mobile first approach
<div className="
  p-4           // Mobile: padding 16px
  sm:p-6        // 640px+: padding 24px
  md:p-8        // 768px+: padding 32px
  lg:p-10       // 1024px+: padding 40px
">

// Hide/Show based on screen
<div className="hidden md:block">Desktop Only</div>
<div className="block md:hidden">Mobile Only</div>

// Grid responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 1 column on mobile, 2 on tablet, 4 on desktop */}
</div>
```

### Dark Mode Implementation
```jsx
// Toggle function
const toggleTheme = () => {
  const next = theme === "light" ? "dark" : "light";
  setTheme(next);
  localStorage.setItem("theme", next);
  document.documentElement.classList.toggle("dark", next === "dark");
};

// CSS classes
<div className="
  bg-white           // Light mode
  dark:bg-gray-900   // Dark mode
  text-gray-900 
  dark:text-white
">
```

### Common Patterns
```jsx
// Card
<div className="bg-card-background dark:bg-card-dark p-6 rounded-xl border border-light-gray-border shadow-soft">

// Button Primary
<button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition">

// Input
<input className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary" />

// Status Badge
<span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
```

---

## 10. Performance Optimizations

### Image Optimization
```jsx
import Image from "next/image";

// Next.js Image component - auto optimization
<Image
  src="/images/logo.png"
  alt="Logo"
  width={200}
  height={200}
  loading="eager"     // Important images
  // loading="lazy"   // Below fold images
  priority           // LCP image
/>
```

### Code Splitting (Automatic)
```
Next.js automatically splits code by route.
/admin → loads admin bundle
/student → loads student bundle
```

### Memoization
```jsx
import { useMemo, useCallback } from "react";

// useMemo - expensive calculations cache
const filteredEvents = useMemo(() => {
  return events.filter(e => e.status === "APPROVED");
}, [events]);

// useCallback - function reference cache
const handleClick = useCallback(() => {
  setCount(c => c + 1);
}, []);
```

### Lazy Loading Components
```jsx
import dynamic from "next/dynamic";

// Heavy component lazy load
const HeavyChart = dynamic(() => import("./HeavyChart"), {
  loading: () => <p>Loading chart...</p>,
  ssr: false,  // Client-side only
});
```

### Debouncing Search
```jsx
const [searchTerm, setSearchTerm] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchTerm);
  }, 300);  // 300ms delay
  
  return () => clearTimeout(timer);
}, [searchTerm]);

// Use debouncedSearch for API calls
useEffect(() => {
  if (debouncedSearch) {
    searchEvents(debouncedSearch);
  }
}, [debouncedSearch]);
```

---

## 11. Error Handling Patterns

### Try-Catch Pattern
```jsx
const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await api.get("/endpoint");
    setData(response.data);
    
  } catch (error) {
    // API error
    if (error.response) {
      setError(error.response.data.message);
    }
    // Network error
    else if (error.request) {
      setError("Network error. Please check your connection.");
    }
    // Other error
    else {
      setError("Something went wrong.");
    }
  } finally {
    setLoading(false);
  }
};
```

### Error Boundary (Class Component)
```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error("Error:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

// Usage:
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Form Validation
```jsx
const validateForm = () => {
  const errors = {};
  
  if (!formData.name?.trim()) {
    errors.name = "Name is required";
  }
  
  if (!formData.email?.includes("@")) {
    errors.email = "Invalid email";
  }
  
  if (formData.price && formData.price < 0) {
    errors.price = "Price cannot be negative";
  }
  
  setFormErrors(errors);
  return Object.keys(errors).length === 0;
};

const handleSubmit = () => {
  if (!validateForm()) return;
  // Submit form
};
```

---

## 12. Code Patterns Used

### Container-Presenter Pattern
```jsx
// Container: Data fetching logic
function EventsContainer() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchEvents();
  }, []);
  
  return <EventsList events={events} loading={loading} />;
}

// Presenter: Pure UI
function EventsList({ events, loading }) {
  if (loading) return <Spinner />;
  return events.map(e => <EventCard key={e.id} event={e} />);
}
```

### Compound Components
```jsx
// Tab component with children
<Tabs defaultTab="overview">
  <Tab name="overview" label="Overview">
    <OverviewContent />
  </Tab>
  <Tab name="analytics" label="Analytics">
    <AnalyticsContent />
  </Tab>
</Tabs>
```

### Render Props
```jsx
function DataFetcher({ url, render }) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch(url).then(r => r.json()).then(setData);
  }, [url]);
  
  return render(data);
}

// Usage:
<DataFetcher 
  url="/api/events" 
  render={(data) => <EventsList events={data} />}
/>
```

### Custom Hooks Pattern
```jsx
// Reusable data fetching hook
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(url);
        setData(res.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [url]);
  
  return { data, loading, error };
}

// Usage:
const { data: events, loading } = useFetch("/events");
```

### Higher Order Component (HOC)
```jsx
// withAuth HOC
function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isChecking } = useStudentAuth();
    
    if (isChecking) return <Loading />;
    if (!isAuthenticated) return null;
    
    return <WrappedComponent {...props} />;
  };
}

// Usage:
export default withAuth(StudentDashboard);
```

---

## 📝 Quick Reference Commands

```bash
# Development
npm run dev          # Start dev server (localhost:3000)

# Production
npm run build        # Create production build
npm run start        # Start production server

# Linting
npm run lint         # Check code issues
```

---

## 🔗 Important Links

- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Axios Docs**: https://axios-http.com/docs
- **Razorpay Docs**: https://razorpay.com/docs

---

*Technical Documentation - SGT Event Management System*
*Last Updated: November 2025*
