const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { pool, testConnection } = require('./config/db');
const { assertJwtSecretConfigured } = require('./utils/auth');
const { validateEnv, isProduction } = require('./utils/env');
const { verifyMailConnection } = require('./config/mail');
const { ensureUploadDirs, uploadsDir } = require('./utils/paths');
const { ensureEventRegistrationQr } = require('./utils/eventQr');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { sendError } = require('./utils/apiResponse');

const eventRoutes = require('./routes/eventRoutes');
const guestRoutes = require('./routes/guestRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
let httpServer = null;

ensureUploadDirs();

if (isProduction()) {
  app.set('trust proxy', 1);
}

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://localhost:5173',
  'https://127.0.0.1:5173',
].filter(Boolean);

function isAllowedDevOrigin(origin) {
  if (!origin || isProduction()) return false;
  // Allow local/LAN Vite dev servers on any port (5173, 5174, etc.)
  return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin);
}

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (isAllowedDevOrigin(origin)) return callback(null, true);
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Public CMS assets only — guest QR/invitations served via authenticated API routes
app.use('/uploads/banners', express.static(path.join(uploadsDir, 'banners'), { maxAge: '1d' }));
app.use('/uploads/logos', express.static(path.join(uploadsDir, 'logos'), { maxAge: '1d' }));
app.get('/uploads/qr/event-registration.png', (req, res, next) => {
  const filePath = path.join(uploadsDir, 'qr', 'event-registration.png');
  res.sendFile(filePath, (err) => {
    if (err) next();
  });
});

app.use('/uploads', (req, res) => {
  return sendError(res, 403, { message: 'Direct file access is not permitted' });
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({
      success: true,
      message: 'OOJ Event Management API is running',
      data: { database: 'ok', uptime_seconds: Math.floor(process.uptime()) },
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: 'Service unavailable',
      data: { database: 'error' },
    });
  }
});

app.use('/api/events', eventRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

async function startServer() {
  validateEnv();
  assertJwtSecretConfigured();
  await testConnection();
  await verifyMailConnection().catch(() => {
    console.warn('Email verification skipped — server will continue without email');
  });

  try {
    await ensureEventRegistrationQr();
    console.log('Event registration QR ready');
  } catch (error) {
    console.warn('Event registration QR generation failed:', error.message);
  }

  httpServer = app.listen(PORT, () => {
    console.log(`OOJ Event Management server running on port ${PORT} (${isProduction() ? 'production' : 'development'})`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received — shutting down gracefully`);
  const { closeBrowser } = require('./utils/pdf');

  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }

  await closeBrowser().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
