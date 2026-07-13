# OOJ FOUNDATION EVENT MANAGEMENT SYSTEM
## Swimlane Workflow Diagrams & RACI Matrices

**RACI:** R = Responsible · A = Accountable · C = Consulted · I = Informed

---

## Role & Permission Model

### Role Governance Structure

**OOJ Foundation Office (Event Admin, Coordinator):** The foundation office creates and manages events, activates registration, monitors the dashboard, and closes events after the gathering. All admin functions require JWT authentication.

**Venue Staff (Check-In Operator):** Uses the scanner and guest table for event-day check-in. In v1, venue staff shares the same admin login role as Event Admin. v2 will introduce scanner-only RBAC.

**Public Guest:** Registers via the public landing page, receives QR and invitation on the success page, and optionally via email.

**RFT's Tech (System Platform):** The technology platform responsible for validation, QR/PDF generation, duplicate detection, rate limiting, data persistence, asset recovery, and dashboard data refresh.

---

## Document Index

Each entry below corresponds to one swimlane workflow in this document. Step numbers on every flow align with the Flow Step Summary on that page.

| # | Flow | Description |
|---|------|-------------|
| 1 | **Event CMS Setup & Configuration** | How Event Admin creates an event, uploads branding, configures themes, and prepares for go-live |
| 2 | **Event Activation & Registration Distribution** | Setting the active event, generating registration QR, and sharing the public link |
| 3 | **Guest Registration & Invitation Delivery** | Public guest registers, system generates assets, optional email, success page delivery |
| 4 | **Event Day Check-In** | Venue staff scans QR or manually admits guests; system records attendance |
| 5 | **Admin Dashboard & Guest Management** | Event Admin monitors registrations, searches guests, recovers assets, toggles attendance |
| 6 | **Scanner & QR Validation** | Technical flow for camera scan, UUID parsing, and check-in response handling |
| 7 | **Admin Authentication & Access Control** | Login, JWT validation, protected routes, cross-tab session sync |
| 8 | **OOJ Operating Loop** | Continuous cycle: Plan → Activate → Register → Check-In → Review → Close |
| 9 | **End-to-End Information Flow** | Registration data flows from guest form through assets to dashboard metrics |
| 10 | **Event Lifecycle Management** | Draft → Active → Completed → Archived state transitions |
| 11 | **Asset Recovery & Regeneration** | Missing QR/PDF recovery on success page, duplicate registration, and admin recovery |
| 12 | **Role-Based Daily Journeys** | Daily routines for Event Admin vs Venue Staff on event day |

---

## Flow 1 — Event CMS Setup & Configuration

This flow explains how the Event Admin sets up a new foundation event — defining title, venue, date, yogi message, branding images, theme colors, and invitation copy — with RFT's Tech validating uploads and persisting CMS data.

### Swimlane Diagram (Text)

```
┌─────────────────┬──────────────────────┬─────────────────────┐
│ Event Admin     │ RFT's Tech (System)  │ Database / Storage  │
├─────────────────┼──────────────────────┼─────────────────────┤
│ 1. Open Events  │                      │                     │
│    CMS          │                      │                     │
│       │         │                      │                     │
│       ▼         │                      │                     │
│ 2. Fill 16-field│                      │                     │
│    event form   │                      │                     │
│       │         │                      │                     │
│       ▼         │                      │                     │
│ 3. Upload banner│──► 4. Validate image │──► 5. Store banner  │
│    & logo       │    (type, size, MIME)│    & logo paths     │
│       │         │                      │                     │
│       ▼         │                      │                     │
│ 6. Set theme    │──► 7. Validate hex   │──► 8. INSERT event  │
│    colors       │    colors            │    status=draft     │
│       │         │                      │                     │
│       ▼         │                      │                     │
│ 9. Save event   │◄── 10. Return event  │◄──                  │
│    (draft)      │     record           │                     │
└─────────────────┴──────────────────────┴─────────────────────┘
```

### Flow Step Summary

