# OOJ FOUNDATION EVENT MANAGEMENT SYSTEM
## Spiritual Event Operations Platform — Single Organization Deployment
### Technical Vision & Product Architecture Document

---

| Field | Value |
|-------|-------|
| **Document Title** | OOJ EMS — Technical Vision v1.0 |
| **Document Status** | As-Built — Reflects Current Codebase |
| **API Version** | v1 (REST) — base path `/api` |
| **Tech Stack** | Node.js · Express · React 19 · Vite · MySQL 8 |
| **Prepared For** | OOJ Foundation / Engineering & Operations Review |
| **Classification** | Internal Use — Foundation Operations |

---

## Contents

1. Executive Summary
2. Platform Context & Operating Model
3. System Architecture & Request Flow
4. Technology Stack — Full Specification
5. API Design & Conventions
6. Database Schema & Data Model
7. Event CMS Architecture
8. Guest Registration — Technical Scope
9. Check-In & Scanner — Technical Scope
10. Admin Dashboard — Technical Scope
11. Invitation & Asset Generation Architecture
12. Email Delivery Architecture
13. Security, Auth & Rate Limiting
14. Deployment & Infrastructure
15. Current Delivery State & Launch Checklist
16. Risks, Assumptions & Success Metrics
17. Future Scope (v2)
18. Appendix A — Complete API Catalogue
19. Appendix B — Event Status State Machine

---

## 1. Executive Summary

The **OOJ Foundation Event Management System (OOJ EMS)** is a full-stack platform for planning, promoting, registering, and operating foundation events. It unifies **Event CMS**, **public registration**, **per-guest QR and invitation assets**, **optional email delivery**, and **venue check-in** into one traceable system.

This document defines the technical architecture, API contracts, data model, security model, and operational flows as implemented in the codebase at `/ooj`.

### Key Design Goals

| Goal | Implementation |
|------|----------------|
| **Single active event** | Only one event may be `active` at a time — enforced in application logic and MySQL triggers |
| **Self-contained guest identity** | Each guest receives a UUID, QR PNG, HTML invitation, and PDF invitation |
| **Idempotent registration** | Duplicate email/phone per event returns existing guest + assets (no double booking) |
| **Admin-only operations** | All management, CMS, check-in, and asset recovery require JWT |
| **Graceful email degradation** | Registration succeeds even if SMTP is unavailable |
| **Dynamic theming** | Event CMS drives colors, copy, banner, and logo on all public pages |

### Module Summary

| Module | Service Owner | Primary API Namespace |
|--------|---------------|----------------------|
| Platform / Auth | `authController` | `/api/admin/login`, `/api/admin/logout` |
| Event CMS | `eventService` | `/api/admin/events/*` |
| Public Event | `eventService` | `/api/events/active` |
| Guest Registration | `guestService` | `/api/guests/register`, `/api/guests/uuid/*` |
| Check-In | `guestService` | `/api/admin/check-in` |
| Admin Dashboard | `guestController` | `/api/admin/guests/*`, `/api/admin/registration-qr` |
| Asset Generation | `invitationService`, `qrcode`, `pdf` | Internal — outputs to `/uploads` |
| Email | `emailService`, `mailService` | Internal — Nodemailer SMTP |

### Operating Position

OOJ EMS is designed for **foundation gala events, spiritual gatherings, and RSVP-managed ceremonies**. The platform prioritizes:

- **Guest experience** — elegant landing page, simple registration, instant QR/PDF on success page
- **Venue operations** — scanner check-in, manual admit, attendance badges
- **Event admin control** — full CMS, lifecycle management, registration QR distribution

---

## 2. Platform Context & Operating Model

### OOJ EMS Operating Loop

```
PLAN EVENT (CMS)
      ▼
SET ACTIVE & DISTRIBUTE REGISTRATION QR
      ▼
GUESTS REGISTER → RECEIVE QR + INVITATION
      ▼
EVENT DAY CHECK-IN (SCANNER / MANUAL)
      ▼
REVIEW DASHBOARD → ARCHIVE / COMPLETE EVENT
```

