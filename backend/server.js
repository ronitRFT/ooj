const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/db');
const { verifyMailConnection } = require('./config/mail');
const { ensureUploadDirs } = require('./utils/paths');
const { ensureEventRegistrationQr } = require('./utils/eventQr');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const eventRoutes = require('./routes/eventRoutes');
const guestRoutes = require('./routes/guestRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

ensureUploadDirs();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'OOJ Event Management API is running' });
});

app.use('/api/events', eventRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

async function startServer() {
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

  app.listen(PORT, () => {
    console.log(`OOJ Event Management server running on http://localhost:${PORT}`);
  });
}

process.on('SIGINT', async () => {
  const { closeBrowser } = require('./utils/pdf');
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  const { closeBrowser } = require('./utils/pdf');
  await closeBrowser();
  process.exit(0);
});

startServer();
