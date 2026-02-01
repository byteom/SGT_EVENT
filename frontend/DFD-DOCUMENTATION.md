# Data Flow Diagrams (DFD) - SGT Event Management System

## Overview
This document contains the Data Flow Diagrams for the SGT University Event Management System. The system manages event participation, stall visits, feedback collection, and student rankings.

---

## Diagram Files
- **dfd-level-0-context.png** - Level 0 Context Diagram (System Overview)
- **dfd-level-1.png** - Level 1 DFD (Detailed Processes)

---

## Level 0: Context Diagram

### Purpose
Shows the entire system as a single process and its interactions with external entities.

### External Entities
1. **Student** 👤
   - Primary users who participate in events
   - Visit stalls and get QR codes scanned
   - Provide feedback and rankings

2. **Volunteer** 🙋
   - Scan student QR codes at stalls
   - Record check-ins and check-outs
   - View scan history

3. **Event Manager** 📋
   - Create and manage events/stalls
   - View event statistics
   - Access reports

4. **Admin** 👨‍💼
   - Manage system users
   - Configure system settings
   - View comprehensive analytics

### Data Flows (In)
- Login credentials from all user types
- Event registration and data from Event Manager
- Feedback and rankings from Students
- QR code scans from Volunteers
- System configuration from Admin

### Data Flows (Out)
- Authentication tokens to all users
- Student QR codes and visit history
- Event details and statistics
- Scan confirmation and history to Volunteers
- Analytics and reports to Admin and Event Managers

---

## Level 1: Detailed Process Diagram

### Main Processes

#### 1.0 Authentication System 🔐
**Purpose:** Handles user login and authentication for all user types

**Inputs:**
- Login requests (registration number for students, email for others)
- Password credentials

**Outputs:**
- Authentication tokens (JWT)
- User session data

**Data Stores:**
- D1: Users Database (reads user credentials)

**Business Rules:**
- Students login with registration number
- Volunteers, Event Managers, and Admins login with email
- Students may require password reset on first login
- Token-based authentication using JWT

---

#### 2.0 Event Management 📅
**Purpose:** Manages events and stalls in the system

**Inputs:**
- Event creation/edit requests from Event Manager
- View event requests from Students

**Outputs:**
- Event details to Students
- Event statistics to Event Manager

**Data Stores:**
- D2: Events & Stalls Database (read/write)

**Business Rules:**
- Only Event Managers can create/edit events
- Students can only view active events
- Events have associated stalls

---

#### 3.0 QR Code & Check-in/out System 📱
**Purpose:** Tracks student visits to stalls using QR code scanning

**Inputs:**
- Student QR code display
- Volunteer QR scan request

**Outputs:**
- Visit confirmation to Student
- Scan history to Volunteer

**Data Stores:**
- D1: Users Database (verify student identity)
- D3: Check-in/Check-out Records (record visits)

**Business Rules:**
- Each student has a unique QR code
- Volunteers scan QR codes to record check-ins/check-outs
- System tracks timestamp of each scan
- Students must visit minimum 10 stalls for contest eligibility

---

#### 4.0 Feedback System 💬
**Purpose:** Collects and manages student feedback for stalls

**Inputs:**
- Feedback submissions from Students

**Outputs:**
- Feedback confirmation status

**Data Stores:**
- D3: Check-in/Check-out Records (verify visits)
- D4: Feedback Records (store feedback)

**Business Rules:**
- Students can only provide feedback for stalls they've visited
- Students must submit feedback for at least 5 stalls (contest rule)
- Feedback includes ratings and comments

---

#### 5.0 Ranking System ⭐
**Purpose:** Manages student rankings of their favorite stalls

**Inputs:**
- Ranking submissions (top 3 stalls) from Students

**Outputs:**
- Ranking confirmation status

**Data Stores:**
- D3: Check-in/Check-out Records (check visit eligibility)
- D4: Feedback Records (verify feedback requirement)
- D5: Ranking Records (store rankings)

**Business Rules:**
- Students must rank their top 3 favorite stalls
- Ranking is required for contest eligibility
- Scoring system:
  - Rank 1: 5 points
  - Rank 2: 3 points
  - Rank 3: 1 point

---

#### 6.0 Reports & Analytics 📊
**Purpose:** Generates comprehensive reports and analytics

**Inputs:**
- Report requests from Admin
- Analytics requests from Event Manager

**Outputs:**
- Detailed analytics to Admin
- Event-specific reports to Event Manager

**Data Stores:**
- D1: Users Database (user statistics)
- D2: Events & Stalls Database (event data)
- D3: Check-in/Check-out Records (visit analytics)
- D4: Feedback Records (feedback statistics)
- D5: Ranking Records (ranking analytics)

