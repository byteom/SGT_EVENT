# SGT Event Management System - Data Flow Diagrams

## Quick Reference Guide

This project now includes comprehensive Data Flow Diagrams (DFD) that visualize the entire system architecture and data flows.

---

## Generated Files

### 📊 Diagram Images (High Quality PNG)
1. **dfd-level-0-context.png** (2400x1600px, 64KB)
   - Context diagram showing the system and external entities
   - Best for: Executive presentations, system overview

2. **dfd-level-1.png** (3000x2400px, 218KB)
   - Detailed process flow with all main processes and data stores
   - Best for: Development team, technical documentation

### 📝 Documentation
1. **DFD-DOCUMENTATION.md**
   - Complete explanation of all diagrams
   - Process descriptions with business rules
   - Data store specifications
   - Security features and technology stack

2. **DFD-README.md** (This file)
   - Quick reference guide
   - Summary of diagrams

### 🔧 Source Files
1. **dfd-level-0-context.mmd** - Mermaid source for Level 0
2. **dfd-level-1.mmd** - Mermaid source for Level 1
3. **mermaid-config.json** - Configuration for diagram generation

---

## System Overview

### What is SGT Event Management System?

A comprehensive web application for managing university events, stall visits, feedback collection, and student rankings at SGT University.

### Key Roles

| Role | Icon | Description |
|------|------|-------------|
| **Student** | 👤 | Attend events, visit stalls, provide feedback, submit rankings |
| **Volunteer** | 🙋 | Scan student QR codes, record check-ins/check-outs |
| **Event Manager** | 📋 | Create events, manage stalls, view statistics |
| **Admin** | 👨‍💼 | System administration, user management, analytics |

---

## Main System Components

### 1. Authentication System 🔐
- Multi-role login (Student, Volunteer, Event Manager, Admin)
- JWT token-based authentication
- Password reset flow for students

### 2. Event Management 📅
- Event creation and editing
- Stall management
- Event details display

### 3. QR Code & Check-in/out System 📱
- Student QR code generation
- Real-time scanning by volunteers
- Visit tracking with timestamps

### 4. Feedback System 💬
- Stall feedback collection
- Rating and comments
- Visit verification

### 5. Ranking System ⭐
- Top 3 stall voting
- Weighted scoring (5-3-1 points)
- Eligibility checks

### 6. Reports & Analytics 📊
- Real-time dashboards
- School and stall rankings
- Export functionality

---

## Contest Rules

Students must complete all three to win prizes:

✅ Visit **10+ stalls** (get QR scanned)
✅ Submit feedback for **5+ stalls**
✅ Rank your **top 3 favorite stalls**

---

## Data Flow Summary

### Student Journey
```
1. Login → 2. Get QR Code → 3. Visit Stalls (scan QR)
→ 4. Provide Feedback → 5. Submit Rankings → 6. Win Prizes!
```

### Volunteer Journey
```
1. Login → 2. Open Scanner → 3. Scan Student QR
→ 4. Record Check-in/out → 5. View History
```

### Event Manager Journey
```
1. Login → 2. Create Event → 3. Add Stalls
→ 4. Monitor Participation → 5. View Reports
```

### Admin Journey
```
1. Login → 2. Manage Users → 3. Configure System
→ 4. View Analytics → 5. Export Reports
```

---

## Technology Stack

**Frontend:** Next.js 16 + React 19 + Tailwind CSS 4
**State:** Zustand + SWR
**QR Codes:** html5-qrcode + react-qr-code
**Real-time:** WebSocket
**Charts:** Recharts
**Backend API:** https://sgtu-event-backend.vercel.app/api

---

## How to Use These Diagrams

### For Stakeholders
- Show **Level 0** diagram for quick system overview
- Explain user roles and their interactions

### For Developers
- Reference **Level 1** diagram for implementation
- Understand data flows between components
- Design API endpoints based on processes

### For Documentation
- Include diagrams in technical specifications
- Use in onboarding materials
- Reference during code reviews

### For Testing
- Create test cases based on each process
- Validate data flows end-to-end
- Test user journeys depicted in diagrams

