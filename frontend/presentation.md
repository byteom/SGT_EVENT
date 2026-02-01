# SGT University Event Management System - Frontend Documentation

## 📌 Project Overview

Ye ek **Event Management System** hai jo SGT University ke events ko manage karne ke liye banaya gaya hai. Isme 4 tarah ke users hain:

1. **Admin** - Super admin jo pura system control karta hai
2. **Event Manager** - Jo events create aur manage karta hai
3. **Student** - Jo events mein register karta hai aur attend karta hai
4. **Volunteer** - Jo events mein help karta hai aur QR scan karta hai

---

## 🛠️ Tech Stack

### Frontend Technologies:
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.3 | React framework with App Router |
| **React** | 19.2.0 | UI Library |
| **Tailwind CSS** | 4.1.17 | Styling framework |
| **Axios** | 1.13.2 | HTTP requests (API calls) |
| **Zustand** | 5.0.8 | State management |
| **SWR** | 2.3.6 | Data fetching & caching |
| **Recharts** | 3.4.1 | Charts & analytics graphs |
| **html5-qrcode** | 2.3.8 | QR code scanning |
| **react-qr-code** | 2.0.18 | QR code generation |
| **xlsx** | 0.18.5 | Excel file export |

### Backend:
- **API URL**: `https://sgtu-event-backend.vercel.app/api`
- Backend alag repository mein hai (Node.js + Express + PostgreSQL)

---

## 📁 Folder Structure

```
sgtu-event-frontend/
├── app/                    # Next.js App Router pages
│   ├── page.jsx           # Login page (/)
│   ├── layout.jsx         # Root layout
│   ├── admin/             # Admin panel pages
│   ├── event-manager/     # Event manager pages
│   ├── student/           # Student pages
│   └── volunteer/         # Volunteer pages
│
├── components/            # Reusable UI components
│   ├── admin/            # Admin-specific components
│   ├── event-manager/    # Event manager components
│   ├── student/          # Student components
│   └── volunteer/        # Volunteer components
│
├── hooks/                # Custom React hooks
│   ├── useAuth.js       # Authentication hooks
│   └── useWebSocket.js  # WebSocket connection hook
│
├── lib/                  # Utility files
│   ├── api.js           # Axios instance with interceptors
│   ├── auth.js          # Authentication functions
│   ├── utils.js         # Helper functions
│   └── websocket.js     # WebSocket configuration
│
├── styles/              # Global CSS files
└── public/              # Static assets (images, icons)
```

---

## 🔐 Authentication System

### Login Flow (`app/page.jsx`):

```
User opens app → Login Page → Select Role → Enter Credentials → API Call → Token Save → Redirect
```

### 4 Types of Authentication:

| Role | Token Key | Login API | Redirect |
|------|-----------|-----------|----------|
| Admin | `admin_token` | `/admin/login` | `/admin` |
| Event Manager | `event_manager_token` | `/event-manager/login` | `/event-manager` |
| Student | `token` + `role=student` | `/student/login` | `/student` |
| Volunteer | `token` + `role=volunteer` | `/volunteer/login` | `/volunteer` |

### Token Storage (localStorage):
```javascript
// Admin
localStorage.setItem("admin_token", token);
localStorage.setItem("admin_name", name);

// Event Manager
localStorage.setItem("event_manager_token", token);
localStorage.setItem("event_manager_name", name);
localStorage.setItem("event_manager_email", email);

// Student/Volunteer
localStorage.setItem("token", token);
localStorage.setItem("role", "student" | "volunteer");
```

### Auth Hooks (`hooks/useAuth.js`):
```javascript
useAdminAuth()        // Admin pages ke liye
useEventManagerAuth() // Event manager pages ke liye
useStudentAuth()      // Student pages ke liye
useVolunteerAuth()    // Volunteer pages ke liye
```

Ye hooks check karte hain ki user logged in hai ya nahi. Agar nahi hai to `/` pe redirect kar dete hain.

---

## 📱 Page-wise Breakdown

### 1️⃣ ADMIN PANEL (`/admin/*`)

| Page | Path | Functionality |
|------|------|---------------|
| Dashboard | `/admin` | Overview stats, quick actions |
| Events | `/admin/events` | All events list, approve/reject |
| Students | `/admin/students` | Student management |
| Volunteers | `/admin/volunteers` | Volunteer management |
| Event Managers | `/admin/event-managers` | Event manager CRUD |
| Stalls | `/admin/stalls` | Stall management |
| Scans | `/admin/scans` | Check-in/out logs |
| Analytics | `/admin/analytics` | Detailed analytics |
| Reports | `/admin/reports` | Generate reports |
| Settings | `/admin/settings` | System settings |
| Reset | `/admin/reset` | Data reset options |

