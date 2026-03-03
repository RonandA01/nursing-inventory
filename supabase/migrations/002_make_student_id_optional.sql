-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: Make student_id optional in borrowers table
-- Students are now identified by name only (matching the paper form workflow)
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop the NOT NULL constraint and UNIQUE index on student_id
ALTER TABLE borrowers ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE borrowers DROP CONSTRAINT IF EXISTS borrowers_student_id_key;

-- Add an index on student_name for faster name-based lookups
CREATE INDEX IF NOT EXISTS idx_borrowers_student_name ON borrowers (LOWER(student_name));