1. Event Admin opens the Events CMS at `/admin/events`.
2. Event Admin fills the 16-field form (title, subtitle, description, venue, date, host, yogi, foundation copy, RSVP, invitation text, themes).
3. Event Admin uploads banner and logo images.
4. RFT's Tech validates image type, size (≤ 5 MB), and MIME match.
5. RFT's Tech stores images in `/uploads/banners/` and `/uploads/logos/`.
6. Event Admin sets theme primary, secondary, and accent hex colors.
7. RFT's Tech validates hex color format.
8. RFT's Tech inserts event record with `status = draft`.
9. Event Admin reviews saved event in Event List.
10. RFT's Tech returns created event to frontend.

### RACI Matrix

| Activity | Event Admin | Venue Staff | RFT's Tech |
|----------|-------------|-------------|------------|
| Open Events CMS | A/R | I | I |
| Fill Event Form | A/R | I | C |
| Upload Banner & Logo | A/R | I | R |
| Validate Uploads | C | I | A/R |
| Set Theme Colors | A/R | I | R |
| Persist Event (draft) | C | I | A/R |
| Review Saved Event | A/R | I | I |

---

## Flow 2 — Event Activation & Registration Distribution

This flow covers activating the event for public registration, generating the registration QR code, and distributing the link via WhatsApp, copy, or download.

### Swimlane Diagram (Text)

```
┌─────────────────┬──────────────────────┬─────────────────────┐
│ Event Admin     │ RFT's Tech (System)  │ Public              │
├─────────────────┼──────────────────────┼─────────────────────┤
│ 1. Select event │                      │                     │
│    in Event List│                      │                     │
│       │         │                      │                     │
│       ▼         │                      │                     │
│ 2. Click Set    │──► 3. Transaction:   │──► 4. Demote prior  │
│    Active       │    lock + demote     │    active → completed│
│       │         │                      │                     │
│       ▼         │──► 5. Generate       │──► 6. Save reg QR   │
│                 │    registration QR   │    PNG              │
│       │         │                      │                     │
│       ▼         │                      │                     │
│ 7. Open         │◄── 8. Return active  │                     │
│    Dashboard    │     event + QR path  │                     │
│       │         │                      │                     │
│       ▼         │                      │                     │
│ 9. Share reg    │──────────────────────────► 10. Guest sees │
│    link / QR    │                      │     landing page    │
│    (WhatsApp,   │                      │     when visiting   │
│     copy)       │                      │                     │
└─────────────────┴──────────────────────┴─────────────────────┘
```

### Flow Step Summary

1. Event Admin selects the target event in Event List.
2. Event Admin clicks **Set Active**.
3. RFT's Tech begins transaction with `SELECT ... FOR UPDATE`.
4. RFT's Tech demotes any currently active event to `completed`.
5. RFT's Tech sets target event to `active` (DB trigger enforces single active).
6. RFT's Tech generates registration QR encoding `{FRONTEND_URL}/register?event=active`.
7. Event Admin opens Dashboard and views EventQrCard.
8. RFT's Tech returns active event data and QR image path.
9. Event Admin shares registration link via WhatsApp, copy, or QR download.
10. Public guests can now access landing and registration pages.

### RACI Matrix

| Activity | Event Admin | Venue Staff | RFT's Tech |
|----------|-------------|-------------|------------|
| Select Event to Activate | A/R | I | I |
| Set Active | A/R | I | R |
| Demote Prior Active Event | I | I | A/R |
| Generate Registration QR | I | I | A/R |
| Share Registration Link | A/R | C | I |
| Public Landing Available | I | I | A/R |

---

## Flow 3 — Guest Registration & Invitation Delivery

This flow shows how a public guest registers, the system generates QR and invitation assets, optionally sends email, and presents the success page.

### Swimlane Diagram (Text)