---

## Diagram Symbols Legend

| Symbol | Meaning | Example |
|--------|---------|---------|
| Colored Rectangle | External Entity (User) | 👤 Student |
| Rounded Rectangle | Process | 1.0 Authentication |
| Cylinder | Data Store | D1: Users DB |
| Arrow | Data Flow | Login Request → |
| Number (X.0) | Process ID | 3.0 = Check-in System |

---

## Color Coding

- **Blue** (#2B6CB0) - Authentication, Primary processes
- **Green** (#10B981) - Students, Events
- **Orange** (#F59E0B) - Volunteers, Check-ins
- **Purple** (#8B5CF6) - Feedback, Event Manager
- **Pink** (#EC4899) - Rankings
- **Red** (#EF4444) - Admin, Reports

---

## Database Schema (from DFD)

Based on the data stores identified:

### D1: Users Database
- Students (registration_no, name, email, school, dob, pincode)
- Volunteers (email, name, assigned_stalls)
- Event Managers (email, name, managed_events)
- Admins (email, name, permissions)

### D2: Events & Stalls Database
- Events (event_id, name, date, description)
- Stalls (stall_id, name, location, event_id)
- Event-Stall relationships

### D3: Check-in/Check-out Records
- visit_id, student_id, stall_id
- check_in_time, check_out_time
- duration, volunteer_id

### D4: Feedback Records
- feedback_id, student_id, stall_id
- rating, comments, timestamp

### D5: Ranking Records
- ranking_id, student_id
- rank_1_stall_id, rank_2_stall_id, rank_3_stall_id
- weighted_score, timestamp

---

## API Endpoints (derived from DFD)

### Authentication (Process 1.0)
- POST /api/student/login
- POST /api/volunteer/login
- POST /api/event-manager/login
- POST /api/admin/login
- POST /api/student/reset-password

### Events (Process 2.0)
- GET /api/events
- POST /api/event-manager/events
- PUT /api/event-manager/events/:id
- GET /api/events/:id

### Check-in/out (Process 3.0)
- POST /api/check-in
- POST /api/check-out
- GET /api/volunteer/history
- GET /api/student/visits

### Feedback (Process 4.0)
- POST /api/feedback
- GET /api/student/feedback
- GET /api/feedback/stats

### Rankings (Process 5.0)
- POST /api/rankings
- GET /api/rankings/leaderboard
- GET /api/student/ranking-status

### Reports (Process 6.0)
- GET /api/admin/stats
- GET /api/admin/reports
- GET /api/event-manager/analytics

---

## Regenerating Diagrams

If you need to modify the diagrams:

1. Edit the `.mmd` files (Mermaid syntax)
2. Run the conversion command:

```bash
# Level 0
mmdc -i dfd-level-0-context.mmd -o dfd-level-0-context.png -w 2400 -H 1600 -b white -c mermaid-config.json

# Level 1
mmdc -i dfd-level-1.mmd -o dfd-level-1.png -w 3000 -H 2400 -b white -c mermaid-config.json
```

---

## Next Steps

1. ✅ Share diagrams with stakeholders for approval
2. ✅ Use diagrams in technical documentation
3. ✅ Reference during development sprints
4. ✅ Update diagrams as system evolves
5. ✅ Create Level 2 DFDs for complex processes if needed

---

## Questions?

Refer to **DFD-DOCUMENTATION.md** for detailed explanations of:
- Each process and its business rules
- Data store schemas
- Security features
- Complete data flow descriptions

---

**Created:** November 27, 2025
**Tools Used:** Mermaid CLI (@mermaid-js/mermaid-cli)
**Diagram Format:** PNG (High Resolution)
**Documentation Format:** Markdown

---

## Summary

You now have **2 professional DFD diagrams** that clearly explain your SGT Event Management System:

1. **Level 0** - Perfect for presentations and high-level understanding
2. **Level 1** - Ideal for development team and technical documentation

Both diagrams are high-quality PNG images ready for use in presentations, documentation, or reports.
