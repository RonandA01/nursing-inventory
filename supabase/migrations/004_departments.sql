-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 004: Full university department list
-- Run this if you already applied 001–003 and need the updated department list
-- Safe to run multiple times (ON CONFLICT DO NOTHING)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO departments (name) VALUES
  ('College of Health Sciences'),
  ('College of Nursing'),
  ('College of Medicine'),
  ('College of Medical Technology'),
  ('College of Pharmacy'),
  ('College of Allied Health Sciences'),
  ('College of Engineering and Technology'),
  ('College of Business Administration'),
  ('College of Accountancy'),
  ('College of Education'),
  ('College of Arts and Sciences'),
  ('College of Law'),
  ('College of Computer Studies'),
  ('College of Architecture'),
  ('College of Criminology'),
  ('College of Social Work and Community Development'),
  ('Graduate School')
ON CONFLICT (name) DO NOTHING;
