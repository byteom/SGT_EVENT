# 🚧 Remaining Work - Backend Features Not Yet in Frontend

**Project:** SGT Event Management System  
**Date:** February 1, 2026  
**Status:** Backend Complete, Frontend Partially Implemented

---

## 📊 **Overview**

This document tracks all backend API endpoints and features that are fully implemented and tested in the backend but are **NOT yet built in the frontend UI**. These features are production-ready on the server side and waiting for frontend implementation.

### **Completion Summary**

| Module | Total Routes | Frontend Complete | Remaining | Progress |
|--------|--------------|-------------------|-----------|----------|
| **Admin Panel** | ~60 routes | 15 routes | **45 routes** | 25% ✅ |
| **Event Manager Panel** | ~35 routes | 12 routes | **23 routes** | 34% ✅ |
| **Student Panel** | ~20 routes | 16 routes | **4 routes** | 80% ✅ |
| **Volunteer Panel** | ~6 routes | 6 routes | **0 routes** | 100% ✅ |

---

## 🔴 **Critical Priority Features**

### 1. **Admin Bulk Registration System** (Complete Module Missing)
- Zero frontend implementation
- Critical for mass event registrations
- 12 API endpoints ready

### 2. **Admin Refunds & Cancellations**
- Financial operations module
- Legal compliance requirement
- 3 major endpoints

### 3. **Event Manager Event Creation**
- Event Managers cannot create events from UI
- Core functionality missing

### 4. **Rankings Management System**
- Publish/unpublish controls
- Event-specific rankings view
- 9 endpoints ready

---

## 👑 **ADMIN PANEL - Missing Features**

### **📚 Student Management Module**

#### ✅ **Currently Implemented:**
- `/admin/students` (GET) - View all students
- `/admin/profile` (GET/PUT) - Admin profile management
- `/admin/logout` (POST) - Logout

#### ❌ **Missing in Frontend:**

**1. Student Bulk Upload System**
```
POST   /api/admin/students/bulk-upload
       Description: Upload Excel file to bulk create students
       Use Case: Add 100s/1000s of students at once
       Priority: HIGH
```

```
POST   /api/admin/students/validate-upload
       Description: Validate Excel without inserting (dry-run preview)
       Use Case: Preview errors before actual upload
       Priority: HIGH
```

```
GET    /api/admin/students/upload-template
       Description: Download Excel template with headers
       Use Case: Provide standard format to users
       Priority: HIGH
```

```
GET    /api/admin/students/export
       Description: Export all students to Excel
       Use Case: Backup, reporting, data analysis
       Priority: MEDIUM
```

**2. Student Search**
```
GET    /api/admin/students/search?q=<query>&page=1&limit=20
       Description: Search students by name, email, phone, reg_no, school
       Use Case: Quick student lookup in large database
       Priority: HIGH
```

---

### **📋 Event Bulk Registration Module**

#### ❌ **Completely Missing (12 Endpoints)**

This is a **complete module** with zero frontend implementation. Critical for event operations.

**1. Bulk Registration Operations**
```
POST   /api/admin/events/:eventId/bulk-register/validate
       Description: Validate bulk registration file before upload
       Use Case: Check for errors before processing
       Priority: CRITICAL
```

```
POST   /api/admin/events/:eventId/bulk-register
       Description: Bulk register students to event (unrestricted)
       Use Case: Register entire schools/departments
       Priority: CRITICAL
       Note: No limits for admin (unlike event managers)
```

**2. Template Management**
```
GET    /api/admin/bulk-register/template
       Description: Download generic bulk registration template
       Priority: HIGH
```

```
GET    /api/admin/events/:eventId/bulk-register/template
       Description: Download event-specific registration template
       Priority: HIGH
```

**3. Bulk Registration Logs**
```
GET    /api/admin/bulk-register/logs?page=1&limit=50
       Description: Get all bulk registration logs (platform-wide)
       Use Case: Audit trail, monitoring
       Priority: MEDIUM
```

```
GET    /api/admin/bulk-register/logs/export
       Description: Export all logs to CSV
       Use Case: Compliance, reporting
       Priority: MEDIUM
```

```
GET    /api/admin/events/:eventId/bulk-register/logs
       Description: Get bulk registration logs for specific event
       Priority: MEDIUM
```

