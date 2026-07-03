# EmergencyKE — System Documentation

## 1. System Overview

EmergencyKE is a community emergency response platform designed for Kenyan users. It allows community members to report emergencies (via web or feature-phone USSD), volunteers to respond to alerts in real time, and administrators to manage the entire operation. The system is built as a MERN-adjacent full-stack application:

- **Backend**: Node.js + Express.js REST API, MySQL database
- **Frontend**: React (Vite), deployed on Vercel
- **Server**: Deployed on Railway (auto-deploys from GitHub `main` branch)
- **Third-party integrations**: Africa's Talking (SMS & USSD), Brevo (transactional email), Nominatim (reverse geocoding)

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│  Browser (React/Vite SPA)    Feature Phone (USSD/SMS)       │
│  Deployed: Vercel             Via Africa's Talking           │
└────────────────┬──────────────────────────┬────────────────-┘
                 │ HTTPS (Axios + JWT)       │ HTTP Webhook
                 ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│              EXPRESS REST API (Railway)                      │
│  Routes → Middleware → Controllers → Utils                   │
│                          │                                   │
│         ┌────────────────┼────────────────┐                  │
│         ▼                ▼                ▼                  │
│       MySQL          Africa's          Brevo                 │
│      (Railway)       Talking           Email                 │
│                      SMS/USSD          API                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Request Lifecycle

Every web request follows this exact path:

```
Client (Axios) → Express Router → auth.middleware (verifyToken)
              → rateLimiter middleware → Controller function
              → DB query (mysql2/promise) → JSON response
```

Public webhooks (USSD, inbound SMS) skip `verifyToken` because they come from Africa's Talking, not logged-in users.

---

## 4. Server-Side Files

### `server/index.js`
The Express application entry point. Configures CORS (allowing requests from the Vercel frontend URL), parses JSON bodies, mounts all route modules under `/api/*`, and starts the HTTP listener on `process.env.PORT`.

**Correlates with**: every route file in `routes/`.

---

### `server/config/db.js`
Creates and exports a **MySQL connection pool** using `mysql2/promise`. The pool allows up to 10 concurrent database connections, preventing "too many connections" errors under load. All controllers import this to run queries with `await db.query(sql, params)`.

**Correlates with**: every controller that touches the database.

---

### `server/middleware/auth.middleware.js`

Exports two middleware functions:

| Function | What it does |
|---|---|
| `verifyToken(req, res, next)` | Reads the `Authorization: Bearer <token>` header, verifies the JWT using `JWT_SECRET`, and attaches the decoded payload to `req.user` (contains `id`, `email`, `role`). Returns 401 if missing or invalid. |
| `requireRole(...roles)` | Checks `req.user.role` against the allowed list. Returns 403 if the user's role is not permitted. |

**Correlates with**: all protected routes. Routes apply `verifyToken` first, then optionally `requireRole('admin')` or `requireRole('volunteer')`.

---

### `server/middleware/rateLimiter.js`

Exports five rate-limit middleware instances built with `express-rate-limit`:

| Limiter | Window | Limit | Key |
|---|---|---|---|
| `authLimiter` | 15 min | 5 requests | IP address |
| `registerLimiter` | 1 hour | 10 registrations | IP address |
| `incidentLimiter` | 1 hour | 3 reports | **Authenticated user ID** (`req.user.id`) |
| `messageLimiter` | 1 min | 30 messages | IP address |
| `volunteerApplyLimiter` | 24 hours | 3 applications | IP address |

The `incidentLimiter` uses the authenticated user's ID as the key (not IP) so that shared networks (e.g., a cyber café) don't have one user's reports counted against another. This works because `verifyToken` runs before `incidentLimiter` in the route chain, so `req.user` is already populated.

**Correlates with**: `incident.routes.js`, `auth.routes.js`, `message.routes.js`, `volunteer.routes.js`.

---

### `server/controllers/auth.controller.js`

Handles the complete authentication lifecycle:

| Export | Description |
|---|---|
| `register` | Validates name, email (regex), phone (07x format), password (8+ chars). Hashes password with bcrypt (12 rounds). Inserts user, generates 24-hour email verification token, sends verification email via Brevo. |
| `verifyEmail` | Reads token from query param, checks expiry (`email_verify_expires > NOW()`), marks `is_email_verified = 1`. |
| `login` | Finds user by email, checks `is_active` and `is_email_verified`, compares password with `bcrypt.compare`. Signs and returns a JWT valid for 7 days. |
| `getMe` | Returns the authenticated user's profile from `req.user` (populated by `verifyToken`). |
| `forgotPassword` | Generates reset token, sets 1-hour expiry in DB, sends reset-link email via Brevo. Returns 200 even if email not found (prevents user enumeration). |
| `resetPassword` | Validates token and expiry, hashes new password, clears token fields. |

**Correlates with**: `auth.routes.js`, `utils/email.js`, `middleware/rateLimiter.js` (authLimiter, registerLimiter).

---

### `server/controllers/incident.controller.js`

The most complex controller. Manages the full incident lifecycle:

| Export | Description |
|---|---|
| `reportIncident` | Creates incident. Checks for duplicates (another incident within 500m and 10 minutes — uses Haversine). If duplicate found, increments `reporter_count` on the parent. Otherwise inserts new incident, finds nearest active volunteer by GPS distance, inserts dispatch alert, sends SMS + in-app notification to that volunteer. |
| `getIncidents` | Returns incidents by status. When called by a volunteer with `excludeOwn=true`, excludes incidents the volunteer has already **declined** (via `NOT EXISTS` subquery on `dispatch_alerts` where `status = 'declined'`). |
| `getMyIncidents` | Returns all incidents reported by `req.user.id`. JOINs the `volunteers` and `users` tables to include `volunteer_name` and `volunteer_phone` so the reporter can see who is responding. |
| `getIncident` | Returns a single incident by ID. Includes reporter details and volunteer details via LEFT JOINs. Also returns `is_assigned_to_me` boolean for volunteer views. |
| `updateStatus` | Transitions incident status. Only the assigned volunteer can move to `in_progress` or `resolved`; admin can move to any status. Records `responded_at` and `resolved_at` timestamps. |
| `respondToAlert` | **Accept**: checks volunteer doesn't already have an `in_progress` incident (concurrent cap), then sets `assigned_volunteer`, changes status to `in_progress`, updates `dispatch_alerts`. **Decline**: upsert pattern — tries `UPDATE dispatch_alerts SET status='declined'`; if 0 rows affected (volunteer not originally dispatched), falls back to `INSERT` a new declined row so the `NOT EXISTS` filter works correctly. |
| `cancelResponse` | Volunteer cancels an accepted incident — resets `assigned_volunteer = NULL`, status back to `reported`, so another volunteer can pick it up. |
| `cancelIncident` | Reporter cancels their own report (only if `reported` or `dispatching`). |

**Correlates with**: `incident.routes.js`, `utils/haversine.js`, `utils/notifications.js`, `utils/sms.js`.

---

### `server/controllers/volunteer.controller.js`

| Export | Description |
|---|---|
| `applyVolunteer` | Inserts volunteer record and associated documents (national_id, first_aid_cert, and optionally drivers_licence, number_plate, vehicle_insurance for driver tiers). Sets `status = 'pending'`. Notifies all admin users. |
| `getHistory` | Returns all incidents the volunteer has been assigned to (joined from `dispatch_alerts`). |

**Correlates with**: `volunteer.routes.js`, `middleware/rateLimiter.js` (volunteerApplyLimiter).

---

### `server/controllers/admin.controller.js`

Admin-only operations. All routes require `verifyToken` + `requireRole('admin')`.

