const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

function isEmailConfigured() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!user || !pass) return false;

  const placeholders = ['your_email@gmail.com', 'your_app_password'];
  if (placeholders.includes(user) || placeholders.includes(pass)) {
    return false;
  }

  return true;
}

function getFromAddress() {
  return process.env.EMAIL_FROM || process.env.SMTP_USER;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: true,
    },
    requireTLS: true,
  });
}

function getTransporter() {
  if (!isEmailConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = createTransporter();
  }

  return transporter;
}

function resetTransporter() {
  transporter = null;
}

async function verifyMailConnection() {
  if (!isEmailConfigured()) {
    console.warn('Email credentials not configured — email sending disabled');
    return false;
  }

  try {
    const mailTransporter = getTransporter();
    await mailTransporter.verify();
    console.log('Email server ready (Gmail SMTP connected)');
    return true;
  } catch (error) {
    resetTransporter();
    console.warn(`Email server verification failed: ${error.message}`);
    return false;
  }
}

module.exports = {
  getTransporter,
  getFromAddress,
  isEmailConfigured,
  resetTransporter,
  verifyMailConnection,
};
