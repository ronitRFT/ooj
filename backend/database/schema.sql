-- OOJ Event Management Database Schema
-- Run: mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS ooj_events;
USE ooj_events;

CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500),
  description TEXT,
  venue VARCHAR(255) NOT NULL,
  event_date DATETIME NOT NULL,
  host_name VARCHAR(255),
  yogi_name VARCHAR(255),
  about_yogi TEXT,
  about_foundation TEXT,
  banner_image VARCHAR(500),
  logo_image VARCHAR(500),
  rsvp_contact VARCHAR(255),
  invitation_text TEXT,
  theme_primary VARCHAR(20) DEFAULT '#D97706',
  theme_secondary VARCHAR(20) DEFAULT '#C8A951',
  theme_accent VARCHAR(20) DEFAULT '#EADBC8',
  status ENUM('draft', 'active', 'completed', 'archived') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_events_status (status)
);

CREATE TABLE IF NOT EXISTS guests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  uuid VARCHAR(36) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  organization VARCHAR(255),
  qr_code_path VARCHAR(500),
  invitation_path VARCHAR(500),
  invitation_pdf_path VARCHAR(500),
  is_attended TINYINT(1) DEFAULT 0,
  attended_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_guests_uuid (uuid),
  INDEX idx_guests_event (event_id),
  UNIQUE INDEX idx_guests_event_email (event_id, email),
  UNIQUE INDEX idx_guests_event_phone (event_id, phone)
);

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'admin', 'volunteer') NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO events (
  title, subtitle, description, venue, event_date,
  host_name, yogi_name, about_yogi, about_foundation,
  rsvp_contact, invitation_text,
  theme_primary, theme_secondary, theme_accent, status
) VALUES (
  'OOJ Annual Gala 2026',
  'An Evening of Grace & Celebration',
  'Join us for an unforgettable evening celebrating innovation, community, and excellence. Network with industry leaders, enjoy fine dining, and experience live entertainment.',
  'Grand Ballroom, City Convention Center',
  '2026-08-15 18:00:00',
  'OOJ Foundation',
  'Yogi Ji',
  'With decades of spiritual guidance, Yogi Ji has inspired millions to walk the path of peace, wisdom, and selfless service.',
  'The OOJ Foundation is dedicated to community upliftment, education, and spiritual wellness across the nation.',
  'events@oojfoundation.org',
  'With the divine blessings of Yogi Ji, the OOJ Foundation warmly welcomes you to this sacred gathering.',
  '#D97706', '#C8A951', '#EADBC8', 'active'
);