Every module participates in this loop. Event Admin plans and activates; guests register; Venue Staff checks in; Event Admin reviews attendance and closes the event.

### Actor Model

| Actor | Primary Touchpoints | Access |
|-------|---------------------|--------|
| **Public Guest** | Landing → Register → Success (QR/PDF download) | Public routes only |
| **Event Admin** | Events CMS, set active, registration QR, guest table | JWT admin |
| **Venue Staff** | Scanner, manual check-in, quick admit | JWT admin (same role today) |
| **System** | QR/PDF generation, email, duplicate detection, asset recovery | Automated |

### Role Model (Current v1)

v1 implements a **single admin role** (`role: admin` in JWT). All authenticated admins have full access to CMS, dashboard, scanner, and guest management. Multi-role RBAC (e.g. scanner-only staff) is planned for v2.

### Event Lifecycle States

| Status | Meaning | Public Visibility |
|--------|---------|-------------------|
| `draft` | Being configured | Hidden |
| `active` | Live registration + check-in | Landing, register, success |
| `completed` | Past event, demoted from active | Hidden from public |
| `archived` | Long-term storage | Hidden |

**Rule:** Exactly one event may be `active`. Setting a new event active demotes the previous active event to `completed`.

---

## 3. System Architecture & Request Flow

### High-Level Architecture

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| **Web UI** | React 19 + Vite + React Router 7 | Public pages + admin console |
| **API** | Node.js + Express 4 | REST `/api/*`; modular controllers + services |
| **Database** | MySQL 8 (mysql2, no ORM) | Events, guests, admins |
| **File Storage** | Local disk (`backend/uploads/`) | QR, invitations, banners, logos |
| **PDF Engine** | Puppeteer | HTML invitation → A4 PDF |
| **QR Engine** | `qrcode` npm | Guest QR + event registration QR |
| **Email** | Nodemailer (Gmail SMTP) | Invitation PDF + QR attachment |

### Repository Structure

```
ooj/
├── backend/
│   ├── server.js              # Entry point, CORS, static uploads
│   ├── config/                # db.js, mail.js
│   ├── routes/                # eventRoutes, guestRoutes, adminRoutes
│   ├── controllers/           # auth, event, guest
│   ├── services/              # guest, event, invitation, email, mail
│   ├── middlewares/           # auth, rateLimit, upload, errorHandler
│   ├── utils/                 # QR, PDF, validation, storage, themes
│   ├── database/              # schema.sql + migrations
│   ├── uploads/               # qr/, invitations/, banners/, logos/
│   └── seedAdmin.js
└── frontend/
    └── src/
        ├── App.jsx            # Route tree
        ├── pages/             # Landing, Register, Success, Admin*
        ├── components/        # Forms, tables, scanner, QR cards
        ├── context/           # ActiveEventContext
        └── services/api.js    # Axios client
```

### HTTP Request Flow — Authenticated Admin Request

| # | From | To | Action |
|---|------|-----|--------|
| 1 | Client | → API | HTTP request with `Authorization: Bearer <JWT>` |
| 2 | API | → API | `verifyAuth` — validate token expiry + `role: admin` |
| 3 | API | → API | Rate limiter (if applicable) |
| 4 | API | → Controller | Route handler (event, guest, auth) |
| 5 | Controller | → Service | Business logic + DB transaction |
| 6 | Service | → Filesystem | QR/PDF/banner read or write |
| 7 | API | → Client | `{ success, message, errors, data }` envelope |

### HTTP Request Flow — Public Registration

| # | From | To | Action |
|---|------|-----|--------|
| 1 | Guest | → API | `POST /api/guests/register` |
| 2 | API | → Rate Limiter | 20 requests / 15 min per IP |
| 3 | Controller | → guestService | Validate input, resolve active event |
| 4 | Service | → DB | Check duplicate email/phone for event |
| 5 | Service | → QR + Invitation | Generate assets (or recover if duplicate) |
| 6 | Service | → Email (optional) | Send invitation — non-blocking |
| 7 | API | → Guest | 201 (new) or 200 (already registered) + asset paths |

