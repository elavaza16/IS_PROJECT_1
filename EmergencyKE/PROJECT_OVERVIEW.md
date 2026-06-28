# EmergencyKE — Project File Overview

A full-stack emergency response coordination system for Kenya. Community members report incidents, volunteers are dispatched and respond, and admins manage the platform.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Vite, Axios |
| Backend | Node.js, Express.js 5 |
| Database | MySQL |
| Auth | JWT + bcryptjs |
| Email | Brevo (formerly Sendinblue) |
| SMS | Africa's Talking |
| Maps/Geocoding | OpenStreetMap Nominatim API |

---

## Folder Structure

```
EmergencyKE/
├── client/                  # React frontend
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── context/
│       ├── services/
│       ├── utils/
│       ├── components/
│       │   ├── layout/
│       │   └── ui/
│       └── pages/
│           ├── auth/
│           ├── public/       # Community member pages
│           ├── volunteer/
│           └── admin/
└── server/                  # Express backend
    ├── index.js
    ├── config/
    ├── middleware/
    ├── routes/
    ├── controllers/
    └── utils/
```

---

## CLIENT — Entry Points

### `main.jsx`
The very first file React loads. It mounts the app into the HTML page and pulls in global CSS styles. Has no logic of its own.

**Links to:** `App.jsx`, global CSS

---

### `App.jsx`
Defines every URL route in the application and which page component to show for each. Wraps the whole app with `AuthProvider` so every page can access the logged-in user. Uses `ProtectedRoute` to block pages from users who are not logged in or do not have the right role.

**Links to:** `AuthContext`, `ProtectedRoute`, every page component

---

## CLIENT — Context & State

### `context/AuthContext.jsx`
The single source of truth for who is logged in. Stores the user object and JWT token, provides login/logout functions, and enforces a 15-minute idle session timeout (auto-logout if the user is inactive). Any component that needs to know who is logged in uses the `useAuth()` hook from this file.

**Used by:** `App.jsx`, `DashboardLayout`, `ProtectedRoute`, `PublicDashboard`, `ActiveIncident`, `ActiveAlert`, and most page files

---

## CLIENT — API Services

### `services/api.js`
The only file in the frontend that talks to the server. Sets up an Axios HTTP client pointed at `http://localhost:5000/api` and automatically attaches the JWT token to every request. Exports named functions grouped by feature:

| Group | Functions |
|---|---|
| Auth | `registerUser`, `loginUser`, `verifyEmail`, `forgotPassword`, `resetPassword` |
| Incidents | `reportIncident`, `getIncidents`, `getMyIncidents`, `updateStatus`, `cancelIncident` |
| Volunteers | `applyVolunteer`, `acceptAlert`, `declineAlert`, `cancelResponse`, `getMyResponses` |
| Messages | `getMessages`, `sendMessage` |
| Admin | `getAllIncidents`, `getAllVolunteers`, `approveVolunteer`, `rejectVolunteer`, `suspendVolunteer`, `getAllUsers`, `activateUser`, `deactivateUser`, `getAnalytics` |
| Notifications | `getNotifications`, `markNotificationRead`, `markAllNotificationsRead` |

**Used by:** Every page component

---

## CLIENT — Utilities

### `utils/geocode.js`
Converts GPS coordinates (latitude, longitude) into a human-readable address like "Westlands, Nairobi" by calling OpenStreetMap's free Nominatim API. Falls back to showing raw coordinates if the lookup fails.

**Used by:** `ReportEmergency.jsx`, `ApplyVolunteer.jsx`

---

## CLIENT — Layout Components

### `components/ProtectedRoute.jsx`
A wrapper that sits around every page that requires login. Checks `AuthContext` — if the user is not logged in it redirects to `/login`. If logged in but the wrong role (e.g. a community member trying to access `/admin`), it redirects to their own dashboard.

**Used by:** `App.jsx` (wraps all non-auth routes)

---

### `components/layout/AuthCard.jsx`
A simple visual wrapper — provides the EmergencyKE logo and consistent card styling for all authentication pages. It has no logic.

**Used by:** `Login`, `Register`, `VerifyEmail`, `ForgotPassword`, `ResetPassword`

---