```
┌─────────────────┬──────────────────────┬─────────────────────┐
│ Public Guest    │ RFT's Tech (System)  │ Email (SMTP)        │
├─────────────────┼──────────────────────┼─────────────────────┤
│ 1. Visit landing│                      │                     │
│    page         │◄── 2. GET /events/   │                     │
│       │         │    active            │                     │
│       ▼         │                      │                     │
│ 3. Open register│                      │                     │
│    form         │                      │                     │
│       │         │                      │                     │
│       ▼         │                      │                     │
│ 4. Submit name, │──► 5. Validate input │                     │
│    email, phone │    + rate limit      │                     │
│       │         │                      │                     │
│       ▼         │──► 6. Check duplicate │                     │
│                 │    email/phone       │                     │
│       │         │                      │                     │
│       ├─ new ──►│──► 7. INSERT guest   │                     │
│       │         │    + UUID            │                     │
│       │         │──► 8. Generate QR    │                     │
│       │         │──► 9. Generate HTML  │                     │
│       │         │    + PDF invitation  │                     │
│       │         │                      │                     │
│       ├─ dup ──►│──► 10. ensureGuest   │                     │
│       │         │     Assets (recover) │                     │
│       │         │                      │                     │
│       ▼         │──► 11. Send email ──────────► 12. Deliver │
│                 │    (optional)        │     invitation      │
│       │         │                      │                     │
│       ▼         │                      │                     │
│ 13. Redirect to │◄── 14. Return guest  │                     │
│     /success/   │     + asset paths    │                     │
│     :uuid       │                      │                     │
│       │         │                      │                     │
│       ▼         │                      │                     │
│ 15. Download QR │                      │                     │
│     & PDF       │                      │                     │
└─────────────────┴──────────────────────┴─────────────────────┘
```

### Flow Step Summary

1. Public Guest visits landing page (`/`).
2. RFT's Tech serves active event CMS data (title, banner, theme, copy).
3. Public Guest opens registration form (`/register`).
4. Public Guest submits full name, email, phone (optional), organization.
5. RFT's Tech validates input and applies rate limit (20/15 min).
6. RFT's Tech checks duplicate email or phone for the active event.
7. **If new:** INSERT guest with UUID v4.
8. RFT's Tech generates QR PNG with JSON payload.
9. RFT's Tech generates HTML invitation and Puppeteer PDF.
10. **If duplicate:** RFT's Tech recovers existing assets via `ensureGuestAssets()`.
11. RFT's Tech attempts invitation email (skipped if SMTP unavailable).
12. Email service delivers PDF + QR to guest inbox (if configured).
13. Public Guest is redirected to `/success/:uuid`.
14. RFT's Tech returns full success payload.
15. Public Guest downloads QR and PDF from success page.

### RACI Matrix

| Activity | Public Guest | Event Admin | RFT's Tech |
|----------|--------------|-------------|------------|
| Visit Landing Page | A/R | I | R |
| Submit Registration | A/R | I | R |
| Validate & Rate Limit | I | I | A/R |
| Detect Duplicate | I | I | A/R |
| Generate QR + Invitation | I | I | A/R |
| Send Email (optional) | I | I | A/R |
| View Success Page | A/R | I | R |
| Download QR & PDF | A/R | I | I |

---

## Flow 4 — Event Day Check-In

This flow illustrates event-day operations where Venue Staff scans guest QR codes or manually admits guests, and RFT's Tech records attendance.

### Swimlane Diagram (Text)

```
┌─────────────────┬──────────────────────┬─────────────────────┐
│ Venue Staff     │ RFT's Tech (System)  │ Database            │
├─────────────────┼──────────────────────┼─────────────────────┤
│ 1. Open scanner │                      │                     │
│    /admin/      │                      │                     │
│    scanner      │                      │                     │
│       │         │                      │                     │
│       ▼         │                      │                     │
│ 2. Scan guest   │──► 3. Parse UUID    │                     │
│    QR code      │    from QR JSON      │                     │
│       │         │                      │                     │
│       ▼         │──► 4. POST /admin/   │──► 5. JOIN guest +  │
│                 │    check-in          │    event            │
│       │         │                      │                     │
│       ▼         │──► 6. Verify event   │                     │
│                 │    status = active   │                     │
│       │         │                      │                     │
│       ├─ ok ───►│──► 7. UPDATE         │──► 8. is_attended=1 │
│       │         │    is_attended=1      │    attended_at=NOW()│
│       │         │                      │                     │
│       ├─ dup ──►│──► 9. Return 409     │                     │
│       │         │    already checked in│                     │
│       │         │                      │                     │
│       ├─ bad ──►│──► 10. Return 404/403│                     │
│       │         │                      │                     │
│       ▼         │                      │                     │
│ 11. Show result │◄── 12. Return guest  │                     │
│     (green /    │     name + status    │                     │
│      yellow /   │                      │                     │
│      red)       │                      │                     │
└─────────────────┴──────────────────────┴─────────────────────┘
```

### Flow Step Summary