---

## 4. Technology Stack — Full Specification

### Frontend — Web

| Component | Choice | Notes |
|-----------|--------|-------|
| Framework | React 19 | Functional components + hooks |
| Build | Vite 8 | Fast dev server, production bundle |
| Routing | React Router 7 | Public shell + admin shell |
| HTTP | Axios | Interceptors for JWT + 401 redirect |
| QR Scanner | html5-qrcode | Camera + manual UUID fallback |
| Styling | CSS modules per page/component | Event-themed CSS variables |

### Backend — API

| Component | Choice | Notes |
|-----------|--------|-------|
| Runtime | Node.js | LTS recommended |
| Framework | Express 4 | REST API |
| Database driver | mysql2/promise | Connection pool in `config/db.js` |
| Auth | jsonwebtoken + bcrypt | 24h JWT expiry |
| Validation | Custom validators | email, phone, hex colors, uploads |
| File upload | Multer | Banner/logo — 5 MB, image whitelist |
| Rate limiting | express-rate-limit | Login 5, register 20, check-in 60 / 15 min |
| PDF | Puppeteer | Singleton browser; graceful SIGINT shutdown |

### Data & Files

| Component | Choice | Notes |
|-----------|--------|-------|
| Primary DB | MySQL 8 | Database: `ooj_events` |
| Upload storage | Local filesystem | Served via `GET /uploads/*` |
| Static assets | `backend/assets/` | Default banner + OOJ logo SVG fallbacks |

---

## 5. API Design & Conventions

### Versioning Strategy

| Rule | Specification |
|------|---------------|
| Base path | All endpoints prefixed `/api/` |
| Response envelope | `{ success, message, errors, data }` via `apiResponse.js` |
| Content type | `application/json; charset=utf-8` |
| Auth header | `Authorization: Bearer <token>` for admin routes |
| Static assets | `/uploads/<subdir>/<filename>` — no auth (UUID obscurity) |
| Errors | HTTP status + structured `errors` object for field validation |

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/login` | POST | Username/password → JWT (24h) |
| `/api/admin/logout` | POST | Stateless — client clears token |

### Response Envelope

**Success:**
```json
{
  "success": true,
  "message": "Registration successful",
  "errors": null,
  "data": { "guest": { ... }, "event": { ... } }
}
```

**Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "email": "Enter a valid email address" },
  "data": null
}
```

---

## 6. Database Schema & Data Model

**Schema file:** `backend/database/schema.sql`  
**Database:** `ooj_events`

### Table: `events`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO_INCREMENT | |
| `title` | VARCHAR(255) NOT NULL | Event name |
| `subtitle` | VARCHAR(500) | Hero subtitle |
| `description` | TEXT | Landing tagline |
| `venue` | VARCHAR(255) NOT NULL | |
| `event_date` | DATETIME NOT NULL | |
| `host_name` | VARCHAR(255) | e.g. OOJ Foundation |
| `yogi_name` | VARCHAR(255) | Spiritual leader name |
| `about_yogi` | TEXT | Invitation + landing copy |
| `about_foundation` | TEXT | Foundation description |
| `banner_image` | VARCHAR(500) | `/uploads/banners/...` |
| `logo_image` | VARCHAR(500) | `/uploads/logos/...` |
| `rsvp_contact` | VARCHAR(255) | Contact email/phone |
| `invitation_text` | TEXT | Custom welcome message |
| `theme_primary` | VARCHAR(20) | Default `#D97706` |
| `theme_secondary` | VARCHAR(20) | Default `#C8A951` |
| `theme_accent` | VARCHAR(20) | Default `#EADBC8` |
| `status` | ENUM | `draft`, `active`, `completed`, `archived` |
| `created_at` / `updated_at` | TIMESTAMP | |

**Index:** `idx_events_status (status)`