### `components/layout/DashboardLayout.jsx`
The main shell every logged-in page sits inside. Renders:
- A top header with the logo and hamburger menu (mobile)
- A sidebar with navigation links (different links per role)
- A notification bell that polls the server every 15 seconds for new notifications
- A notification dropdown with dismiss/mark-all-read actions
- A logout button

Every page that uses `<DashboardLayout>` automatically gets this chrome around it.

**Links to:** `AuthContext`, `api.js` (notifications), React Router  
**Used by:** Every page inside `public/`, `volunteer/`, `admin/`

---

## CLIENT — UI Components

These are small, reusable building blocks with no business logic.

### `components/ui/Badge.jsx`
Displays a coloured pill label for a status value. Has a `LABELS` map that converts raw database values (e.g. `in_progress`) to readable text (e.g. `In Progress`). If a status is not in the map, it displays the raw value.

**Used by:** `MyReports`, `PublicDashboard`, `ActiveIncident`, `AdminIncidents`, and more

---

### `components/ui/Alert.jsx`
A coloured notification bar. Types: `success` (green), `warning` (yellow), `error` (red), `info` (blue). Used for showing feedback messages to the user.

**Used by:** `ActiveIncident`, `Register`, and various form pages

---

### `components/ui/Button.jsx`
A styled button with variants (`primary`, `secondary`, `danger`, `ghost`) and a built-in loading spinner state.

**Used by:** Throughout the app

---

### `components/ui/InputField.jsx`
A text/password input with support for icons, password visibility toggle, a password strength meter, and error/hint text underneath.

**Used by:** Auth pages, `ApplyVolunteer`

---

### `components/ui/Modal.jsx`
A dialog overlay with header, body, and footer sections. Closes on Escape key or overlay click.

**Used by:** `AdminVolunteers`, `AdminUsers`, `AdminVolunteerDetail`

---

### `components/ui/Spinner.jsx`
A simple animated loading spinner. Used inside `Button` during loading states and on page load.

---

## CLIENT — Auth Pages

### `pages/auth/Login.jsx`
The login form. On success, reads the user's role from the server response and redirects to the correct dashboard (`/dashboard`, `/volunteer`, or `/admin`). Links to forgot password and registration.

**Links to:** `api.loginUser`, `AuthContext`, `AuthCard`

---

### `pages/auth/Register.jsx`
Registration form with name, email, Kenyan phone number (+254 prefix), and password fields. Validates phone format and password strength. After submitting shows a "check your email" screen rather than logging in directly.

**Links to:** `api.registerUser`, `AuthCard`

---

### `pages/auth/VerifyEmail.jsx`
Reads the token from the URL (`?token=...`), sends it to the server, and either shows success (then redirects to login) or an error.

**Links to:** `api.verifyEmail`, `AuthCard`

---

### `pages/auth/ForgotPassword.jsx`
Single email input. Submits a reset request and shows a confirmation message.

**Links to:** `api.forgotPassword`, `AuthCard`

---

### `pages/auth/ResetPassword.jsx`
Reads the reset token from the URL, lets the user enter a new password, and redirects to login on success.

**Links to:** `api.resetPassword`, `AuthCard`

---

## CLIENT — Community Member Pages

### `pages/public/PublicDashboard.jsx`
The home screen for community members. Shows:
- A personalised welcome message
- A compact banner if the user has an active incident (with "View current" / "View all" buttons)
- A role-upgrade banner if their account was just upgraded to volunteer
- Three action cards: Report Emergency, My Reports, Become a Volunteer

Also silently polls `/auth/me` on load to detect if the user's role was upgraded by an admin since their last login.

**Links to:** `api.getMyIncidents`, `api.get('/auth/me')`, `AuthContext`, `DashboardLayout`, `Badge`

---

### `pages/public/ReportEmergency.jsx`
A 3-step wizard for reporting an emergency:
1. Choose a category (Medical, Road Accident, Fire, Security, Other)
2. Capture location — either via the browser GPS or typed manually
3. Review details, choose severity, add optional description, and submit

On submit redirects to the incident detail page and passes a `justReported` flag so a success banner appears.

**Links to:** `api.reportIncident`, `utils/geocode.js`, `DashboardLayout`

---

### `pages/public/ActiveIncident.jsx`
The real-time tracking page for a single incident. Polls incident details every 10 seconds and messages every 5 seconds. Shows:
- Incident details (reference, type, severity, location, status)
- A chat interface between the reporter and the assigned volunteer
- A cancel button (only for the reporter, only while the incident is not yet resolved/cancelled)
- A notice if the assigned volunteer cancelled their response

