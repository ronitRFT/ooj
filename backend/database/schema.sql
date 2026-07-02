-- OOJ Event Management Database Schema
-- Run: mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS ooj_events;
USE ooj_events;

CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  venue VARCHAR(255) NOT NULL,
  event_date DATETIME NOT NULL,
  banner_image VARCHAR(500),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
  INDEX idx_guests_email (email)
);

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default event
INSERT INTO events (title, description, venue, event_date, is_active)
VALUES (
  'OOJ Annual Gala 2026',
  'Join us for an unforgettable evening celebrating innovation, community, and excellence. Network with industry leaders, enjoy fine dining, and experience live entertainment.',
  'Grand Ballroom, City Convention Center',
  '2026-08-15 18:00:00',
  1
);