### Table: `guests`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO_INCREMENT | |
| `event_id` | INT FK → events | ON DELETE CASCADE |
| `uuid` | VARCHAR(36) UNIQUE | Check-in identifier |
| `full_name` | VARCHAR(255) NOT NULL | |
| `email` | VARCHAR(255) NOT NULL | Lowercased on insert |
| `phone` | VARCHAR(50) | Normalized to last 10 digits |
| `organization` | VARCHAR(255) | Optional |
| `qr_code_path` | VARCHAR(500) | `/uploads/qr/{uuid}.png` |
| `invitation_path` | VARCHAR(500) | HTML invitation |
| `invitation_pdf_path` | VARCHAR(500) | PDF invitation |
| `is_attended` | TINYINT(1) | 0 = not checked in |
| `attended_at` | DATETIME NULL | Set on check-in |
| `created_at` | TIMESTAMP | |

**Indexes:**
- `idx_guests_uuid (uuid)`
- `idx_guests_event (event_id)`
- **UNIQUE** `idx_guests_event_email (event_id, email)`
- **UNIQUE** `idx_guests_event_phone (event_id, phone)` — multiple NULLs allowed

### Table: `admins`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO_INCREMENT | |
| `username` | VARCHAR(100) UNIQUE | |
| `password_hash` | VARCHAR(255) | bcrypt (10 rounds) |
| `created_at` | TIMESTAMP | |

### Triggers

From `migration_single_active_event_guard.sql`:

| Trigger | Rule |
|---------|------|
| `events_single_active_before_insert` | Blocks INSERT if another `active` event exists |
| `events_single_active_before_update` | Blocks UPDATE to `active` if another active exists |

### Migrations (Upgrade Path)

| File | Purpose |
|------|---------|
| `schema.sql` | Full initial schema + sample event |
| `migration_events_cms.sql` | CMS fields, status enum |
| `migration_add_pdf.sql` | `invitation_pdf_path` column |
| `migration_guest_unique_registration.sql` | Email/phone unique indexes (idempotent) |
| `migration_single_active_event_guard.sql` | Single-active DB triggers |

---

## 7. Event CMS Architecture

Event CMS is the configuration layer for all public-facing content and operational rules.

### CMS Fields (16 configurable)

Title, subtitle, description, venue, event date, host name, yogi name, about yogi, about foundation, banner image, logo image, RSVP contact, invitation text, theme primary/secondary/accent, status.

### Event Service Operations

| Action | Business Rules |
|--------|----------------|
| **Create** | Requires title, venue, date. New events start as `draft` or activate via transaction |
| **Update** | Cannot demote active → draft without activating another event first |
| **Set Active** | Demotes other active events to `completed`. Regenerates registration QR |
| **Duplicate** | Copies as draft with "(Copy)" suffix; copies banner/logo files |
| **Archive** | Blocked if event is currently active |
| **Delete** | Blocked if active. Cascades guests; deletes all associated files |

### Frontend CMS Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin/events` | `AdminEvents` + `EventForm` + `EventList` | Full CRUD + lifecycle actions |
| `/admin/registration` | `AdminRegistrationPage` | Preview public registration page |

### Dynamic Theming

`ActiveEventContext` fetches `/api/events/active` and injects CSS variables (`--primary`, `--secondary`, `--accent`) into the public shell. All landing, register, and success pages inherit event branding.

---

## 8. Guest Registration — Technical Scope

### Registration Flow

```
POST /api/guests/register
  → Validate full_name, email (required), phone (optional)
  → Fetch active event (404 if none)
  → Check duplicate by normalized email OR phone
     ├─ Duplicate → ensureGuestAssets() → 200 already_registered
     └─ New → INSERT guest with UUID v4
              → generateQRCode() → PNG
              → createInvitation() → HTML + PDF
              → persistGuestAssets()
              → sendInvitationEmail() (optional)
              → 201 created
```

### Duplicate Detection

- **Application level:** `findExistingGuestForEvent()` — normalized email + phone
- **Database level:** Unique indexes on `(event_id, email)` and `(event_id, phone)`
- **Idempotent response:** Returns existing QR/PDF paths — guest can re-access success page