**Links to:** `api.getMessages`, `api.sendMessage`, `api.cancelIncident`, `AuthContext`, `DashboardLayout`, `Badge`, `Alert`

---

### `pages/public/MyReports.jsx`
A paginated list of all incidents the user has ever reported. Supports filtering to show only active ones. Each row has a "View" button and a "Cancel" button (for non-terminal incidents).

**Links to:** `api.getMyIncidents`, `api.cancelIncident`, `DashboardLayout`, `Badge`

---

### `pages/public/ApplyVolunteer.jsx`
The volunteer application form. Collects:
- Tier choice: First Responder, Driver, or Both
- National ID
- Conditional: driver's licence, number plate, chassis number (if Driver tier)
- Conditional: first aid certificate (if First Responder tier)
- GPS location (for proximity matching when dispatching)
- Declaration checkbox

Shows a success screen with next steps after submission.

**Links to:** `api.applyVolunteer`, `utils/geocode.js`, `DashboardLayout`

---

## CLIENT — Volunteer Pages

### `pages/volunteer/VolunteerDashboard.jsx`
The home screen for volunteers. Shows stat cards (pending alerts, active incidents, total responses, resolved) and the top 3 pending incoming alerts. Polls every 10 seconds so new alerts appear automatically.

**Links to:** `api.getMyResponses`, `api.get('/incidents?...')`, `DashboardLayout`

---

### `pages/volunteer/ActiveAlert.jsx`
The detail page for a single incident a volunteer is responding to. Shows:
- Incident details including the reporter's phone number (as a callable link) and a Google Maps link for navigation
- Accept / Decline / Resolve action buttons (shown based on current status)
- A chat interface (only visible once the volunteer has accepted)
- A "Cancel Response" option

**Links to:** `api.acceptAlert`, `api.declineAlert`, `api.updateStatus`, `api.cancelResponse`, `api.getMessages`, `api.sendMessage`, `DashboardLayout`, `Badge`, `Alert`

---

### `pages/volunteer/VolunteerIncidents.jsx`
A list of available incidents the volunteer can respond to. Filters out incidents the volunteer themselves reported (`excludeOwn=true`). Auto-refreshes every 15 seconds. Has a manual refresh button and status filter tabs.

**Links to:** `api.get('/incidents?...')`, `DashboardLayout`

---

### `pages/volunteer/ResponseHistory.jsx`
A card-based list of all incidents the volunteer has ever responded to. Shows response time, status, category, and reference number. Supports infinite scroll (load 10 more per click). Resolved or in-progress cards are clickable.

**Links to:** `api.getMyResponses`, `DashboardLayout`, `Badge`

---

## CLIENT — Admin Pages

### `pages/admin/AdminDashboard.jsx`
Overview stats for admins: total incidents, resolved, active volunteers, pending approvals, total users, average response time. Also shows quick-action cards for pending volunteer approvals and active incidents.

**Links to:** `api.getAnalytics`, `DashboardLayout`

---

### `pages/admin/AdminVolunteers.jsx`
Volunteer management with status filter tabs (Pending, Active, Rejected, Suspended). Table shows name, tier, area, document completion, and status. Approve and Reject buttons with modal confirmation dialogs. Reject requires a written reason.

**Links to:** `api.getAllVolunteers`, `api.approveVolunteer`, `api.rejectVolunteer`, `DashboardLayout`, `Modal`, `Badge`

---

### `pages/admin/AdminVolunteerDetail.jsx`
Full profile view for a single volunteer. Shows personal details, document verification status for each submitted document, and a full status history log. Approve/Reject actions available for pending volunteers.

**Links to:** `api.get('/admin/volunteers/:id')`, `api.approveVolunteer`, `api.rejectVolunteer`, `DashboardLayout`, `Badge`

---

### `pages/admin/AdminIncidents.jsx`
All incidents table with search, status filter, and category filter. Flagged incidents are highlighted. Each row has a View button.

**Links to:** `api.getAllIncidents`, `DashboardLayout`, `Badge`

---

### `pages/admin/AdminUsers.jsx`
All user accounts table with search. Shows role, email verification status, and active/inactive state. Admins can deactivate or reactivate accounts (not their own, not other admins).

