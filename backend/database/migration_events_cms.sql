-- Migration: Event CMS fields
-- Run: mysql -u root -p ooj_events < database/migration_events_cms.sql

USE ooj_events;

ALTER TABLE events ADD COLUMN subtitle VARCHAR(500) NULL AFTER title;
ALTER TABLE events ADD COLUMN host_name VARCHAR(255) NULL AFTER event_date;
ALTER TABLE events ADD COLUMN yogi_name VARCHAR(255) NULL AFTER host_name;
ALTER TABLE events ADD COLUMN about_yogi TEXT NULL AFTER yogi_name;
ALTER TABLE events ADD COLUMN about_foundation TEXT NULL AFTER about_yogi;
ALTER TABLE events ADD COLUMN logo_image VARCHAR(500) NULL AFTER banner_image;
ALTER TABLE events ADD COLUMN rsvp_contact VARCHAR(255) NULL AFTER logo_image;
ALTER TABLE events ADD COLUMN invitation_text TEXT NULL AFTER rsvp_contact;
ALTER TABLE events ADD COLUMN theme_primary VARCHAR(20) DEFAULT '#D97706' AFTER invitation_text;
ALTER TABLE events ADD COLUMN theme_secondary VARCHAR(20) DEFAULT '#C8A951' AFTER theme_primary;
ALTER TABLE events ADD COLUMN theme_accent VARCHAR(20) DEFAULT '#EADBC8' AFTER theme_secondary;
ALTER TABLE events ADD COLUMN status ENUM('draft','active','completed','archived') DEFAULT 'draft' AFTER theme_accent;

-- Migrate is_active to status if column exists
UPDATE events SET status = 'active' WHERE is_active = 1 AND (status IS NULL OR status = 'draft');
UPDATE events SET status = 'draft' WHERE is_active = 0 AND status IS NULL;

-- Optional: drop legacy column after migration
-- ALTER TABLE events DROP COLUMN is_active;

-- Ensure one active event exists when events were migrated but none marked active
UPDATE events e
INNER JOIN (
  SELECT id FROM events
  WHERE status IS NULL OR status = 'draft' OR status = 'completed'
  ORDER BY event_date DESC
  LIMIT 1
) pick ON e.id = pick.id
SET e.status = 'active'
WHERE NOT EXISTS (SELECT 1 FROM events WHERE status = 'active');