1. Venue Staff opens Scanner at `/admin/scanner`.
2. Venue Staff scans guest QR code (camera) or pastes UUID manually.
3. RFT's Tech parses UUID from JSON payload or raw string.
4. RFT's Tech receives `POST /api/admin/check-in`.
5. RFT's Tech joins guest and event records.
6. RFT's Tech verifies event `status === 'active'`.
7. RFT's Tech updates `is_attended = 1` and `attended_at = NOW()`.
8. Database persists attendance record.
9. If already checked in → return 409 with guest name.
10. If guest not found or event expired → return 404/403.
11. Venue Staff sees result screen (valid ✓ / duplicate ⚠ / invalid ✗).
12. RFT's Tech returns structured check-in response.

### RACI Matrix

| Activity | Venue Staff | Event Admin | RFT's Tech |
|----------|-------------|-------------|------------|
| Open Scanner | A/R | C | I |
| Scan / Enter UUID | A/R | I | I |
| Parse & Validate QR | I | I | A/R |
| Record Attendance | I | I | A/R |
| Handle Duplicate Scan | C | I | A/R |
| Display Check-In Result | R | I | A |

---

## Flow 5 — Admin Dashboard & Guest Management

This flow covers Event Admin monitoring registrations, searching guests, viewing QR/invitation, quick admit, and manual attendance toggle.

### Flow Step Summary

1. Event Admin logs in and opens Dashboard at `/admin/dashboard`.
2. RFT's Tech loads all guests via `GET /api/admin/guests`.
3. Event Admin views stats (total, attended, pending) — computed client-side.
4. Event Admin uses search/filter (name, phone, attendance status).
5. Event Admin clicks **View QR** or **View Invitation** on a guest row.
6. RFT's Tech calls `GET /api/admin/guests/:id/assets` to recover/regenerate assets.
7. Event Admin uses **Quick Admit** for walk-in guests without scanner.
8. RFT's Tech calls `POST /api/admin/check-in` or `PATCH attendance`.
9. Event Admin toggles manual attendance with confirmation modal.
10. RFT's Tech updates `is_attended` and refreshes guest list.

### RACI Matrix

| Activity | Event Admin | Venue Staff | RFT's Tech |
|----------|-------------|-------------|------------|
| Open Dashboard | A/R | R | R |
| View Guest Stats | A/R | R | R |
| Search & Filter Guests | A/R | R | I |
| View QR / Invitation | A/R | R | R |
| Quick Admit Guest | C | A/R | R |
| Manual Attendance Toggle | A/R | R | R |
| Refresh Guest List | I | R | A/R |

---

## Flow 6 — Scanner & QR Validation

This flow defines the technical validation path for QR data from camera scan through to check-in response.

### Flow Step Summary

1. Venue Staff grants camera permission (requires HTTPS in production).
2. RFT's Tech (frontend) initializes `html5-qrcode` scanner.
3. Camera detects QR and returns raw string.
4. RFT's Tech (frontend) sends `qrData` to `POST /api/admin/check-in`.
5. RFT's Tech (backend) `extractUuidFromRequest()` parses JSON or UUID.
6. RFT's Tech validates UUID format and looks up guest.
7. RFT's Tech applies check-in rate limit (60/15 min).
8. RFT's Tech executes check-in business rules (Flow 4 steps 5–10).
9. Frontend displays color-coded result with guest name.
10. Scanner resets for next scan after configurable delay.

### RACI Matrix

| Activity | Venue Staff | Event Admin | RFT's Tech |
|----------|-------------|-------------|------------|
| Grant Camera Permission | A/R | I | I |
| Initialize Scanner | I | I | A/R |
| Detect QR Code | I | I | A/R |
| Parse UUID from Payload | I | I | A/R |
| Validate Guest & Event | I | I | A/R |
| Apply Rate Limit | I | I | A/R |
| Display Scan Result | R | I | A |

---

## Flow 7 — Admin Authentication & Access Control

This flow explains how admin login is validated, JWT is issued, protected routes are enforced, and sessions sync across tabs.

### Flow Step Summary

