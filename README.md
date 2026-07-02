# OOJ Event Management

Full-stack event management application with guest registration, QR codes, invitation cards, email delivery, attendance scanning, and an admin dashboard.

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React, React Router, Axios, Vite    |
| Backend  | Node.js, Express                    |
| Database | MySQL (mysql2, no ORM)              |

## Project Structure

```
ooj/
├── backend/
│   ├── config/          # DB & email configuration
│   ├── controllers/     # Route handlers
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middlewares/     # Auth & error handling
│   ├── utils/           # QR, auth, path helpers
│   ├── uploads/         # Generated QR codes & invitations
│   ├── database/        # SQL schema
│   └── server.js        # Entry point
└── frontend/
    ├── pages/           # Route pages
    ├── components/      # Reusable UI components
    └── services/        # API client
```

## Setup

### 1. Database

Create the MySQL database and tables:

```bash
mysql -u root -p < backend/database/schema.sql
```

If upgrading an existing database, add the PDF column:

```bash
mysql -u root -p ooj_events < backend/database/migration_add_pdf.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL and SMTP credentials
npm install
npm run dev
```

Backend runs at `http://localhost:5000`

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## Features

- **Landing Page** — Event details with date, venue, and description
- **Guest Registration** — Form with name, email, phone, organization
- **QR Code Generation** — Unique QR code per guest after registration
- **Invitation Card** — HTML invitation with OOJ logo, banner, Yogi Ji message, converted to PDF
- **Email Delivery** — Sends invitation PDF + QR code via Nodemailer
- **QR Scanner / Check-In** — Camera or manual UUID entry for attendance
- **Admin Dashboard** — Stats, guest list, login-protected routes

## API Routes

| Method | Route                        | Description              |
|--------|------------------------------|--------------------------|
| GET    | `/api/health`                | Health check             |
| GET    | `/api/events/active`         | Active event details     |
| POST   | `/api/guests/register`       | Register a guest         |
| POST   | `/api/guests/check-in`       | Mark attendance          |
| GET    | `/api/guests/uuid/:uuid`     | Get guest by UUID        |
| POST   | `/api/admin/login`           | Admin login              |
| GET    | `/api/admin/stats`           | Dashboard statistics     |
| GET    | `/api/admin/guests`          | All registered guests    |

## Default Admin Credentials

Configure in `backend/.env`:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## Email Configuration

Set SMTP credentials in `backend/.env` for invitation emails:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

Email sending is optional — registration still works without it; guests receive their QR code on the success page.