```
GET    /api/admin/events/:eventId/bulk-register/logs/export
       Description: Export event-specific logs to CSV
       Priority: MEDIUM
```

**4. Bulk Registration Approval System**
```
GET    /api/admin/bulk-registrations/pending
       Description: Get pending bulk registration requests (>200 students)
       Use Case: Review large requests before processing
       Priority: HIGH
```

```
POST   /api/admin/bulk-registrations/:requestId/approve
       Description: Approve pending bulk registration
       Priority: HIGH
```

```
POST   /api/admin/bulk-registrations/:requestId/reject
       Description: Reject pending bulk registration
       Priority: HIGH
```

**5. Event Capacity Management**
```
PATCH  /api/admin/events/:eventId/capacity
       Description: Update event capacity dynamically
       Use Case: Increase capacity after initial planning
       Priority: MEDIUM
```

---

### **💰 Deregistration & Refunds Module**

#### ❌ **Completely Missing (3 Critical Endpoints)**

Financial operations with legal compliance requirements.

```
POST   /api/admin/registrations/:registrationId/cancel
       Description: Cancel single registration (admin override)
       Use Case: Handle special cases, complaints
       Priority: CRITICAL
       Features: Automatic refund calculation, waitlist promotion
```

```
POST   /api/admin/events/:eventId/cancel
       Description: Cancel entire event with cascade refunds
       Use Case: Event cancellation due to unforeseen circumstances
       Priority: CRITICAL
       Features: Bulk refunds to all registered students
```

```
GET    /api/admin/refunds?page=1&limit=50
       Description: Platform-wide refund history
       Use Case: Financial reconciliation, audit
       Priority: HIGH
       Response: Aggregated stats, refund details
```

---

### **📊 Event Management & Analytics**

#### ✅ **Currently Implemented:**
- `/admin/events` (GET) - List all events
- `/admin/events/:id/approve` (PATCH) - Approve event
- `/admin/events/:id/reject` (PATCH) - Reject event

#### ❌ **Missing in Frontend:**

```
GET    /api/admin/events/pending
       Description: Get all pending event approval requests
       Use Case: Dedicated pending approvals view
       Priority: HIGH
```

```
GET    /api/admin/events/:id
       Description: Get single event details with full stats
       Use Case: Detailed event view before approval
       Priority: HIGH
```

```
GET    /api/admin/events/:id/approval-preview
       Description: Preview event with manager, stalls, volunteers
       Use Case: Complete context for approval decision
       Priority: HIGH
```

```
GET    /api/admin/events/:id/analytics
       Description: Comprehensive event analytics
       Use Case: Deep dive into event performance
       Priority: MEDIUM
       Metrics: Registrations, revenue, attendance, feedback
```

```
GET    /api/admin/events/search?q=<query>&page=1&limit=20
       Description: Search events by name, code, description, manager
       Use Case: Quick event lookup
       Priority: MEDIUM
```

---

### **🏆 Rankings Management Module**

#### ❌ **Completely Missing (9 Endpoints)**

Complete rankings visibility control system.

**1. Platform-Wide Rankings**
```
GET    /api/admin/rankings/all
       Description: Comprehensive ranking summary across ALL events
       Use Case: Platform-wide leaderboards
       Priority: MEDIUM
```

```
GET    /api/admin/rankings/by-event
       Description: Rankings grouped by event
       Use Case: Compare events side-by-side
       Priority: MEDIUM
```

**2. Event-Specific Rankings**
```
GET    /api/admin/events/:eventId/rankings/stalls
       Description: Stall rankings for any approved event
       Priority: MEDIUM
```

```
GET    /api/admin/events/:eventId/rankings/students
       Description: Student rankings for any approved event
       Priority: MEDIUM
```

```
GET    /api/admin/events/:eventId/rankings/schools
       Description: School rankings for any approved event
       Priority: MEDIUM
```

**3. Rankings Visibility Control**
```
PATCH  /api/admin/events/:id/publish-rankings
       Description: Force publish rankings (make visible immediately)
       Use Case: Early results announcement
       Priority: HIGH
```

```
PATCH  /api/admin/events/:id/unpublish-rankings
       Description: Hide rankings from public view
       Use Case: Fix errors, delay announcement
       Priority: HIGH
```