### Public Frontend Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Landing | Event marketing from CMS |
| `/register` | Register | Registration form |
| `/success/:uuid` | Success | QR display, PDF download, invitation preview |

### Rate Limiting

`POST /api/guests/register` — **20 requests / 15 minutes** per IP.

---

## 9. Check-In & Scanner — Technical Scope

### Check-In API

| Endpoint | Method | Input | Outcomes |
|----------|--------|-------|----------|
| `/api/admin/check-in` | POST | `{ uuid }` or `{ qrData }` | 200 success, 404 not found, 403 expired event, 409 already checked in |

### Check-In Logic

1. Parse UUID from raw string or JSON QR payload `{ uuid, name, type: "ooj-event-guest" }`
2. JOIN guest + event
3. Reject if event `status !== 'active'`
4. `UPDATE is_attended=1, attended_at=NOW()` — idempotent for already-attended

### Manual Attendance

`PATCH /api/admin/guests/:id/attendance` — toggle `is_attended` with confirmation modal in admin UI.

### Scanner Frontend

| Route | Component | Notes |
|-------|-----------|-------|
| `/admin/scanner` | `Scanner` (embedded) | Camera QR scan + manual UUID paste |

**Requirement:** Camera API requires HTTPS in production (secure context).

### Rate Limiting

`POST /api/admin/check-in` — **60 requests / 15 minutes** per IP.

---

## 10. Admin Dashboard — Technical Scope

### Dashboard Features

| Feature | Implementation |
|---------|----------------|
| Guest statistics | Client-side aggregation from guest list |
| Registration QR card | `EventQrCard` — copy link, WhatsApp share, download PNG |
| Guest management | `GuestManagement` — search, filter, pagination |
| View QR / Invitation | Modal recovery via `GET /admin/guests/:id/assets` |
| Quick Admit | One-click check-in from guest row |
| Manual attendance | Toggle with confirmation |

### Admin Routes

| Route | Page | Guard |
|-------|------|-------|
| `/admin/login` | AdminLogin | Public |
| `/admin/dashboard` | AdminDashboard | JWT |
| `/admin/events` | AdminEvents | JWT |
| `/admin/scanner` | AdminScannerPage | JWT |

### Cross-Tab Auth Sync

`AdminAuthSync` + `adminAuth.js` — validates JWT expiry client-side; syncs logout across browser tabs.

---

## 11. Invitation & Asset Generation Architecture

### Asset Pipeline

| Asset | Generator | Output Path |
|-------|-----------|-------------|
| Guest QR | `utils/qrcode.js` | `/uploads/qr/{uuid}.png` |
| Event Registration QR | `utils/eventQr.js` | `/uploads/qr/event-registration.png` |
| Invitation HTML | `utils/invitation.js` | `/uploads/invitations/invitation-{uuid}.html` |
| Invitation PDF | `utils/pdf.js` (Puppeteer) | `/uploads/invitations/invitation-{uuid}.pdf` |

### QR Payload Format

```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Guest Name",
  "type": "ooj-event-guest"
}
```

### Asset Recovery

`ensureGuestAssets(guest)` — per-guest lock; regenerates missing QR/PDF on demand. Used by:
- Duplicate registration return path
- Success page load (`GET /guests/uuid/:uuid/success`)
- Admin recovery (`GET /admin/guests/:id/assets`)

### Rollback on Failure

If asset generation fails during new registration, guest row is deleted and partial files are cleaned up.

---

## 12. Email Delivery Architecture

### Email Flow

```
sendInvitationEmail(guest, event, invitation, qrPath)
  → Validate guest email
  → Skip if SMTP not configured (placeholder credentials)
  → Attach: QR PNG (inline), invitation PDF (or HTML fallback)
  → HTML body from emailTemplates.buildGuestInvitationHtml()
  → Non-blocking: registration succeeds even if email fails
```

### SMTP Configuration

