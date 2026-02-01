# Admin Panel Documentation

## Table of Contents
1. [Overview](#overview)
2. [Features Implemented](#features-implemented)
3. [Pages and Routes](#pages-and-routes)
4. [Components](#components)
5. [API Integration](#api-integration)
6. [Styling and Theming](#styling-and-theming)
7. [Functionality Details](#functionality-details)
8. [File Structure](#file-structure)
9. [Backend Endpoints Used](#backend-endpoints-used)
10. [Future Improvements](#future-improvements)

---

## Overview

The Admin Panel is a comprehensive management system for SGT University Event Management. It provides administrators with tools to manage students, volunteers, stalls, scan records, analytics, and system settings. The panel is built using Next.js 13+ (App Router), React, Tailwind CSS, and integrates with a RESTful backend API.

### Key Technologies
- **Framework**: Next.js 13+ (App Router)
- **UI Library**: React
- **Styling**: Tailwind CSS with custom CSS variables
- **HTTP Client**: Axios
- **Icons**: Material Symbols Outlined
- **State Management**: React Hooks (useState, useEffect, useMemo)

---

## Features Implemented

### 1. Dashboard Overview (`/admin`)
- **Statistics Cards**: Total Students, Volunteers, Stalls, Active Check-Ins
- **Recent Scans Table**: Last 4 scan records with student details
- **Quick Actions**: Buttons for common tasks
- **Real-time Data**: Fetches live statistics from backend
- **Responsive Design**: Mobile and desktop layouts

### 2. Students Management (`/admin/students`)
- **Data Display**: Table view (desktop) and card view (mobile)
- **Search Functionality**: Search by name, email, enrollment number, or school
- **Filtering**: Filter by school/department
- **Sorting**: Click column headers to sort by any field (name, email, enrollment, department, created date, feedbacks, time spent)
- **Pagination**: Configurable items per page (10, 25, 50, 100)
- **Result Count**: Shows current range and total count

### 3. Volunteers Management (`/admin/volunteers`)
- **Data Display**: Table view (desktop) and card view (mobile)
- **Search Functionality**: Search by name, email, or location
- **Filtering**: Filter by location and status (active/inactive)
- **Sorting**: Sort by name, email, location, scans performed, status
- **Pagination**: Same pagination controls as students
- **Detail Sidebar**: Click any volunteer to view detailed information
- **Statistics Display**: Total scans, check-ins, check-outs

### 4. Stalls Management (`/admin/stalls`)
- **Data Display**: Grid/table view with stall information
- **Search Functionality**: Search by name, number, school, or description
- **Filtering**: Filter by school/department
- **Sorting**: Sort by stall ID, name, department, feedback count
- **CRUD Operations**:
  - **Create**: Modal form to add new stalls
  - **Update**: Edit stall name and description
  - **Delete**: Delete stalls with confirmation
- **Detail Sidebar**: Click any stall to view:
  - Stall information (read-only)
  - QR code display and download
  - Feedback analytics (total feedback, average rating)
- **QR Code Management**: Automatic QR code generation and download

### 5. Attendance Log / Scans (`/admin/scans`)
- **Data Display**: Table view showing all check-in/out records
- **Search Functionality**: Search by student name, enrollment, volunteer name, stall name
- **Filtering**: Filter by type (check-in only, check-out only, all)
- **Sorting**: Sort by timestamp, student name, enrollment, volunteer name
- **Delete Functionality**: Delete scan records with confirmation
- **Date Formatting**: Human-readable date/time display

### 6. Analytics (`/admin/analytics`)
- **Top Schools**: Display top-ranked schools based on rankings
- **Top Stalls**: Display top-ranked stalls based on weighted scores
- **Statistics Cards**: Visual representation of rankings
- **Data Fetching**: Real-time data from backend

### 7. Reports & Statistics (`/admin/reports`)
- **Comprehensive Stats**: Overall event statistics
- **Check-in/out Stats**: Attendance statistics
- **Top Performers**: Top schools and stalls
- **Visual Cards**: Statistics displayed in card format

### 8. Settings / Profile (`/admin/settings`)
- **Profile Information**: View admin details (name, email, role)
- **Update Profile**: Change email address
- **Password Management**: Change password functionality
- **Form Validation**: Password confirmation matching

### 9. Events Management (`/admin/events`)
- **Under Construction Page**: Placeholder page with feature list
- **Future Features**: Listed upcoming capabilities
- **Professional Design**: Consistent with other pages

### 10. 404 Page (`/not-found`)
- **Custom 404 Page**: Beautiful error page for non-existent routes
- **Helpful Messages**: Explains page might be under construction or URL misspelled
- **Navigation Options**: Go back, go home, quick links to portals

---

## Pages and Routes

### Admin Routes Structure
```
/admin                    → Dashboard Overview
/admin/events             → Events Management (Under Construction)
/admin/students          → Students Management
/admin/volunteers         → Volunteers Management
/admin/stalls            → Stall Management
/admin/scans             → Attendance Log (Scans)
/admin/analytics         → Analytics
/admin/reports           → Reports & Statistics
/admin/settings          → Profile & Settings
```

### Main Routes
```
/                        → Main Login Page (Role Selection)
/student                 → Student Portal
/volunteer               → Volunteer Portal
/not-found               → 404 Error Page
```

---

## Components

### 1. AdminSidebar (`components/admin/AdminSidebar.jsx`)
**Purpose**: Persistent sidebar navigation for desktop view

**Features**:
- Fixed sidebar on the left (desktop only)
- Navigation links to all admin pages
- Active route highlighting
- Logout button above admin user section
- Admin user info at bottom
- Responsive: Hidden on mobile, visible on desktop (md:flex)

**Navigation Items**:
- Dashboard
- Events
- Attendance Log
- Volunteers
- Students
- Stalls
- Analytics
- Settings

**Styling**:
- Uses theme variables: `bg-card-background`, `border-light-gray-border`, `text-dark-text`
- Active state: Blue background with primary text color
- Hover effects on all links

### 2. AdminHeader (`components/admin/AdminHeader.jsx`)
**Purpose**: Top header bar with page title, theme toggle, and user profile

**Features**:
- Fixed header at top
- Dynamic page title based on current route
- Theme toggle button (light/dark mode)
- Notification bell icon (hidden on mobile)
- User profile dropdown menu:
  - Profile option (navigates to settings)
  - Logout option
- Click outside to close dropdown
- Theme state management with localStorage persistence

**Page Titles**:
- Dashboard Overview
- Events Management
- Students Management
- Volunteers Management
- Stall Management
- Attendance Log (Scans)
- Analytics
- Reports & Statistics
- Profile & Settings

**Styling**:
- Fixed position with proper z-index
- Responsive padding and text sizes
- Uses theme variables for colors

### 3. AdminMobileNav (`components/admin/AdminMobileNav.jsx`)
**Purpose**: Bottom navigation bar for mobile devices

**Features**:
- Fixed bottom navigation (mobile only)
- 5 main navigation items
- Active route highlighting
- Material icons for each route
- Responsive: Visible on mobile, hidden on desktop (md:hidden)

**Navigation Items**:
- Home (Dashboard)
- Students
- Volunteers
- Stalls
- Scans

---

## API Integration

### API Configuration
**File**: `lib/api.js`

**Setup**:
- Base URL configured for backend API
- Axios interceptor to attach `admin_token` from localStorage
- Automatic token attachment to all authenticated requests

### Endpoints Used

#### Admin Endpoints
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/profile` - Get admin profile
- `PUT /api/admin/profile` - Update admin profile
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/students` - Get all students (with pagination: limit, offset)
- `GET /api/admin/volunteers` - Get all volunteers
- `GET /api/admin/stalls` - Get all stalls
- `GET /api/admin/top-schools` - Get top-ranked schools
- `GET /api/admin/top-stalls` - Get top-ranked stalls

#### Stall Endpoints
- `GET /api/stall/:id` - Get stall by ID
- `GET /api/stall/:id/qr-code` - Get stall QR code image
- `POST /api/stall` - Create new stall (admin only)
- `PUT /api/stall/:id` - Update stall (admin only)
- `DELETE /api/stall/:id` - Delete stall (admin only)

#### Check-in/out Endpoints
- `GET /api/check-in-out` - Get all scan records
- `GET /api/check-in-out/stats` - Get scan statistics
- `DELETE /api/check-in-out/:id` - Delete scan record (admin only)

---

## Styling and Theming

### Global CSS Variables (`app/globals.css`)

**Light Mode Variables**:
```css
--background: #F7FAFC              /* soft background */
--foreground: #1A202C              /* dark text */
--primary: #2B6CB0                 /* blue */
--primary-dark: #1F5A9A            /* darker blue */
--accent: #ECC94B                  /* gold */
--card-background: #FFFFFF         /* white card */
--light-gray-border: #E2E8F0       /* soft border */
--shadow-soft: 0 10px 30px rgba(43, 108, 176, 0.12)
```

**Dark Mode Variables**:
```css
--background: #0d1220
--foreground: #ededed
--card-background: #1a1f2b
--light-gray-border: #2d3748
```

### Utility Classes
- `.text-dark-text` - Main text color
- `.bg-soft-background` - Background color
- `.bg-card-background` - Card background
- `.border-light-gray-border` - Border color
- `.text-primary` - Primary color text
- `.bg-primary` - Primary color background
- `.bg-primary-dark` - Darker primary color
- `.shadow-soft` - Soft shadow effect

### Theme Implementation
- Theme toggle in AdminHeader
- localStorage persistence
- Automatic dark mode class application
- Consistent theming across all pages

---

## Functionality Details

### Search, Filter, and Sort

**Utility Functions** (`lib/utils.js`):
- `filterData()` - Search across multiple fields
- `filterByField()` - Filter by specific field value
- `sortData()` - Sort by any field (ascending/descending)
- `paginateData()` - Pagination with configurable items per page
- `getUniqueValues()` - Extract unique values for filter dropdowns

**Implementation**:
- Client-side filtering and sorting for instant results
- Real-time search as user types
- Multiple filter options per page
- Sortable column headers with visual indicators
- Pagination controls with page numbers

### Detail Sidebars

**Stalls Detail Sidebar**:
- Opens when clicking any stall row
- Displays stall information (read-only)
- Shows QR code with download option
- Displays feedback analytics
- Fetches QR code from backend API

**Volunteers Detail Sidebar**:
- Opens when clicking any volunteer row
- Displays volunteer profile with avatar
- Shows detailed information
- Displays summary statistics (scans, check-ins, check-outs)
- Read-only view

### CRUD Operations

**Stalls**:
- **Create**: Modal form with validation
- **Update**: Inline editing in sidebar (removed, now view-only)
- **Delete**: Confirmation dialog before deletion

**Scans**:
- **Delete**: Confirmation dialog before deletion
- Works on both desktop table and mobile cards

### Authentication

**Token Management**:
- Token stored in localStorage as `admin_token`
- Admin name stored as `admin_name`
- Automatic token attachment to API requests
- Logout clears all admin data

**Logout Flow**:
1. Calls backend logout endpoint (optional)
2. Removes `admin_token` from localStorage
3. Removes `admin_name` from localStorage
4. Redirects to main login page (`/`)

---

## File Structure

```
frontend/sgtu-event-frontend/
├── app/
│   ├── admin/
│   │   ├── page.jsx                    # Dashboard
│   │   ├── events/
│   │   │   └── page.jsx                # Events (Under Construction)
│   │   ├── students/
│   │   │   └── page.jsx                # Students Management
│   │   ├── volunteers/
│   │   │   └── page.jsx                # Volunteers Management
│   │   ├── stalls/
│   │   │   └── page.jsx                # Stalls Management
│   │   ├── scans/
│   │   │   └── page.jsx                # Attendance Log
│   │   ├── analytics/
│   │   │   └── page.jsx                # Analytics
│   │   ├── reports/
│   │   │   └── page.jsx                # Reports
│   │   └── settings/
│   │       └── page.jsx                # Profile & Settings
│   ├── not-found.jsx                   # 404 Page
│   ├── globals.css                     # Global styles and theme variables
│   └── page.jsx                        # Main login page
├── components/
│   └── admin/
│       ├── AdminSidebar.jsx            # Sidebar navigation
│       ├── AdminHeader.jsx             # Top header with dropdown
│       └── AdminMobileNav.jsx          # Mobile bottom navigation
└── lib/
    ├── api.js                          # Axios configuration
    └── utils.js                        # Utility functions (filter, sort, paginate)
```

---

## Backend Endpoints Used

### Admin Endpoints
| Method | Endpoint | Description | Used In |
|--------|----------|-------------|---------|
| GET | `/api/admin/stats` | Get system statistics | Dashboard, Reports |
| GET | `/api/admin/profile` | Get admin profile | Settings |
| PUT | `/api/admin/profile` | Update admin profile | Settings |
| POST | `/api/admin/login` | Admin login | Login page |
| POST | `/api/admin/logout` | Admin logout | All pages |
| GET | `/api/admin/students` | Get all students | Students page |
| GET | `/api/admin/volunteers` | Get all volunteers | Volunteers page |
| GET | `/api/admin/stalls` | Get all stalls | Stalls page |
| GET | `/api/admin/top-schools` | Get top schools | Analytics, Reports |
| GET | `/api/admin/top-stalls` | Get top stalls | Analytics, Reports |

### Stall Endpoints
| Method | Endpoint | Description | Used In |
|--------|----------|-------------|---------|
| GET | `/api/stall/:id` | Get stall by ID | Stalls detail sidebar |
| GET | `/api/stall/:id/qr-code` | Get QR code image | Stalls detail sidebar |
| POST | `/api/stall` | Create stall | Stalls page (create modal) |
| PUT | `/api/stall/:id` | Update stall | Stalls page (edit modal) |
| DELETE | `/api/stall/:id` | Delete stall | Stalls page |

### Check-in/out Endpoints
| Method | Endpoint | Description | Used In |
|--------|----------|-------------|---------|
| GET | `/api/check-in-out` | Get all records | Scans page, Dashboard |
| GET | `/api/check-in-out/stats` | Get statistics | Dashboard, Reports |
| DELETE | `/api/check-in-out/:id` | Delete record | Scans page |

---

## Implementation Details

### Search Functionality
- **Implementation**: Client-side filtering using utility functions
- **Search Fields**: Varies by page (name, email, enrollment, etc.)
- **Performance**: Uses `useMemo` for optimized filtering
- **User Experience**: Real-time search as user types

### Filtering
- **School Filter**: Available on Students and Stalls pages
- **Location Filter**: Available on Volunteers page
- **Status Filter**: Available on Volunteers page (active/inactive)
- **Type Filter**: Available on Scans page (check-in/check-out)
- **Implementation**: Dropdown selects with "All" option

### Sorting
- **Implementation**: Clickable column headers
- **Visual Indicators**: Icons show sort direction (up/down/unfold)
- **Active State**: Highlighted when column is sorted
- **Multi-field**: Can sort by any column
- **Direction Toggle**: Click again to reverse sort order

### Pagination
- **Items Per Page**: Configurable (10, 25, 50, 100)
- **Page Numbers**: Shows up to 5 page numbers
- **Navigation**: Previous/Next buttons
- **State Management**: Resets to page 1 when filters change
- **Result Display**: Shows "Showing X - Y of Z items"

### Responsive Design
- **Breakpoints**: 
  - Mobile: Default (< 768px)
  - Desktop: md: (≥ 768px)
  - Large: lg: (≥ 1024px)
  - Extra Large: xl: (≥ 1280px)
  - 2XL: 2xl: (≥ 1536px)
- **Layout Changes**:
  - Mobile: Card view, bottom navigation
  - Desktop: Table view, sidebar navigation
- **Text Sizing**: Responsive font sizes (text-sm, text-base, text-lg, text-xl)
- **Spacing**: Responsive padding and margins

### Theme Toggle
- **Location**: AdminHeader component
- **Persistence**: Uses localStorage
- **Implementation**: Toggles `dark` class on `document.documentElement`
- **State Sync**: Syncs with DOM changes using MutationObserver
- **Icons**: Changes between dark_mode and light_mode icons

---

## Component Props and State

### AdminHeader Props
```javascript
{
  adminName: string,      // Admin name to display
  onLogout: function     // Logout handler function
}
```

### AdminSidebar Props
```javascript
{
  onLogout: function     // Logout handler function
}
```

### Common State Patterns
- `loading`: Boolean for loading states
- `data`: Array for list data
- `searchTerm`: String for search input
- `filter`: String for active filter
- `sortField`: String for current sort field
- `sortDirection`: "asc" | "desc"
- `currentPage`: Number for pagination
- `itemsPerPage`: Number for pagination
- `selectedItem`: Object for detail sidebar

---

## Error Handling

### API Errors
- Try-catch blocks around all API calls
- Console error logging for debugging
- User-friendly error messages via alerts
- Graceful fallbacks for missing data

### Loading States
- Skeleton loaders during data fetch
- Disabled buttons during operations
- Loading text on action buttons

### Empty States
- "No data found" messages
- Filter-specific empty messages
- Helpful guidance for users

---

## Security Considerations

### Authentication
- Token stored in localStorage
- Automatic token attachment to requests
- Token validation on backend
- Logout clears all credentials

### Authorization
- Admin-only endpoints protected by backend
- Frontend assumes authenticated state
- Redirects to login if unauthorized

---

## Performance Optimizations

### React Optimizations
- `useMemo` for expensive computations (filtering, sorting, pagination)
- `useCallback` for stable function references (where applicable)
- Conditional rendering to avoid unnecessary renders
- Lazy loading of API module in events page

### Data Fetching
- Single fetch on component mount
- Efficient filtering/sorting on client-side
- Pagination to limit rendered items
- Debouncing search (implicit through React state)

---

## Browser Compatibility

### Supported Features
- Modern ES6+ JavaScript
- CSS Grid and Flexbox
- localStorage API
- Material Symbols Icons (web font)

### Responsive Breakpoints
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+
- Large Desktop: 1280px+

---

## Known Limitations

1. **Client-side Filtering**: All data loaded at once, then filtered client-side
   - **Impact**: May be slow with very large datasets
   - **Solution**: Backend pagination and filtering would be better

2. **No Bulk Operations**: Cannot select multiple items for bulk actions
   - **Future**: Add checkbox selection and bulk delete/update

3. **No Export Functionality**: Cannot export data to CSV/Excel
   - **Future**: Add export buttons for tables

4. **Limited Validation**: Basic form validation only
   - **Future**: Add comprehensive form validation

5. **No Real-time Updates**: Data doesn't refresh automatically
   - **Future**: Add polling or WebSocket for real-time updates

---

## Future Improvements

### Planned Features
1. **Bulk Operations**
   - Select multiple items
   - Bulk delete/update
   - Bulk upload via Excel

2. **Export Functionality**
   - Export tables to CSV
   - Export to Excel
   - Print reports

3. **Advanced Filtering**
   - Date range filters
   - Multiple filter combinations
   - Save filter presets

4. **Real-time Updates**
   - WebSocket integration
   - Live statistics updates
   - Notification system

5. **Enhanced Analytics**
   - Charts and graphs
   - Time-based analytics
   - Custom date ranges

6. **User Management**
   - Create/edit/delete students
   - Create/edit/delete volunteers
   - Role-based permissions

7. **Event Management**
   - Create and manage events
   - Event scheduling
   - Event-specific settings

8. **Audit Logs**
   - Track all admin actions
   - View change history
   - Export audit reports

---

## Development Notes

### Code Organization
- **Pages**: One page per route in `app/admin/`
- **Components**: Reusable components in `components/admin/`
- **Utilities**: Shared functions in `lib/utils.js`
- **API**: Centralized in `lib/api.js`

### Best Practices Followed
- Consistent naming conventions
- Component reusability
- Theme variable usage
- Responsive design patterns
- Error handling
- Loading states
- Empty states

### Dependencies
- Next.js 13+ (App Router)
- React 18+
- Tailwind CSS
- Axios
- Material Symbols (web font)

---

## Testing Checklist

### Functionality
- [x] All pages load correctly
- [x] Search works on all list pages
- [x] Filters work correctly
- [x] Sorting works on all columns
- [x] Pagination works correctly
- [x] CRUD operations work (stalls, scans)
- [x] Detail sidebars open and close
- [x] Theme toggle works
- [x] Logout redirects correctly
- [x] 404 page displays for invalid routes

### Responsive Design
- [x] Mobile layout works
- [x] Tablet layout works
- [x] Desktop layout works
- [x] Sidebar hides on mobile
- [x] Mobile nav shows on mobile
- [x] Tables convert to cards on mobile

### Theme
- [x] Light mode works
- [x] Dark mode works
- [x] Theme persists across page reloads
- [x] All components use theme variables

---

## Deployment Notes

### Environment Variables
- Backend API URL should be configured in `lib/api.js`
- Ensure CORS is properly configured on backend

### Build Requirements
- Node.js 18+
- npm or yarn
- Next.js build process

### Production Considerations
- Optimize images
- Enable compression
- Configure caching
- Set up error monitoring
- Configure analytics (if needed)

---

## Support and Maintenance

### Common Issues

**Issue**: Theme not persisting
- **Solution**: Check localStorage permissions, ensure theme toggle is in AdminHeader

**Issue**: API calls failing
- **Solution**: Verify backend is running, check CORS settings, verify token in localStorage

**Issue**: Sidebar overlapping content
- **Solution**: Ensure proper padding-top on main elements (pt-24 lg:pt-28)

**Issue**: Mobile navigation not showing
- **Solution**: Check responsive classes (md:hidden for mobile nav)

---

## Changelog

### Version 1.0.0 (Current)
- Initial admin panel implementation
- All core pages created
- Search, filter, sort, pagination implemented
- Detail sidebars for stalls and volunteers
- Theme toggle functionality
- Responsive design
- 404 page
- Profile dropdown menu
- Sidebar logout button

---

## Contact and Support

For issues, questions, or feature requests related to the admin panel, please refer to the project repository or contact the development team.

---

**Document Version**: 1.0.0  
**Last Updated**: Current Date  
**Maintained By**: Development Team