```
PATCH  /api/admin/events/:id/reset-rankings-visibility
       Description: Reset to auto-mode (show if COMPLETED, else hide)
       Use Case: Return to default behavior
       Priority: MEDIUM
```

---

### **👥 Event Manager Management**

#### ✅ **Currently Implemented:**
- `/admin/event-managers` (GET/POST/PUT/DELETE) - Full CRUD

#### ❌ **Missing:**
- Individual event manager details view
- Event manager activity logs

---

## 👨‍💼 **EVENT MANAGER PANEL - Missing Features**

### **🔐 Authentication & Security**

#### ✅ **Currently Implemented:**
- `/event-manager/login` (POST)
- `/event-manager/logout` (POST)
- `/event-manager/profile` (GET/PUT)

#### ❌ **Missing in Frontend:**

```
POST   /api/event-manager/verify-identity
       Description: Verify identity using phone + school_id
       Use Case: Password reset flow (step 1)
       Priority: HIGH
```

```
POST   /api/event-manager/reset-password
       Description: Reset password after identity verification
       Use Case: Password reset flow (step 2)
       Priority: HIGH
```

---

### **📅 Event Management**

#### ✅ **Currently Implemented:**
- `/event-manager/events` (GET) - View events list
- `/event-manager/events/:eventId` (GET/DELETE) - View/Delete event
- `/event-manager/events/:eventId/analytics` (GET) - Event analytics

#### ❌ **Missing in Frontend:**

```
POST   /api/event-manager/events
       Description: Create new event
       Use Case: Event managers create events from UI
       Priority: CRITICAL
       Note: Currently events can only be created by admin
```

```
PUT    /api/event-manager/events/:eventId
       Description: Update event details
       Use Case: Edit event before submission
       Priority: CRITICAL
```

```
POST   /api/event-manager/events/:eventId/submit-for-approval
       Description: Submit event for admin approval (DRAFT → PENDING)
       Use Case: Workflow progression
       Priority: HIGH
```

```
GET    /api/event-manager/schools
       Description: Get all schools list
       Use Case: Select school when creating stalls/volunteers
       Priority: HIGH
```

---

### **📝 Registration Management**

#### ✅ **Currently Implemented:**
- `/event-manager/events/:eventId/registrations` (GET) - View registrations

#### ❌ **Missing in Frontend:**

```
GET    /api/event-manager/events/:eventId/registrations/search?q=<query>
       Description: Search registrations by name, email, phone, reg_no
       Use Case: Quick student lookup in large registration list
       Priority: HIGH
```

```
GET    /api/event-manager/events/:eventId/registrations/by-number/:registrationNumber
       Description: Get single registration by student reg number
       Use Case: Quick lookup, verification
       Priority: MEDIUM
```

```
GET    /api/event-manager/events/:eventId/registrations/check-cancellable/:registrationNumber
       Description: Check if registration is cancellable + refund eligibility
       Use Case: Before cancelling, show refund amount
       Priority: HIGH
       Response: { cancellable, reason, refund: { eligible, amount, percent } }
```

---

### **🔢 Bulk Registration (Event Manager Restricted)**

#### ❌ **Completely Missing (4 Endpoints)**

Event managers have **restricted** bulk registration (unlike admins).

```
GET    /api/event-manager/events/:eventId/bulk-register/check-eligibility
       Description: Check if bulk registration is allowed
       Use Case: Show UI only if eligible
       Priority: HIGH
       Restrictions: Only DRAFT/REJECTED events, rate limited
```

```
POST   /api/event-manager/events/:eventId/bulk-register/validate
       Description: Validate bulk registration file
       Priority: HIGH
```

```
POST   /api/event-manager/events/:eventId/bulk-register
       Description: Bulk register students (WITH RESTRICTIONS)
       Priority: HIGH
       Restrictions:
         - Only DRAFT/REJECTED events
         - Only own school students
         - >200 requires admin approval
         - Rate limited: 15min cooldown, 20/day max
```

```
GET    /api/event-manager/events/:eventId/bulk-register/template
       Description: Download event-specific template
       Priority: HIGH
```

---

### **💸 Refunds & Cancellation**

#### ❌ **Completely Missing (3 Endpoints)**