| Variable | Purpose |
|----------|---------|
| `SMTP_HOST` | Default `smtp.gmail.com` |
| `SMTP_PORT` | Default `587` |
| `SMTP_USER` / `SMTP_PASS` | Gmail app password |
| `EMAIL_FROM` | Display name + address |

### Graceful Degradation

If email is unavailable, guests still receive QR and PDF on the **success page** (`/success/:uuid`).

---

## 13. Security, Auth & Rate Limiting

### Security Features

| Feature | Implementation |
|---------|----------------|
| CORS | Restricted to `FRONTEND_URL` |
| JWT | Required `JWT_SECRET` at startup; 24h expiry; `role: admin` |
| Password hashing | bcrypt (10 rounds) |
| Rate limiting | Login 5, register 20, check-in 60 / 15 min |
| Upload security | Extension + MIME whitelist, 5 MB cap, sanitized filenames |
| Path traversal | `fileStorage.js` guards |
| Duplicate registration | DB unique indexes + app checks |
| Single active event | Transaction + DB triggers |

### Known v1 Limitations

- Single admin role (no scanner-only RBAC)
- `/uploads` publicly accessible by URL (UUID obscurity)
- No audit log table for admin actions
- No refresh token rotation

---

## 14. Deployment & Infrastructure

### Environment Variables

**Backend (`backend/.env`):**

| Variable | Required | Purpose |
|----------|----------|---------|
| `PORT` | No | Default 5000 |
| `DB_*` | Yes | MySQL connection |
| `JWT_SECRET` | Yes | Must not be placeholder in production |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Yes | Seed admin via `seedAdmin.js` |
| `FRONTEND_URL` | Yes | CORS + QR links |
| `SMTP_*` | No | Email (optional) |

**Frontend (`frontend/.env`):**

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base URL |

### Production Checklist

1. Run `schema.sql` + all migrations
2. `node seedAdmin.js` with strong credentials
3. Set strong `JWT_SECRET`
4. Configure HTTPS (required for scanner camera)
5. Ensure Puppeteer dependencies on server (Chromium)
6. Set one event to **Active** in CMS
7. Smoke test: register → success → scanner → admin recovery

### Recommended Hosting

| Component | Suggestion |
|-----------|------------|
| Frontend | Vercel, Netlify, or Nginx static |
| Backend | VPS / Railway / Render with Node.js |
| Database | Managed MySQL (RDS, PlanetScale, etc.) |
| Uploads | Local disk (v1) — S3 migration in v2 |

---

## 15. Current Delivery State & Launch Checklist

### v1 — Delivered (As-Built)

- [x] Event CMS with 16 fields + image upload + theming
- [x] Single active event enforcement (app + DB)
- [x] Public landing, registration, success pages
- [x] Guest QR + HTML + PDF generation
- [x] Optional email delivery
- [x] Admin JWT auth with rate limiting
- [x] Admin dashboard with guest management
- [x] Scanner check-in + manual admit
- [x] Duplicate registration handling
- [x] Asset recovery/regeneration
- [x] Registration QR distribution (WhatsApp, copy, download)
- [x] Mobile-responsive public pages
- [x] Error boundary on frontend

### Pre-Launch Actions

| # | Action | Owner |
|---|--------|-------|
| 1 | Set event to Active in CMS | Event Admin |
| 2 | Upload real banner + logo | Event Admin |
| 3 | Change JWT_SECRET + admin password | DevOps |
| 4 | Configure production URLs | DevOps |
| 5 | Test scanner on mobile Safari/Chrome | Venue Staff |
| 6 | Verify PDF generation on production server | DevOps |

---

## 16. Risks, Assumptions & Success Metrics

### Risks

| Risk | Mitigation |
|------|------------|
| Puppeteer fails on server | HTML invitation fallback; asset recovery endpoint |
| No active event at launch | CMS guard + clear error on landing/register |
| Admin lockout from rate limit | 5 login attempts / 15 min — wait or adjust limit |
| Public upload URLs guessable | UUID-based filenames; v2: signed URLs |
| Email deliverability | Success page as primary delivery channel |

### Assumptions