**Reports Include:**
- Total students, volunteers, stalls
- Active vs completed check-ins
- Average visit duration
- School rankings (based on student participation)
- Stall rankings (based on weighted scores)
- Feedback statistics

---

## Data Stores

### D1: Users Database 👥
**Contains:**
- Student records (registration number, name, DOB, school, etc.)
- Volunteer records (email, name, assigned stalls)
- Event Manager records (email, name, managed events)
- Admin records (email, name, permissions)

**Used By:**
- Authentication System (1.0)
- Check-in/out System (3.0)
- Reports & Analytics (6.0)

---

### D2: Events & Stalls Database 🎪
**Contains:**
- Event details (name, date, description)
- Stall information (name, location, assigned volunteers)
- Event-stall relationships

**Used By:**
- Event Management (2.0)
- Reports & Analytics (6.0)

---

### D3: Check-in/Check-out Records ✅
**Contains:**
- Visit records (student ID, stall ID, timestamps)
- Check-in times
- Check-out times
- Visit duration

**Used By:**
- QR Code & Check-in/out System (3.0)
- Feedback System (4.0) - verify visits
- Ranking System (5.0) - check eligibility
- Reports & Analytics (6.0)

---

### D4: Feedback Records 📝
**Contains:**
- Student feedback for stalls
- Ratings and comments
- Feedback timestamps

**Used By:**
- Feedback System (4.0)
- Ranking System (5.0) - verify feedback requirement
- Reports & Analytics (6.0)

---

### D5: Ranking Records 🏆
**Contains:**
- Student ranking submissions (top 3 stalls)
- Ranking positions (1st, 2nd, 3rd)
- Weighted scores
- Submission timestamps

**Used By:**
- Ranking System (5.0)
- Reports & Analytics (6.0)

---

## Contest Rules

To be eligible for prizes, students must:
1. Visit a minimum of **10 stalls** and get their QR code scanned
2. Submit feedback for at least **5 stalls** they visited
3. Rank their **top 3 favorite stalls** before the event ends

---

## Technology Stack

### Frontend (This Project)
- **Framework:** Next.js 16
- **UI:** React 19, Tailwind CSS 4
- **State Management:** Zustand
- **Data Fetching:** SWR, Axios
- **QR Code:** html5-qrcode, react-qr-code
- **Real-time:** WebSocket (reconnecting-websocket)
- **Charts:** Recharts

### Backend API
- **Base URL:** https://sgtu-event-backend.vercel.app/api
- **Authentication:** JWT Bearer Tokens
- **Storage:** LocalStorage for tokens

---

## Key Features

1. **Multi-role Authentication**
   - Separate login flows for students, volunteers, event managers, and admins
   - Token-based authentication with automatic expiration handling

2. **Real-time QR Scanning**
   - Students display unique QR codes
   - Volunteers scan codes to record visits
   - Instant check-in/check-out tracking

3. **Feedback Collection**
   - Students provide feedback for visited stalls
   - Ratings and detailed comments
   - Visit verification before feedback submission

4. **Competitive Ranking**
   - Students vote for favorite stalls
   - Weighted scoring system
   - Leaderboards for schools and stalls

5. **Comprehensive Analytics**
   - Real-time statistics dashboard
   - Event participation metrics
   - Export capabilities (Excel)

---

## Security Features

- JWT token authentication
- Role-based access control
- Automatic token expiration handling
- CORS configuration
- Password reset flow with identity verification

---

## Diagram Legend

### Colors
- **Blue** - Authentication and primary processes
- **Green** - Students and event-related processes
- **Orange/Yellow** - Volunteers and check-in processes
- **Purple** - Feedback and secondary processes
- **Pink** - Ranking processes
- **Red** - Admin and reporting processes

### Symbols
- **Rectangles** - External entities (users)
- **Rounded rectangles** - Processes
- **Cylinders** - Data stores
- **Arrows** - Data flows

---

## How to Use These Diagrams

1. **For Understanding System Architecture:**
   - Start with Level 0 to understand overall system scope
   - Move to Level 1 to see detailed processes

2. **For Development:**
   - Use DFDs to understand data requirements
   - Identify API endpoints needed
   - Design database schema

3. **For Documentation:**
   - Share with stakeholders to explain system
   - Use in technical specifications
   - Reference during development discussions

4. **For Testing:**
   - Identify test scenarios based on data flows
   - Validate each process independently
   - Test integration between processes

---

## Future Enhancements (Potential Level 2 DFDs)

If more detail is needed, Level 2 diagrams can be created for:
- Authentication process breakdown (student vs volunteer vs admin login)
- QR scanning workflow (check-in vs check-out logic)
- Feedback submission validation process
- Ranking calculation algorithm
- Report generation workflows

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-27 | Initial DFD creation with Level 0 and Level 1 diagrams |

---

## Contact & Support

For questions about these diagrams or the system architecture, please contact the development team or refer to the project repository.