**Admin ka kaam:**
- Events approve/reject karna
- Users manage karna (students, volunteers, event managers)
- System-wide analytics dekhna
- Reports generate karna

---

### 2️⃣ EVENT MANAGER PANEL (`/event-manager/*`)

| Page | Path | Functionality |
|------|------|---------------|
| Dashboard | `/event-manager` | My events overview |
| Profile | `/event-manager/profile` | Profile settings |
| Events List | `/event-manager/events` | My created events |
| Create Event | `/event-manager/events/create` | New event form |
| Event Detail | `/event-manager/events/[id]` | Single event details |
| Edit Event | `/event-manager/events/[id]/edit` | Edit event |
| Analytics | `/event-manager/analytics` | Event-wise analytics |

**Event Manager ka kaam:**
- Events create karna
- Event details fill karna (name, date, venue, price, capacity)
- Volunteers assign karna
- Stalls assign karna
- Registrations dekhna
- Analytics monitor karna

**Event Creation Fields:**
```
- Event Name
- Event Code (unique)
- Event Type (FREE / PAID)
- Price (if PAID)
- Category (Workshop, Seminar, Cultural, etc.)
- Description
- Venue
- Start Date & End Date
- Registration Start & End Date
- Max Capacity
- Banner Image
```

---

### 3️⃣ STUDENT PANEL (`/student/*`)

| Page | Path | Functionality |
|------|------|---------------|
| Dashboard | `/student` | Welcome, quick stats |
| Profile | `/student/profile` | Student profile |
| Events | `/student/events` | Browse all events |
| Event Detail | `/student/events/[id]` | Event info + Register |
| My Events | `/student/my-events` | Registered events |
| My QR | `/student/qr` | Registration QR codes |
| Ranking | `/student/ranking` | Stall visit rankings |
| Stall Scan | `/student/stall-scan` | Scan stall QR |
| My Visits | `/student/my-visits` | Stall visit history |
| Feedback | `/student/feedback` | Give stall feedback |
| Feedback Rate | `/student/feedback-rate` | Rate stall |
| Feedback Success | `/student/feedback-success` | Success page |

**Student ka kaam:**
- Events browse karna
- Events mein register karna (FREE ya PAID)
- Payment karna (Razorpay integration)
- QR code dikhana check-in ke liye
- Stalls visit karna aur feedback dena

**Registration Flow:**
```
Browse Events → Event Detail → Register Button
    ↓
FREE Event: Direct register → Success
    ↓
PAID Event: Initiate Payment → Razorpay → Verify → Success
```

---

### 4️⃣ VOLUNTEER PANEL (`/volunteer/*`)

| Page | Path | Functionality |
|------|------|---------------|
| Dashboard | `/volunteer` | Assigned events |
| Profile | `/volunteer/profile` | Volunteer profile |
| Scanner | `/volunteer/scanner` | QR code scanner |
| Scan Success | `/volunteer/scanner/success` | Scan success page |

**Volunteer ka kaam:**
- Assigned events dekhna
- Students ka QR scan karna
- Check-in / Check-out karna

**Scanner Flow:**
```
Open Scanner → Camera Permission → Scan QR → API Call → Success/Error
```

---

## 🔄 Data Flow / Workflow

### 1. Event Creation to Registration:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Event Manager  │────▶│     Admin       │────▶│    Student      │
│  Creates Event  │     │  Approves Event │     │  Registers      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
   DRAFT Status         APPROVED Status          CONFIRMED Status
```

### 2. Check-in Flow:

```
┌──────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐
│ Student  │────▶│ Shows QR  │────▶│ Volunteer│────▶│  Scan    │
│ Arrives  │     │ on Phone  │     │  Scans   │     │ Success  │
└──────────┘     └───────────┘     └───────────┘     └──────────┘
```

### 3. Payment Flow (PAID Events):

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Student    │────▶│   Initiate   │────▶│   Razorpay   │────▶│   Verify     │
│   Clicks     │     │   Payment    │     │   Gateway    │     │   Payment    │
│   Register   │     │   API Call   │     │   Opens      │     │   API Call   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                      │
                                                                      ▼
                                                              Registration
                                                              Confirmed
```

---

## 🔌 API Integration (`lib/api.js`)

### Axios Instance:
```javascript
const api = axios.create({
  baseURL: "https://sgtu-event-backend.vercel.app/api",
  withCredentials: true,
});
```

### Request Interceptor:
- Automatically adds `Authorization: Bearer <token>` header
- Checks for correct token based on route

### Response Interceptor:
- Handles 401 (Unauthorized) - Token missing
- Handles 403 (Forbidden) - Token expired
- Auto logout on auth errors