```
GET    /api/event-manager/events/:eventId/refunds
       Description: Get refund history for own event
       Use Case: Financial tracking, reconciliation
       Priority: MEDIUM
       Response: { data: [], summary: { total_refunds, total_refunded, average_refund } }
```

```
POST   /api/event-manager/events/:eventId/cancel-registration
       Description: Cancel single registration with refund
       Use Case: Handle individual requests
       Priority: HIGH
       Body: { registration_number, reason }
       Features: Auto refund calculation, waitlist promotion
```

```
POST   /api/event-manager/events/:eventId/bulk-cancel
       Description: Bulk cancel multiple registrations
       Use Case: Mass cancellations (event postponed, etc.)
       Priority: MEDIUM
       Input: JSON array OR Excel file
       Body: { registration_numbers: ["REG001", "REG002"], reason }
```

---

### **🏆 Rankings View**

#### ❌ **Completely Missing (4 Endpoints)**

Event managers **cannot see** rankings for their own events.

```
GET    /api/event-manager/events/:eventId/rankings/stalls
       Description: View stall rankings for own event
       Priority: MEDIUM
```

```
GET    /api/event-manager/events/:eventId/rankings/students
       Description: View student rankings for own event
       Priority: MEDIUM
```

```
GET    /api/event-manager/events/:eventId/rankings/schools
       Description: View school rankings for own event
       Priority: MEDIUM
```

```
GET    /api/event-manager/events/:eventId/rankings/all
       Description: View all ranking submissions
       Priority: MEDIUM
```

---

### **🎪 Stalls & Volunteers Management (Alias Routes)**

#### ✅ **Currently Implemented:**
- Direct routes work: `/event-manager/events/:eventId/stalls` (POST/DELETE)
- Direct routes work: `/event-manager/events/:eventId/volunteers` (POST/DELETE)

#### ⚠️ **Alternative RESTful Routes Available (Not Critical):**

These are **alias routes** that provide cleaner RESTful URLs but use the same controllers:

**Stalls:**
- `/event-manager/events/:eventId/stalls/create` (POST)
- `/event-manager/events/:eventId/stalls/list` (GET)
- `/event-manager/events/:eventId/stalls/:stallId/update` (PUT)
- `/event-manager/events/:eventId/stalls/:stallId/delete` (DELETE)

**Volunteers:**
- `/event-manager/events/:eventId/volunteers/create` (POST)
- `/event-manager/events/:eventId/volunteers/list` (GET)
- `/event-manager/events/:eventId/volunteers/:volunteerId/update` (PUT)
- `/event-manager/events/:eventId/volunteers/:volunteerId/delete` (DELETE)

**Note:** These are not critical since direct routes already work.

---

## 🎓 **STUDENT PANEL - Missing Features**

### **🔐 Password Reset Flow**

#### ❌ **Missing in Frontend:**

```
POST   /api/student/verify-reset-credentials
       Description: Verify DOB + pincode for password reset
       Use Case: Students forgot password
       Priority: HIGH
       Body: { registration_no, date_of_birth, pincode }
```

```
POST   /api/student/reset-password
       Description: Reset password after verification
       Priority: HIGH
```

---

### **📜 Check-in History**

#### ❌ **Missing:**

```
GET    /api/student/check-in-history
       Description: View check-in/check-out history
       Use Case: Students track their attendance
       Priority: MEDIUM
```

---

### **❌ Event Deregistration**

#### ❌ **Missing:**

```
POST   /api/student/events/:eventId/deregister
       Description: Cancel event registration (with refund if applicable)
       Use Case: Students cancel registration before event
       Priority: HIGH
       Features: Auto refund calculation based on timing
```

---

## ✅ **VOLUNTEER PANEL - Complete**

**Status:** All volunteer features are fully implemented in frontend  
**Completion:** 100% ✅

---

## 🎯 **Implementation Priority Matrix**

### **CRITICAL (Must Have - Week 1)**

1. **Admin Bulk Registration System** (12 endpoints)
   - Mass event registrations
   - Template download/upload
   - Validation system

2. **Admin Refunds & Cancellations** (3 endpoints)
   - Legal compliance requirement
   - Financial operations

3. **Event Manager Event Creation** (2 endpoints)
   - `/event-manager/events` (POST)
   - `/event-manager/events/:eventId` (PUT)
   - Core functionality missing