- One foundation runs one active event at a time
- Admins are trusted foundation staff
- Guest count per event is manageable on single MySQL instance
- Venue has HTTPS for scanner camera access

### Success Metrics

| Metric | Target |
|--------|--------|
| Registration completion rate | > 95% form submissions succeed |
| Check-in latency | < 2 seconds per scan |
| Duplicate registration handling | 100% return existing assets (no errors) |
| Dashboard load | < 3 seconds for 500 guests |
| Zero double-active events | Enforced by DB trigger |

---

## 17. Future Scope (v2)

| Feature | Priority |
|---------|----------|
| Multi-role RBAC (scanner-only, CMS-only) | High |
| S3/cloud upload storage | High |
| Admin audit log | Medium |
| Frontend 404 page | Low |
| Bulk guest import (CSV) | Medium |
| SMS/WhatsApp invitation delivery | Medium |
| Multi-event concurrent registration | Low |
| Refresh token rotation | Medium |
| Drop legacy `is_active` column | Low |

---

## 18. Appendix A — Complete API Catalogue

### Public

| Method | Route | Auth | Rate Limit |
|--------|-------|------|------------|
| GET | `/api/health` | — | — |
| GET | `/api/events/active` | — | — |
| POST | `/api/guests/register` | — | 20/15min |
| GET | `/api/guests/uuid/:uuid/success` | — | — |
| GET | `/api/guests/uuid/:uuid` | — | — |

### Admin — Auth

| Method | Route | Auth | Rate Limit |
|--------|-------|------|------------|
| POST | `/api/admin/login` | — | 5/15min |
| POST | `/api/admin/logout` | JWT | — |

### Admin — Guests & Check-In

| Method | Route | Auth | Rate Limit |
|--------|-------|------|------------|
| GET | `/api/admin/stats` | JWT | — |
| GET | `/api/admin/guests` | JWT | — |
| GET | `/api/admin/guests/event/:eventId` | JWT | — |
| GET | `/api/admin/guests/:id/assets` | JWT | — |
| PATCH | `/api/admin/guests/:id/attendance` | JWT | — |
| POST | `/api/admin/check-in` | JWT | 60/15min |
| GET | `/api/admin/registration-qr` | JWT | — |

### Admin — Event CMS

| Method | Route | Auth | Upload |
|--------|-------|------|--------|
| GET | `/api/admin/events` | JWT | — |
| GET | `/api/admin/events/:id` | JWT | — |
| POST | `/api/admin/events` | JWT | banner, logo |
| PUT | `/api/admin/events/:id` | JWT | banner, logo |
| POST | `/api/admin/events/:id/set-active` | JWT | — |
| POST | `/api/admin/events/:id/duplicate` | JWT | — |
| POST | `/api/admin/events/:id/archive` | JWT | — |
| DELETE | `/api/admin/events/:id` | JWT | — |

### Static

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/uploads/*` | QR, invitations, banners, logos |

---

## 19. Appendix B — Event Status State Machine

```
                    ┌─────────┐
                    │  draft  │
                    └────┬────┘
                         │ set-active
                         ▼
                    ┌─────────┐
         ┌─────────│ active  │─────────┐
         │         └────┬────┘         │
         │ demote       │              │ archive (blocked)
         │ (another     │              │
         │  activated)  │              ▼
         ▼              │         ┌──────────┐
    ┌───────────┐        │         │ archived │
    │ completed │◄───────┘         └──────────┘
    └───────────┘
         │ delete (allowed)
         ▼
      [removed]
```

### Transition Rules

| From | To | Allowed | Notes |
|------|----|---------|-------|
| draft | active | Yes | Via set-active; transaction demotes others |
| active | completed | Yes | Automatic when another event set active |
| draft | archived | Yes | |
| completed | archived | Yes | |
| active | archived | **No** | Must demote first |
| active | delete | **No** | Must demote first |
| any | draft (demote) | **No** | Cannot demote active to draft directly |

---

*Document generated from OOJ Foundation Event Management System codebase. Version 1.0 — As-Built.*