### Common API Endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/admin/login` | Admin login |
| POST | `/event-manager/login` | Event manager login |
| POST | `/student/login` | Student login |
| POST | `/volunteer/login` | Volunteer login |
| GET | `/admin/events` | Get all events (admin) |
| GET | `/event-manager/events` | Get my events |
| POST | `/event-manager/events` | Create event |
| GET | `/student/events` | Browse events |
| POST | `/student/events/:id/register` | Register for event |
| POST | `/student/events/:id/payment/initiate` | Start payment |
| POST | `/student/events/:id/payment/verify` | Verify payment |
| POST | `/check-in-out/scan` | Volunteer scan QR |

---

## 🎨 UI Components Structure

### Layout Components:
```
┌────────────────────────────────────────────────────────────┐
│                        Header                               │
├──────────────┬─────────────────────────────────────────────┤
│              │                                              │
│   Sidebar    │              Main Content                    │
│   (Desktop)  │                                              │
│              │                                              │
│              │                                              │
├──────────────┴─────────────────────────────────────────────┤
│                    Mobile Nav (Mobile Only)                 │
└────────────────────────────────────────────────────────────┘
```

### Component Files:
```
components/
├── admin/
│   ├── AdminSidebar.jsx      # Left navigation
│   ├── AdminHeader.jsx       # Top bar with logout
│   └── AdminMobileNav.jsx    # Bottom navigation (mobile)
│
├── event-manager/
│   ├── EventManagerSidebar.jsx
│   ├── EventManagerHeader.jsx
│   └── EventManagerMobileNav.jsx
│
├── student/
│   ├── StudentSidebar.jsx
│   ├── StudentHeader.jsx
│   └── StudentMobileNav.jsx
│
└── volunteer/
    ├── VolunteerSidebar.jsx
    ├── VolunteerHeader.jsx
    └── VolunteerMobileNav.jsx
```

---

## 📊 Analytics Page Logic

### Registration Count Calculation:

```javascript
// PAID Events ke liye:
// Total Registrations = Sabhi registrations
// Confirmed = Sirf jinki payment_status === 'COMPLETED'
// Pending = Jinki payment_status === 'PENDING'

// FREE Events ke liye:
// Confirmed = registration_status === 'CONFIRMED' ya payment_status === 'NOT_REQUIRED'
```

### Stats Displayed:
- Total Registrations
- Confirmed Attendees
- Total Revenue
- Active Volunteers
- Registration Status Breakdown (Confirmed, Pending, Cancelled, Waitlisted)
- Payment Status Breakdown (Completed, Pending, Failed)

---

## 🔒 Security Features

1. **Token-based Authentication**
   - JWT tokens stored in localStorage
   - Auto-expire handling

2. **Route Protection**
   - useAuth hooks check authentication
   - Redirect to login if not authenticated

3. **API Interceptors**
   - Auto token attachment
   - Auto logout on 401/403

4. **Role-based Access**
   - Different tokens for different roles
   - Can't access admin panel with student token

---

## 📱 Responsive Design

- **Desktop**: Sidebar visible, full layout
- **Mobile**: Bottom navigation, hamburger menu
- **Tailwind Breakpoints**:
  - `sm`: 640px+
  - `md`: 768px+ (Sidebar shows)
  - `lg`: 1024px+

---

## 🚀 Deployment

- **Platform**: Vercel
- **Build Command**: `npm run build`
- **Framework**: Next.js 16 with Turbopack

---

## 📋 Key Features Summary

| Feature | Implementation |
|---------|----------------|
| Login | Multi-role login with password reset |
| Events | CRUD operations with approval workflow |
| Registration | FREE + PAID (Razorpay) |
| QR Codes | Generation + Scanning |
| Analytics | Charts with Recharts |
| Excel Export | xlsx library |
| Dark Mode | Tailwind dark: classes |
| Real-time | WebSocket for live updates |

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Token expired | Auto logout via interceptor |
| Payment failed | Retry option available |
| Camera not working | Permission prompt + retry |
| Build failed | Check JSX syntax errors |

---

## 📞 API Response Format

```javascript
// Success Response
{
  success: true,
  message: "Operation successful",
  data: { ... }
}

// Error Response
{
  success: false,
  message: "Error message",
  error: { ... }
}
```

---

## 🎯 Quick Reference

### Start Development:
```bash
npm run dev
```

### Build for Production:
```bash
npm run build
```

### Key Files to Understand:
1. `app/page.jsx` - Login page
2. `lib/api.js` - API configuration
3. `hooks/useAuth.js` - Authentication
4. `app/*/page.jsx` - Main pages

---

## 📝 Notes for Presentation

1. **Architecture**: Next.js App Router (file-based routing)
2. **State Management**: React hooks + Zustand
3. **Styling**: Tailwind CSS (utility-first)
4. **API**: RESTful with Axios
5. **Auth**: JWT token-based
6. **Payment**: Razorpay integration
7. **QR**: html5-qrcode library

---

*Last Updated: November 2025*
*Project: SGT University Event Management System*
