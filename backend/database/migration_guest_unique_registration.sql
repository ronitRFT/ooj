-- Migration: strict duplicate registration per event
-- Safe to re-run: skips indexes that already exist
-- Run: mysql -u root -p ooj_events < backend/database/migration_guest_unique_registration.sql

USE ooj_events;

-- Normalize existing emails for consistent duplicate checks
UPDATE guests SET email = LOWER(TRIM(email)) WHERE email IS NOT NULL;

-- Normalize phone numbers to last 10 digits for duplicate checks (MySQL 8+)
UPDATE guests
SET phone = RIGHT(REGEXP_REPLACE(TRIM(phone), '[^0-9]', ''), 10)
WHERE phone IS NOT NULL
  AND TRIM(phone) != ''
  AND CHAR_LENGTH(REGEXP_REPLACE(TRIM(phone), '[^0-9]', '')) >= 10;

UPDATE guests
SET phone = REGEXP_REPLACE(TRIM(phone), '[^0-9]', '')
WHERE phone IS NOT NULL
  AND TRIM(phone) != ''
  AND CHAR_LENGTH(REGEXP_REPLACE(TRIM(phone), '[^0-9]', '')) < 10;

-- Remove duplicate phone strings (empty -> NULL)
UPDATE guests SET phone = NULL WHERE phone IS NOT NULL AND TRIM(phone) = '';

-- Unique email per event (skip if already applied)
SET @email_idx_exists = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'guests'
    AND index_name = 'idx_guests_event_email'
);

SET @add_email_idx = IF(
  @email_idx_exists = 0,
  'ALTER TABLE guests ADD UNIQUE INDEX idx_guests_event_email (event_id, email)',
  'SELECT ''idx_guests_event_email already exists'' AS notice'
);

PREPARE stmt FROM @add_email_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Unique phone per event when provided (MySQL allows multiple NULL phones)
SET @phone_idx_exists = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'guests'
    AND index_name = 'idx_guests_event_phone'
);

SET @add_phone_idx = IF(
  @phone_idx_exists = 0,
  'ALTER TABLE guests ADD UNIQUE INDEX idx_guests_event_phone (event_id, phone)',
  'SELECT ''idx_guests_event_phone already exists'' AS notice'
);

PREPARE stmt FROM @add_phone_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
