-- Migration: Admin roles (super_admin, admin, volunteer)
-- Run: mysql -u root -p ooj_events < backend/database/migration_admin_roles.sql

USE ooj_events;

-- Add role column (idempotent-safe: will error if already present, ignore in that case)
ALTER TABLE admins
  ADD COLUMN role ENUM('super_admin', 'admin', 'volunteer') NOT NULL DEFAULT 'admin' AFTER password_hash;

-- Grandfather all pre-existing admins to super_admin: before roles existed they
-- had full access, so preserve it. New accounts created via the admin API get
-- explicit scoped roles (admin / volunteer).
UPDATE admins SET role = 'super_admin';