| Export | Description |
|---|---|
| `getVolunteers` | Lists volunteers from `volunteer_document_status` DB view with optional status filter. |
| `getVolunteer` | Returns full volunteer profile including documents and status change log. |
| `approveVolunteer` | Sets `volunteers.status = 'active'`, updates `users.role = 'volunteer'`, inserts status log, notifies volunteer by email and in-app. |
| `rejectVolunteer` | Sets status = 'rejected', logs reason, notifies volunteer. |
| `suspendVolunteer` | Sets status = 'suspended', logs reason, notifies volunteer. |
| `getUsers` | Lists all users with optional search. |
| `deactivateUser` / `activateUser` | Toggles `users.is_active`. Deactivated users cannot log in. |
| `getAllIncidents` | Lists all incidents with filters (status, category, reference, date range). |
| `flagIncident` | Marks an incident for review. |
| `getAnalytics` | Returns aggregate stats: total incidents, resolved, average response time (minutes), incidents per day (last 30 days), incidents by category. |

**Correlates with**: `admin.routes.js`, `utils/email.js`, `utils/notifications.js`.

---

### `server/controllers/message.controller.js`

| Export | Description |
|---|---|
| `getMessages` | Fetches all messages for an incident's chat thread (ordered by `sent_at ASC`). |
| `sendMessage` | Inserts message, determines recipient (the other party in the incident: if sender is reporter, recipient is the volunteer; vice versa), sends in-app notification. If the reporter is a USSD user (no web account), sends an SMS instead. |

**Correlates with**: `message.routes.js`, `utils/notifications.js`, `utils/sms.js`.

---

### `server/controllers/notification.controller.js`

| Export | Description |
|---|---|
| `getNotifications` | Returns unread in-app notifications for `req.user.id`. |
| `markAsRead` | Marks a single notification as read. |
| `markAllAsRead` | Marks all user's notifications as read. |

**Correlates with**: `notification.routes.js`. Notifications are *created* by other controllers via `utils/notifications.js`.

---

### `server/controllers/ussd.controller.js`

Handles interactive USSD sessions from Africa's Talking. The USSD protocol sends all previous inputs concatenated as `text` (e.g., `1*Nairobi*2`), so the controller splits on `*` to determine the current step:

```
Step 0 (text = ""):      Show category menu
Step 1 (text = "1"):     Ask for location (user typed category choice)
Step 2 (text = "1*Nai"): Ask for severity (user typed location)
Step 3 (text = "1*Nai*2"): Validate category & severity, create incident
```

Validation at step 3:
- If category step choice is not in the valid map → `END Invalid choice`
- If severity step choice is not in the valid map → `END Invalid choice`
- Otherwise → creates incident, sends `END` confirmation with reference number

For USSD users, the system creates or retrieves a minimal user account linked to their phone number.

**Correlates with**: `ussd.routes.js`, `config/db.js`, `utils/sms.js`.

---

### `server/controllers/sms.controller.js`

Receives inbound SMS from Africa's Talking webhook. Looks up the phone number in `users`, finds their most recent active incident, inserts the SMS body as a chat message, and notifies the volunteer.

**Correlates with**: `sms.routes.js`, `utils/notifications.js`.

---

### `server/utils/email.js`
Uses the `@getbrevo/brevo` SDK to send transactional emails (verification links, password reset links). Configured with `BREVO_API_KEY` environment variable.

### `server/utils/sms.js`
Uses the `africastalking` SDK to send SMS messages. Configured with `AT_API_KEY` and `AT_USERNAME` environment variables.

### `server/utils/haversine.js`
Pure function implementing the Haversine formula to calculate the great-circle distance (in km) between two GPS coordinates. Used for:
1. Finding the nearest volunteer to a new incident
2. Detecting duplicate incident reports within 500m

### `server/utils/notifications.js`
Wraps a simple `INSERT INTO notifications` query. Called by controllers to create in-app notifications. Wrapped in try-catch so a notification failure never causes the parent operation to fail.

---

## 5. Route Files

Each route file maps HTTP verbs + paths to controller functions with appropriate middleware:

| File | Mount point | Key middleware applied |
|---|---|---|
| `auth.routes.js` | `/api/auth` | `authLimiter` on login/forgot; `registerLimiter` on register |
| `incident.routes.js` | `/api/incidents` | `verifyToken` on all; `incidentLimiter` on POST / |
| `volunteer.routes.js` | `/api/volunteers` | `verifyToken` on all; `requireRole('volunteer')` on response routes |
| `admin.routes.js` | `/api/admin` | `verifyToken` + `requireRole('admin')` on all |
| `message.routes.js` | `/api/messages` | `verifyToken` + `messageLimiter` on POST |
| `notification.routes.js` | `/api/notifications` | `verifyToken` on all |
| `ussd.routes.js` | `/api/ussd` | No auth (Africa's Talking webhook, public) |
| `sms.routes.js` | `/api/sms` | No auth (Africa's Talking webhook, public) |

---

## 6. Client-Side Files

### `client/src/main.jsx`
React 18 entry point. Mounts `<App />` inside `<AuthProvider>` to the `#root` DOM element.

### `client/src/App.jsx`
Defines all client-side routes using React Router. Groups routes by role. Uses `<ProtectedRoute>` to enforce authentication and role checks. Redirects unknown paths to the appropriate dashboard.

### `client/src/context/AuthContext.jsx`
Global authentication state. Provides `user`, `loginUser()`, and `logout()` to the entire app via React Context. Persists the JWT token and user object to `localStorage`. Implements **idle timeout**: listens to mouse, keyboard, scroll, and touch events; if the user is inactive for 15 minutes, automatically calls `logout()`.

**Correlates with**: `App.jsx` (wraps entire app), every page component that calls `useAuth()`.

### `client/src/services/api.js`
Axios instance configured with:
- `baseURL`: `VITE_API_URL` environment variable (set in Vercel deployment settings)
- **Request interceptor**: reads JWT from `localStorage` and appends `Authorization: Bearer <token>` to every outgoing request automatically

Also exports named helper functions for every API endpoint (e.g., `reportIncident(data)`, `acceptAlert(id)`, `getNotifications()`), keeping all HTTP logic in one place rather than scattered across components.

**Correlates with**: every page component that makes API calls.

### `client/src/components/ProtectedRoute.jsx`
HOC (Higher-Order Component) wrapping React Router's `<Outlet>`. Checks:
1. Is the user logged in? If not → redirect to `/login`
2. Does the user's role match the required role? If not → redirect to their own dashboard

**Correlates with**: `App.jsx` (used to wrap all non-public routes).

### `client/src/components/layout/DashboardLayout.jsx`
The persistent shell for all post-login pages. Contains:
- **Sidebar/Navbar**: navigation links that change based on `user.role` (community_member, volunteer, admin)
- **Notification bell**: polls `/api/notifications` every 15 seconds; shows unread badge count; clicking a notification navigates to the relevant incident and marks it read
- **Mobile hamburger menu**

**Correlates with**: every page inside `pages/public/`, `pages/volunteer/`, `pages/admin/`.

---

### Authentication Pages (`pages/auth/`)

| File | Role |
|---|---|
| `Login.jsx` | Email/password form → calls `POST /api/auth/login` → stores JWT → redirects by role |
| `Register.jsx` | Sign-up form with client-side validation → calls `POST /api/auth/register` → shows "check your email" screen |
| `VerifyEmail.jsx` | Reads `?token=` from URL → calls `GET /api/auth/verify-email` → redirects to login |
| `ForgotPassword.jsx` | Email entry → calls `POST /api/auth/forgot-password` |
| `ResetPassword.jsx` | New password form + token from URL → calls `POST /api/auth/reset-password` |

---

### Community Member Pages (`pages/public/`)

**`PublicDashboard.jsx`**
Home screen for logged-in community members. Shows their most recent active incident (if any) and quick-action buttons. Polls `/api/auth/me` periodically to detect if their volunteer application was approved, then shows a role upgrade banner.

**`ReportEmergency.jsx`**
Three-step wizard:
1. Select category (medical, fire, road accident, security, other)
2. Get location — GPS button (uses browser `navigator.geolocation` API, then reverse-geocodes with Nominatim) or manual text entry
3. Select severity, add optional description, submit

On submit: calls `POST /api/incidents`. On success: navigates to `ActiveIncident` for real-time tracking.

**`ActiveIncident.jsx`**
Live view of a single incident for the reporter. Polls the incident every few seconds to detect status changes (e.g., a volunteer accepted). Shows:
- Incident status and details
- Volunteer's name and phone number (once assigned)
- Live chat with the responding volunteer (polls messages every 5s)
- Cancel button (if incident is not yet resolved)

**`ApplyVolunteer.jsx`**
Volunteer application form. Collects tier, document numbers, optional GPS location, and a declaration checkbox. Submits to `POST /api/volunteers/apply`.

**`MyReports.jsx`**
List of the user's past incident reports with filter and cancel options. Clicking a row navigates to `ActiveIncident`.

---

### Volunteer Pages (`pages/volunteer/`)

**`VolunteerDashboard.jsx`**
Stats overview + live "Incoming Alerts" feed. Polls `GET /api/incidents?excludeOwn=true&status=reported,dispatching` every 10 seconds. `excludeOwn=true` prevents their own active incident from showing in the alert queue. Declined incidents are also filtered server-side.

**`VolunteerIncidents.jsx`**
Full queue view of unclaimed incidents. Loads more on demand (pagination).

**`ActiveAlert.jsx`**
Detailed view of a specific alert. Shows:
- Incident details + reporter phone (click-to-call link)
- GPS navigation link to incident location
- Accept / Decline buttons (if unclaimed)
- Mark as Resolved / Cancel Response buttons (if accepted)
- Live chat with reporter

**`ResponseHistory.jsx`**
Paginated history of all incidents the volunteer has responded to.

---

### Admin Pages (`pages/admin/`)

**`AdminDashboard.jsx`**
Key stats (total incidents, resolved, active volunteers, pending approvals, avg response time) with quick-action cards.

**`AdminVolunteers.jsx`**
Volunteer list filtered by status. Approve (instant) or Reject (modal with reason) from the list view.

**`AdminVolunteerDetail.jsx`**
Full volunteer profile. Shows submitted document metadata (document numbers — note: the system stores document reference numbers, not uploaded files). Displays status change history log. Actions: approve, reject, suspend.

**`AdminIncidents.jsx`**
Searchable, filterable incident list for admin oversight.

**`AdminUsers.jsx`**
User management: search users, deactivate/reactivate accounts.

**`AdminAnalytics.jsx`**
Visual analytics: incident trends (last 30 days bar chart), breakdown by category.

---

### UI Components (`components/ui/`)

| Component | Purpose |
|---|---|
| `Button.jsx` | Consistent button with `loading` prop (shows spinner and disables during async calls) |
| `InputField.jsx` | Input with optional password strength meter and show/hide toggle |
| `Modal.jsx` | Overlay dialog; closes on Escape key or backdrop click |
| `Alert.jsx` | Inline alert banner. Types: `error` (⚠), `success` (✓), `warning` (ℹ), `info` (no icon) |
| `Badge.jsx` | Coloured pill showing incident or volunteer status |
| `Spinner.jsx` | Loading spinner animation |

---

### `client/src/utils/geocode.js`
Calls the Nominatim OpenStreetMap API to convert GPS coordinates to a human-readable address string. Used in `ReportEmergency.jsx` and `ApplyVolunteer.jsx` when the user clicks "Use My Location."

---

## 7. Database Tables and Relationships

```
users
  ├── incidents (reporter_id → user_id)
  ├── volunteers (user_id → user_id)
  ├── messages (sender_id → user_id)
  └── notifications (recipient_id → user_id)

volunteers
  ├── volunteer_documents (volunteer_id → volunteer_id)
  ├── volunteer_status_log (volunteer_id → volunteer_id)
  ├── dispatch_alerts (volunteer_id → volunteer_id)
  └── incidents.assigned_volunteer → volunteers.volunteer_id

incidents
  ├── dispatch_alerts (incident_id → incident_id)
  ├── messages (incident_id → incident_id, via chats)
  ├── notifications (incident_id → incident_id)
  └── incidents.parent_incident_id → incidents.incident_id (duplicate clustering)
```

**`volunteer_document_status`** — A database VIEW (not a table) that JOINs `volunteers`, `users`, and `volunteer_documents` into a summary row per volunteer. Used by the admin volunteer list to avoid writing the same complex JOIN repeatedly.

---

## 8. Data Flow Examples

### Reporting an Emergency (Web)
```
User fills ReportEmergency.jsx (3 steps)
→ POST /api/incidents (verifyToken → incidentLimiter → reportIncident)
→ DB: check duplicates via Haversine within 500m / 10 min
→ If duplicate: increment parent incident reporter_count
→ If new: INSERT incidents, find nearest volunteer by GPS distance
→ INSERT dispatch_alerts for that volunteer
→ sendSMS() to volunteer's phone
→ notify() in-app notification for volunteer
→ Response 201 {incident_id, reference_number}
→ Client navigates to /incident/:id (ActiveIncident.jsx)
```

### Volunteer Accepts Alert
```
Volunteer clicks Accept in ActiveAlert.jsx
→ PUT /api/incidents/:id/respond {action: 'accept'}
   (verifyToken → respondToAlert)
→ DB: check no existing in_progress incident for this volunteer
→ UPDATE incidents SET assigned_volunteer, status='in_progress', responded_at
→ UPDATE dispatch_alerts SET status='accepted'
→ notify() reporter that their incident was accepted
→ Response 200
→ Client refreshes incident (shows Resolve/Cancel buttons)
→ Reporter's ActiveIncident.jsx poll detects status change → shows volunteer name/phone
```

### Volunteer Declines Alert
```
Volunteer clicks Decline in ActiveAlert.jsx
→ PUT /api/incidents/:id/respond {action: 'decline'}
→ UPDATE dispatch_alerts SET status='declined' WHERE incident_id=? AND volunteer_id=?
→ If affectedRows = 0 (volunteer wasn't in original dispatch):
    INSERT dispatch_alerts (..., status='declined')
→ Client navigates back to /volunteer
→ Next time getIncidents runs for this volunteer, NOT EXISTS subquery
  filters this incident out → never reappears on their dashboard
```

---

## 9. Defence Questions — Likely Topics & Model Answers

### Architecture & Design

**Q: Why did you separate the frontend and backend into different deployments?**
The frontend (Vercel) and backend (Railway) are decoupled so they can scale independently and be updated without affecting each other. Vercel's CDN serves the React bundle globally with low latency, while Railway runs the Node.js API closer to the database. This also follows the single-responsibility principle at the infrastructure level.

**Q: Why MySQL and not MongoDB, given you're using Node.js?**
Emergency response data is highly relational — incidents link to volunteers, volunteers link to documents, messages link to incidents and users. Relational integrity (foreign keys, JOIN queries, transactional updates) matters here. A missed JOIN or orphaned record could mean a volunteer is never notified. SQL guarantees these relationships in a way a document store does not without significant extra application logic.

**Q: What is the role of the `volunteer_document_status` view?**
It's a precomputed JOIN — `volunteers` + `users` + `volunteer_documents` — stored as a database view so the admin list page can query a single "table" rather than writing the same complex JOIN in every admin query. It gives completeness flags (`has_national_id`, `has_first_aid_cert`, `is_complete`) without duplicating that logic in code.

---

### Security

**Q: How does authentication work in this system?**
Users authenticate via `POST /api/auth/login`. The server verifies the bcrypt-hashed password and issues a JSON Web Token (JWT) signed with `JWT_SECRET`. The client stores this in `localStorage` and attaches it to every subsequent request via Axios request interceptors (`Authorization: Bearer <token>`). The `verifyToken` middleware on the server decodes the token without a DB lookup, making it stateless and fast.

**Q: Why store the JWT in localStorage instead of an HttpOnly cookie?**
LocalStorage was chosen for simplicity. The trade-off is that localStorage is accessible to JavaScript (XSS risk), whereas an HttpOnly cookie would be inaccessible to JS (better XSS protection). In a production hardening pass, migrating to HttpOnly cookies with SameSite=Strict would be the recommended approach.

**Q: How do you prevent SQL injection?**
All database queries use parameterised queries via `mysql2/promise`: `db.query('SELECT * FROM users WHERE email = ?', [email])`. The `?` placeholders are escaped by the library driver before the query reaches MySQL. No string concatenation is used to build SQL queries.

**Q: How are passwords stored?**
Passwords are hashed using `bcryptjs` with a cost factor of 12 before being stored. Plain-text passwords are never stored. On login, `bcrypt.compare()` tests the submitted password against the stored hash. Salt is built into bcrypt automatically.

**Q: How does rate limiting prevent abuse?**
`express-rate-limit` middleware tracks request counts per key. Incident reports are keyed by authenticated user ID (not IP), so a user can only submit 3 incident reports per hour regardless of which network they're on. Auth attempts are IP-keyed to slow brute-force attacks. Exceeding the limit returns HTTP 429 with a `Retry-After` header.

**Q: How is role-based access control enforced?**
Two layers: (1) Client — `ProtectedRoute` checks `user.role` from context and redirects to the correct dashboard. (2) Server — `requireRole('admin')` middleware checks `req.user.role` (decoded from JWT) on every admin route. Server-side enforcement is the authoritative layer; client-side is only UX.

---

### Race Conditions

**Q: How does the system handle the race condition where two volunteers try to accept the same incident simultaneously?**
The `respondToAlert` function runs two queries in sequence:
1. `UPDATE incidents SET assigned_volunteer = ?, status = 'in_progress' WHERE incident_id = ? AND status != 'in_progress'`
2. Checks `affectedRows` — if 0, the incident was already taken

The `WHERE status != 'in_progress'` clause acts as an **optimistic lock**. MySQL's row-level locking guarantees that only one concurrent `UPDATE` will find `status = 'reported'/'dispatching'`; the other will match 0 rows and receive a 409 Conflict response. The losing volunteer's client then refreshes the incident and shows "This incident has already been accepted by another volunteer."

**Q: Is this race condition handling truly safe? Could both updates succeed?**
Yes, it is safe because MySQL processes `UPDATE` statements with row-level locks atomically. Two concurrent transactions on the same row are serialised — one wins, one sees the already-updated status and affects 0 rows. This is a standard optimistic concurrency pattern used when you can't afford to hold a long transaction.

**Q: What about the concurrent incident cap (a volunteer can't accept two at once)?**
Before accepting, the server queries: `SELECT incident_id FROM incidents WHERE assigned_volunteer = ? AND status = 'in_progress'`. If any row is returned, the request is rejected with 409. This check and the accept UPDATE are in the same controller call but are not wrapped in a DB transaction — meaning in theory two simultaneous accepts from the same volunteer could both pass the check before either writes. This is a known limitation. A production fix would wrap both statements in a DB transaction with `SELECT ... FOR UPDATE` to lock the row.

---

### Real-Time / Polling

**Q: How does the system achieve near-real-time updates? Why not WebSockets?**
The system uses **polling** — the client repeatedly calls the REST API on a timer:
- Messages: every 5 seconds
- Incident status: on every accept/decline action + 5s message poll
- Volunteer alerts: every 10 seconds
- Notifications: every 15 seconds

WebSockets would reduce latency and server load but add significant complexity (persistent connections, connection management, scaling across multiple server instances). For the expected scale of this system, polling is simpler and sufficient.

---

### USSD / SMS

**Q: How does the USSD flow work for users without smartphones?**
Africa's Talking sends an HTTP POST to `/api/ussd` every time the user presses a key. The `text` field in the POST body contains all previous inputs joined by `*`. The controller splits this string to determine the step (0–3) and shows the appropriate menu. At step 3, it validates the category and severity choices before creating an incident. The session ends with `END <message>` or continues with `CON <menu>`.

**Q: What happens if a USSD reporter sends a chat message back?**
The reporter can reply via SMS. Africa's Talking delivers inbound SMS to `/api/sms/inbound`. The `handleInbound` controller matches the phone number to a user, finds their active incident, inserts the message in the chat, and notifies the volunteer.

---

### Duplicate Detection

**Q: How are duplicate incident reports detected?**
When a new report arrives, the server queries for any existing incident within 500 metres and reported within the last 10 minutes:

```sql
SELECT incident_id FROM incidents
WHERE status NOT IN ('resolved','cancelled')
  AND reported_at > NOW() - INTERVAL 10 MINUTE
  AND (
    6371 * ACOS(
      COS(RADIANS(?)) * COS(RADIANS(latitude)) *
      COS(RADIANS(longitude) - RADIANS(?)) +
      SIN(RADIANS(?)) * SIN(RADIANS(latitude))
    )
  ) <= 0.5
LIMIT 1
```

If a match is found, the new report is linked as a duplicate (`parent_incident_id`) and the parent's `reporter_count` is incremented. This signals to responders that multiple people are reporting the same event, increasing urgency.

---

### Volunteer Application & Document Handling

**Q: How are volunteer documents handled? Are they uploaded to the server?**
The current implementation stores **document reference numbers** (text), not file uploads. The `file_path` column in `volunteer_documents` currently holds a placeholder reference string rather than an actual file. A production implementation would integrate a file storage service (e.g., AWS S3 or Cloudinary) and store the upload URL in `file_path`.

**Q: What validation is applied to volunteer applications?**
Server-side: checks that `national_id` is provided. Client-side: validates that required documents for the chosen tier are provided (driver tier requires additional vehicle documents). A known limitation is that the server check does not differentiate by tier — it applies a uniform check. Tier-specific server validation is the recommended improvement.

---

### Email Verification

**Q: Why is email verification required before login?**
To prevent users from registering with someone else's email address and to ensure the contact information is valid (the system sends alert notifications via email). Unverified accounts cannot log in — the login endpoint checks `is_email_verified = 1` and returns 403 if the account is pending.

**Q: What happens if the verification email expires?**
Tokens expire in 24 hours. The user can re-register with the same email to generate a new token. The DB `ON DUPLICATE KEY UPDATE` (or equivalent) would update the token. The user is shown a link to resend verification.

---

### Deployment

**Q: How does the deployment pipeline work?**
Both services auto-deploy from the `main` branch on GitHub:
- **Vercel** detects a push, builds the Vite bundle (`npm run build`), and deploys the static files to its CDN
- **Railway** detects a push, pulls the latest code, installs dependencies, and restarts the Node.js process

Environment variables (database credentials, API keys, JWT secret) are stored in each platform's settings, never committed to the repository.

**Q: How do the client and server communicate in production?**
The client uses the `VITE_API_URL` environment variable (set in Vercel) to point to the Railway server URL. All requests go over HTTPS. CORS on the server allows requests only from the Vercel frontend domain.

---

## 10. Known Limitations & Recommended Improvements

| Limitation | Recommended Fix |
|---|---|
| JWT stored in localStorage (XSS risk) | Migrate to HttpOnly SameSite=Strict cookies |
| Accept race condition not wrapped in DB transaction | Use `START TRANSACTION` + `SELECT ... FOR UPDATE` |
| File uploads store reference numbers, not actual files | Integrate S3/Cloudinary for document storage |
| Polling for real-time updates (high request volume) | Migrate to WebSockets (Socket.io) |
| Server-side volunteer tier validation incomplete | Add tier-aware document validation |
| Rate limiter response key mismatch (`.message` vs `.error`) | Standardise error response schema |
| No automated test suite | Add Jest unit tests for controllers and Playwright E2E tests |
| Single server instance (Railway) — no horizontal scaling | Add load balancer; move rate limiter to Redis for shared state |
