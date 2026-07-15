-- Migration: add invitation_pdf_path column
-- Run: mysql -u root -p ooj_events < database/migration_add_pdf.sql
-- Safe to ignore error if column already exists

USE ooj_events;

ALTER TABLE guests
  ADD COLUMN invitation_pdf_path VARCHAR(500) NULL AFTER invitation_path;