4. **Event Manager Submit for Approval** (1 endpoint)
   - Workflow completion

---

### **HIGH Priority (Week 2-3)**

5. **Student Password Reset** (2 endpoints)
   - User self-service critical

6. **Event Manager Bulk Registration** (4 endpoints)
   - Restricted version for managers

7. **Admin Student Search** (1 endpoint)
   - Large database navigation

8. **Registration Search** (Event Manager) (1 endpoint)
   - Quick lookup in registrations

9. **Rankings Publish/Unpublish Controls** (3 endpoints)
   - Results announcement control

10. **Event Manager Cancellation Tools** (2 endpoints)
    - Handle refund requests

11. **Admin Student Bulk Upload** (4 endpoints)
    - Initial data population

---

### **MEDIUM Priority (Week 4-5)**

12. **Event Analytics** (Admin/Event Manager)
    - Deep insights

13. **Rankings View** (Event Manager)
    - See own event results

14. **Refund History View** (Event Manager)
    - Financial tracking

15. **Check-in History** (Student)
    - Attendance tracking

16. **Event Search** (Admin)
    - Quick navigation

17. **Event Manager Identity Verification**
    - Password reset flow

---

### **LOW Priority (Future)**

18. **Bulk Registration Logs & Export**
    - Audit trail

19. **Platform-wide Rankings Views**
    - Nice to have

20. **Event Approval Preview**
    - Enhanced UX

---

## 📦 **Feature Modules Summary**

| Module | Status | Routes Missing | Priority |
|--------|--------|----------------|----------|
| **Admin Bulk Registration** | ❌ Not Started | 12 routes | 🔴 CRITICAL |
| **Admin Refunds** | ❌ Not Started | 3 routes | 🔴 CRITICAL |
| **Event Manager Event CRUD** | ❌ Not Started | 3 routes | 🔴 CRITICAL |
| **Event Manager Bulk Ops** | ❌ Not Started | 6 routes | 🟡 HIGH |
| **Rankings Management** | ❌ Not Started | 9 routes | 🟡 HIGH |
| **Student Password Reset** | ❌ Not Started | 2 routes | 🟡 HIGH |
| **Admin Student Tools** | ⚠️ Partial | 5 routes | 🟡 HIGH |
| **Event Manager Rankings View** | ❌ Not Started | 4 routes | 🟢 MEDIUM |
| **Analytics & Reporting** | ⚠️ Partial | 4 routes | 🟢 MEDIUM |

---

## 🛠️ **Technical Notes**

### **Backend Status:**
- ✅ All endpoints are **production-ready**
- ✅ Full authentication & authorization
- ✅ Input validation & sanitization
- ✅ Error handling & logging
- ✅ Rate limiting configured
- ✅ File upload (Excel) handling ready

### **What's Needed in Frontend:**

1. **UI Components:**
   - File upload components (Excel)
   - Bulk operation confirmation dialogs
   - Refund calculation displays
   - Search & filter interfaces
   - Event creation forms
   - Registration management tables

2. **State Management:**
   - Bulk operation progress tracking
   - File validation feedback
   - Refund status tracking

3. **Integration:**
   - Excel file handling (upload/download)
   - Payment gateway UI (Razorpay)
   - Real-time validation feedback

---

## 📋 **Next Steps**

### **Phase 1: Critical Features (Week 1)**
1. Admin Bulk Registration UI
2. Admin Refunds & Cancellations UI
3. Event Manager Event Creation Form
4. Event Manager Submit for Approval Button

### **Phase 2: High Priority (Week 2-3)**
5. Student Password Reset Flow
6. Event Manager Bulk Registration (Restricted)
7. Search Interfaces (Students, Registrations)
8. Rankings Controls

### **Phase 3: Medium Priority (Week 4-5)**
9. Analytics Dashboards
10. Refund History Views
11. Event Manager Rankings View
12. Additional Tools & Utilities

---

## 📞 **Contact & Coordination**

**Backend:** ✅ Complete and tested  
**Frontend Team:** Awaiting implementation  
**Documentation:** API docs available in Postman collection  
**Testing:** Backend integration tests passing

---

**Last Updated:** February 1, 2026  
**Document Version:** 1.0  
**Status:** Active Development