**Links to:** `api.getAllUsers`, `api.deactivateUser`, `api.activateUser`, `DashboardLayout`, `Modal`

---

### `pages/admin/AdminAnalytics.jsx`
Charts and statistics: incidents in the last 30 days (bar chart), incidents by category (horizontal bars), volunteer status breakdown, and resolution rate.

**Links to:** `api.getAnalytics`, `DashboardLayout`

---

## SERVER — Entry Point

### `index.js`
Starts the Express server. Configures CORS, JSON body parsing, and mounts all route files at their API prefixes:

| Prefix | Route File |
|---|---|
| `/api/auth` | `auth.routes.js` |
| `/api/incidents` | `incident.routes.js` |
| `/api/messages` | `message.routes.js` |
| `/api/volunteers` | `volunteer.routes.js` |
| `/api/admin` | `admin.routes.js` |
| `/api/notifications` | `notification.routes.js` |
| `/api/ussd` | `ussd.routes.js` |
| `/api/sms` | `sms.routes.js` |

---

## SERVER — Config

### `config/db.js`
Creates and exports a MySQL connection pool (max 10 connections) using credentials from environment variables. Every controller imports this to run database queries.

---

## SERVER — Middleware

### `middleware/auth.middleware.js`
Two functions used by protected routes:

- **`verifyToken`** — reads the `Authorization: Bearer <token>` header, validates the JWT, and attaches the decoded user to `req.user`. Rejects requests with no or invalid token.
- **`requireRole(...roles)`** — checks that `req.user.role` is one of the allowed roles. Used after `verifyToken` to restrict endpoints to admins, volunteers, etc.

---

## SERVER — Routes

Route files define the URL patterns and chain middleware onto them. They call the corresponding controller function for the actual logic.

### `routes/auth.routes.js`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/register` | None | Create account |
| POST | `/login` | None | Login |
| GET | `/verify-email` | None | Verify email token |
| GET | `/me` | Required | Get logged-in user |
| POST | `/forgot-password` | None | Request reset email |
| POST | `/reset-password` | None | Set new password |

---

### `routes/incident.routes.js`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/` | Required | Report new incident |
| GET | `/` | Required | List incidents (volunteer view) |
| GET | `/mine` | Required | User's own incidents |
| GET | `/:id` | Required | Single incident detail |
| PATCH | `/:id/status` | Required | Update status (resolve) |
| PATCH | `/:id/cancel` | Required | Reporter cancels |
| PATCH | `/:id/respond` | Volunteer | Accept or decline alert |
| PATCH | `/:id/cancel-response` | Volunteer | Volunteer drops response |

---

### `routes/volunteer.routes.js`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/apply` | Required | Submit application |
| GET | `/history` | Required | Response history |

---

### `routes/message.routes.js`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/:incidentId` | Required | Get chat messages |
| POST | `/` | Required | Send message |

---

### `routes/admin.routes.js`
All endpoints require admin role.

| Method | Path | Purpose |
|---|---|---|
| GET | `/volunteers` | List volunteers by status |
| GET | `/volunteers/:id` | Volunteer profile + docs + history |
| PATCH | `/volunteers/:id/approve` | Approve application |
| PATCH | `/volunteers/:id/reject` | Reject with reason |
| PATCH | `/volunteers/:id/suspend` | Suspend volunteer |
| GET | `/users` | All users |
| PATCH | `/users/:id/deactivate` | Deactivate account |
| PATCH | `/users/:id/activate` | Reactivate account |
| GET | `/incidents` | All incidents with filters |
| GET | `/incidents/:id` | Single incident (admin view) |
| PATCH | `/incidents/:id/flag` | Flag incident |
| GET | `/analytics` | Aggregated stats |

---

### `routes/notification.routes.js`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | Required | Get user's notifications |
| PATCH | `/:id/read` | Required | Mark one as read |
| PATCH | `/read-all` | Required | Mark all as read |

---

## SERVER — Controllers

Controllers contain the actual business logic. Each one receives the HTTP request, interacts with the MySQL database, and sends back a response.

### `controllers/auth.controller.js`
Handles account creation, email verification, login (with JWT generation), and password reset. Passwords are hashed with bcryptjs before storage. Tokens for email verification and password reset are stored in the database with expiry times.