1. Event Admin or Venue Staff submits username/password at `/admin/login`.
2. RFT's Tech applies login rate limit (5/15 min).
3. RFT's Tech looks up admin in `admins` table and compares bcrypt hash.
4. RFT's Tech issues JWT with `{ id, username, role: 'admin' }`, 24h expiry.
5. Frontend stores token in `localStorage.adminToken`.
6. Protected routes (`ProtectedAdminRoute`) validate JWT expiry client-side.
7. Axios interceptor attaches `Authorization: Bearer` header to all admin API calls.
8. Backend `verifyAuth` middleware validates token on every admin request.
9. On 401 response, frontend clears token and redirects to login.
10. `AdminAuthSync` propagates logout across browser tabs.

### RACI Matrix

| Activity | Event Admin | Venue Staff | RFT's Tech |
|----------|-------------|-------------|------------|
| Submit Login Credentials | R | R | I |
| Validate Password (bcrypt) | I | I | A/R |
| Issue JWT Token | I | I | A/R |
| Enforce Protected Routes | I | I | A/R |
| Attach Bearer Token | I | I | A/R |
| Handle 401 / Auto Logout | I | I | A/R |
| Cross-Tab Session Sync | I | I | A/R |

---

## Flow 8 — OOJ Operating Loop

This flow presents the continuous operating cycle for foundation events.

### Swimlane Diagram (Text)

```
    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
    │  PLAN    │────►│ ACTIVATE │────►│ REGISTER │────►│ CHECK-IN │
    │  (CMS)   │     │  EVENT   │     │  GUESTS  │     │  (SCAN)  │
    └──────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                             │
    ┌──────────┐     ┌──────────┐                           │
    │  CLOSE   │◄────│  REVIEW  │◄──────────────────────────┘
    │  EVENT   │     │ DASHBOARD│
    └──────────┘     └──────────┘
```

### Flow Step Summary

1. Event Admin monitors event state and guest registrations on Dashboard.
2. Event Admin decides priorities (share registration link, prepare venue).
3. Event Admin assigns venue staff to scanner stations.
4. Venue Staff executes check-in operations on event day.
5. Event Admin reviews attendance outcomes and guest list.
6. RFT's Tech maintains data integrity, asset recovery, and rate limits.
7. Loop repeats until event is archived or completed.

### RACI Matrix

| Activity | Event Admin | Venue Staff | RFT's Tech |
|----------|-------------|-------------|------------|
| Monitor Event State | A/R | I | R |
| Decide Priorities | A/R | I | I |
| Assign Check-In Tasks | A/R | C | I |
| Execute Check-In | C | A/R | R |
| Review Attendance | A/R | C | R |
| Maintain Data & Assets | I | I | A/R |

---

## Flow 9 — End-to-End Information Flow

This flow traces how a guest registration flows from public form through asset generation to dashboard visibility.

### Flow Step Summary

1. Public Guest submits registration form.
2. RFT's Tech creates guest record with UUID in `guests` table.
3. RFT's Tech generates and stores QR PNG, HTML invitation, PDF.
4. RFT's Tech optionally sends email with attachments.
5. Public Guest views success page with download links.
6. Event Admin refreshes Dashboard — new guest appears in guest table.
7. Event Admin identifies guest status (attended / pending) via badge colors.
8. Venue Staff scans guest QR on event day.
9. RFT's Tech updates `is_attended` and `attended_at`.
10. Event Admin sees updated attendance count on Dashboard.

### RACI Matrix

| Activity | Public Guest | Event Admin | RFT's Tech |
|----------|--------------|-------------|------------|
| Submit Registration | A/R | I | R |
| Create Guest Record | I | I | A/R |
| Generate & Store Assets | I | I | A/R |
| View on Dashboard | I | A/R | R |
| Scan QR on Event Day | I | C | R |
| Update Attendance | I | I | A/R |
| Refresh Dashboard Metrics | I | A/R | R |

---

## Flow 10 — Event Lifecycle Management

This flow shows how events move through draft, active, completed, and archived states.

### Flow Step Summary

1. Event Admin creates event → `status = draft`.
2. Event Admin edits CMS fields while in draft.
3. Event Admin sets event active → prior active demoted to `completed`.
4. RFT's Tech enforces single-active via transaction + DB trigger.
5. Public pages serve active event data only.
6. Guests register against active event only.
7. Check-in allowed only for guests of active event.
8. Event Admin archives completed event (not allowed while active).
9. Event Admin may duplicate event as new draft for next gathering.
10. Event Admin deletes non-active event → cascades guests and files.