**Links to:** `config/db.js`, `utils/email.js`

---

### `controllers/incident.controller.js`
The most complex controller. Key behaviours:

- **Report:** Creates the incident, then uses the Haversine formula to find the nearest active volunteer within range. Sends that volunteer an SMS and an in-app notification. Also detects duplicate reports within 500 metres of an existing active incident.
- **Respond:** When a volunteer accepts, updates the incident status to `in_progress` and notifies the reporter. When a volunteer declines or cancels, the incident goes back to `reported` and the reporter is notified.
- **Cancel:** Only the original reporter can cancel; checks ownership before allowing.

**Links to:** `config/db.js`, `utils/haversine.js`, `utils/sms.js`, `utils/notifications.js`

---

### `controllers/volunteer.controller.js`
Handles volunteer applications. Validates that required documents are present for the chosen tier (e.g. a Driver must submit a driver's licence). Stores the application and documents. Also returns response history.

**Links to:** `config/db.js`

---

### `controllers/admin.controller.js`
All admin management operations. The `approveVolunteer` function upgrades the user's role in the `users` table from `community_member` to `volunteer` and logs the status change. The `getAnalytics` function runs aggregated SQL queries for dashboard stats.

**Links to:** `config/db.js`

---

### `controllers/message.controller.js`
Reads and writes chat messages for an incident. When a message is sent, it creates an in-app notification for the other party. For reporters who submitted via USSD (no app), it also sends the message as an SMS.

**Links to:** `config/db.js`, `utils/notifications.js`, `utils/sms.js`

---

### `controllers/notification.controller.js`
Reads notifications for the logged-in user and marks them as read. Straightforward database reads/writes.

**Links to:** `config/db.js`

---

## SERVER — Utilities

### `utils/email.js`
Sends transactional emails using the Brevo API. Two functions:
- `sendVerificationEmail(to, token)` — sends a 24-hour email verification link
- `sendPasswordResetEmail(to, token)` — sends a 1-hour password reset link

Both build branded HTML emails with a clickable button.

**Used by:** `auth.controller.js`

---

### `utils/haversine.js`
A pure math function. Takes two pairs of GPS coordinates and returns the distance between them in kilometres using the Haversine formula (accounts for the Earth's curvature).

**Used by:** `incident.controller.js` (finding nearest volunteer, detecting duplicate reports)

---

### `utils/sms.js`
Sends SMS messages via the Africa's Talking API. Single `sendSMS(phone, message)` function. Errors are caught and logged but never crash the main flow.

**Used by:** `incident.controller.js`, `message.controller.js`

---

### `utils/notifications.js`
Single `notify(userId, title, body)` function that inserts a row into the `notifications` table. Errors are swallowed so a failed notification never breaks the main request.

**Used by:** `incident.controller.js`, `message.controller.js`

---

## Key End-to-End Flows

### 1. User registers and verifies email
`Register.jsx` → `api.registerUser` → `auth.routes` → `auth.controller.register` → DB insert + `email.js` sends link → User clicks link → `VerifyEmail.jsx` → `api.verifyEmail` → DB marks verified → redirect to login

### 2. Community member reports an emergency
`ReportEmergency.jsx` (3 steps) → `api.reportIncident` → `incident.controller.reportIncident` → DB insert → `haversine.js` finds nearest volunteer → `sms.js` texts volunteer → `notifications.js` notifies reporter → redirect to `ActiveIncident.jsx` which polls every 10s

### 3. Volunteer responds to incident
`VolunteerDashboard.jsx` (polls every 10s) sees new alert → navigates to `ActiveAlert.jsx` → clicks Accept → `api.acceptAlert` → `incident.controller.respondToAlert` → DB updates status to `in_progress`, assigns volunteer → `notifications.js` notifies reporter → both sides can now chat via `message.controller.js`

### 4. Volunteer application and approval
`ApplyVolunteer.jsx` → `api.applyVolunteer` → DB creates volunteer record (status = pending) → Admin sees it in `AdminVolunteers.jsx` → clicks Approve → `api.approveVolunteer` → `admin.controller.approveVolunteer` → upgrades `users.role` to `volunteer` → next time user loads dashboard, `/auth/me` returns new role → `PublicDashboard.jsx` shows upgrade banner