### RACI Matrix

| Activity | Event Admin | Venue Staff | RFT's Tech |
|----------|-------------|-------------|------------|
| Create Draft Event | A/R | I | R |
| Edit Event CMS | A/R | I | R |
| Set Active | A/R | I | R |
| Enforce Single Active | I | I | A/R |
| Archive Event | A/R | I | R |
| Duplicate Event | A/R | I | R |
| Delete Event | A/R | I | R |

---

## Flow 11 — Asset Recovery & Regeneration

This flow explains how missing QR or PDF files are recovered without re-registering the guest.

### Flow Step Summary

1. Trigger: success page load, duplicate registration, or admin "View QR/Invitation".
2. RFT's Tech calls `ensureGuestAssets(guest)` with per-guest lock.
3. RFT's Tech checks filesystem for QR PNG, HTML, PDF paths.
4. If QR missing → regenerate via `generateQRCode()`.
5. If invitation missing → regenerate HTML + PDF via `createInvitation()`.
6. RFT's Tech updates DB paths if regenerated.
7. RFT's Tech returns asset URLs to caller.
8. Admin or guest views/downloads recovered assets.
9. On registration failure mid-generation → rollback guest row + delete partial files.
10. Logs asset regeneration events for troubleshooting.

### RACI Matrix

| Activity | Public Guest | Event Admin | RFT's Tech |
|----------|--------------|-------------|------------|
| Trigger Asset Recovery | R | R | I |
| Check Existing Files | I | I | A/R |
| Regenerate Missing QR/PDF | I | I | A/R |
| Update DB Paths | I | I | A/R |
| View / Download Assets | R | R | R |
| Rollback on Failure | I | I | A/R |

---

## Flow 12 — Role-Based Daily Journeys

This flow summarises daily routines for Event Admin and Venue Staff.

### Event Admin Daily Journey (Pre-Event)

| Time | Activity |
|------|----------|
| Morning | Log in → Review Events CMS → Edit copy/images if needed |
| Midday | Set event Active → Share registration QR via WhatsApp |
| Afternoon | Monitor Dashboard → Check new registrations → Recover any failed assets |
| Evening | Review guest count → Confirm venue staff assignments for event day |

### Venue Staff Daily Journey (Event Day)

| Time | Activity |
|------|----------|
| Arrival | Log in → Open Scanner → Test camera on HTTPS device |
| During Event | Scan guest QR codes → Handle manual UUID entry for damaged QR |
| Walk-ins | Use Quick Admit or manual attendance toggle on Dashboard |
| Close | Confirm all attended guests show green badge → Report count to Event Admin |

### RACI Matrix

| Activity | Event Admin | Venue Staff | RFT's Tech |
|----------|-------------|-------------|------------|
| Pre-Event CMS & Activation | A/R | I | R |
| Registration Distribution | A/R | I | R |
| Dashboard Monitoring | A/R | C | R |
| Event Day Scanning | C | A/R | R |
| Walk-In Admit | C | A/R | R |
| Post-Event Review & Archive | A/R | C | R |

---

## Appendix — Actor Quick Reference

| Actor | System Role | Primary Routes |
|-------|-------------|----------------|
| Public Guest | None (unauthenticated) | `/`, `/register`, `/success/:uuid` |
| Event Admin | JWT `role: admin` | `/admin/events`, `/admin/dashboard`, `/admin/registration` |
| Venue Staff | JWT `role: admin` (v1) | `/admin/scanner`, `/admin/dashboard` |
| RFT's Tech | Automated system | All `/api/*` endpoints, `/uploads/*` |

---

## Appendix — Check-In Response Codes

| HTTP Status | Meaning | UI Display |
|-------------|---------|------------|
| 200 | Check-in successful | Green — Welcome message |
| 409 | Already checked in | Yellow — Duplicate warning |
| 403 | Event not active (expired) | Red — Event expired |
| 404 | Guest not found | Red — Invalid QR |
| 401 | Admin not authenticated | Redirect to login |

---

*Document generated from OOJ Foundation Event Management System codebase. Aligned with CMS Swimlane Workflow Document structure. Version 1.0 — As-Built.*
