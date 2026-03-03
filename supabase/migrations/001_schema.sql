-- ─────────────────────────────────────────────────────────────────────────────
-- NurseTrack Inventory System — Initial Schema
-- Run this in Supabase SQL Editor or apply via Supabase CLI
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE item_status AS ENUM ('available', 'borrowed', 'damaged', 'disposed', 'under_maintenance');
CREATE TYPE transaction_status AS ENUM ('borrowed', 'returned', 'overdue');
CREATE TYPE return_condition AS ENUM ('good', 'damaged', 'missing_parts', 'disposed');
CREATE TYPE user_role AS ENUM ('admin', 'staff');

-- ─── Profiles (Staff / Admin — linked to auth.users) ─────────────────────────
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  full_name  TEXT NOT NULL DEFAULT '',
  role       user_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'staff'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Departments ──────────────────────────────────────────────────────────────
CREATE TABLE departments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Procedures ───────────────────────────────────────────────────────────────
CREATE TABLE procedures (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Categories ───────────────────────────────────────────────────────────────
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  color_shade TEXT NOT NULL DEFAULT '#22c55e',
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Compartments ─────────────────────────────────────────────────────────────
CREATE TABLE compartments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Borrowers ────────────────────────────────────────────────────────────────
CREATE TABLE borrowers (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id         TEXT NOT NULL UNIQUE,
  student_name       TEXT NOT NULL,
  college_department TEXT NOT NULL,
  instructor_name    TEXT NOT NULL,
  subject            TEXT NOT NULL,
  group_number       TEXT,
  class_schedule     TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Equipment Models ─────────────────────────────────────────────────────────
CREATE TABLE equipment_models (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Procedure ↔ Equipment (Many-to-Many) ────────────────────────────────────
CREATE TABLE procedure_equipment (
  procedure_id        UUID NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  equipment_model_id  UUID NOT NULL REFERENCES equipment_models(id) ON DELETE CASCADE,
  PRIMARY KEY (procedure_id, equipment_model_id)
);

-- ─── Equipment Items (Physical Units) ────────────────────────────────────────
CREATE TABLE equipment_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unique_code         TEXT NOT NULL UNIQUE,
  equipment_model_id  UUID NOT NULL REFERENCES equipment_models(id) ON DELETE RESTRICT,
  compartment_id      UUID REFERENCES compartments(id) ON DELETE SET NULL,
  status              item_status NOT NULL DEFAULT 'available',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Borrow Transactions ──────────────────────────────────────────────────────
CREATE TABLE borrow_transactions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  borrower_id          UUID NOT NULL REFERENCES borrowers(id) ON DELETE RESTRICT,
  procedure_id         UUID REFERENCES procedures(id) ON DELETE SET NULL,
  date_borrowed        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_return_date DATE,
  date_returned        TIMESTAMPTZ,
  status               transaction_status NOT NULL DEFAULT 'borrowed',
  created_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  remarks              TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Borrow Items (Items in a Transaction) ────────────────────────────────────
CREATE TABLE borrow_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id      UUID NOT NULL REFERENCES borrow_transactions(id) ON DELETE CASCADE,
  equipment_item_id   UUID NOT NULL REFERENCES equipment_items(id) ON DELETE RESTRICT,
  condition_on_return return_condition,
  remarks             TEXT
);

-- ─── System Config ────────────────────────────────────────────────────────────
CREATE TABLE system_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ─── Updated_at Trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER borrowers_updated_at
  BEFORE UPDATE ON borrowers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Auto-mark Overdue Transactions ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION mark_overdue_transactions()
RETURNS void AS $$
BEGIN
  UPDATE borrow_transactions
  SET status = 'overdue'
  WHERE status = 'borrowed'
    AND expected_return_date IS NOT NULL
    AND expected_return_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE compartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role without triggering RLS recursion
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: users can read their own, admins can read all (non-recursive via SECURITY DEFINER)
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (
  auth.uid() = id OR get_my_role() = 'admin'
);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Public read access for reference data (needed for the public borrow form)
CREATE POLICY "departments_public_read" ON departments FOR SELECT USING (true);
CREATE POLICY "procedures_public_read" ON procedures FOR SELECT USING (true);
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "compartments_public_read" ON compartments FOR SELECT USING (true);
CREATE POLICY "equipment_models_public_read" ON equipment_models FOR SELECT USING (true);
CREATE POLICY "procedure_equipment_public_read" ON procedure_equipment FOR SELECT USING (true);
CREATE POLICY "equipment_items_public_read" ON equipment_items FOR SELECT USING (true);

-- Public can insert borrowers (upsert) and borrow transactions
CREATE POLICY "borrowers_public_insert" ON borrowers FOR INSERT WITH CHECK (true);
CREATE POLICY "borrowers_public_update" ON borrowers FOR UPDATE USING (true);
CREATE POLICY "borrowers_authenticated_read" ON borrowers FOR SELECT USING (true);

CREATE POLICY "borrow_transactions_public_insert" ON borrow_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "borrow_transactions_authenticated_read" ON borrow_transactions FOR SELECT USING (true);
CREATE POLICY "borrow_transactions_staff_update" ON borrow_transactions FOR UPDATE USING (
  auth.uid() IS NOT NULL
);

CREATE POLICY "borrow_items_public_insert" ON borrow_items FOR INSERT WITH CHECK (true);
CREATE POLICY "borrow_items_authenticated_read" ON borrow_items FOR SELECT USING (true);
CREATE POLICY "borrow_items_staff_update" ON borrow_items FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Equipment items: staff can update status
CREATE POLICY "equipment_items_staff_write" ON equipment_items FOR ALL USING (
  auth.uid() IS NOT NULL
);

-- Admin-only write for config data (write-only policies — SELECT handled by public_read above)
CREATE POLICY "departments_admin_insert" ON departments FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "departments_admin_update" ON departments FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "departments_admin_delete" ON departments FOR DELETE USING (get_my_role() = 'admin');

CREATE POLICY "procedures_admin_insert" ON procedures FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "procedures_admin_update" ON procedures FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "procedures_admin_delete" ON procedures FOR DELETE USING (get_my_role() = 'admin');

CREATE POLICY "categories_admin_insert" ON categories FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "categories_admin_update" ON categories FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "categories_admin_delete" ON categories FOR DELETE USING (get_my_role() = 'admin');

CREATE POLICY "compartments_admin_insert" ON compartments FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "compartments_admin_update" ON compartments FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "compartments_admin_delete" ON compartments FOR DELETE USING (get_my_role() = 'admin');

CREATE POLICY "equipment_models_admin_insert" ON equipment_models FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "equipment_models_admin_update" ON equipment_models FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "equipment_models_admin_delete" ON equipment_models FOR DELETE USING (get_my_role() = 'admin');

CREATE POLICY "procedure_equipment_admin_insert" ON procedure_equipment FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "procedure_equipment_admin_update" ON procedure_equipment FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "procedure_equipment_admin_delete" ON procedure_equipment FOR DELETE USING (get_my_role() = 'admin');

CREATE POLICY "system_config_read" ON system_config FOR SELECT USING (true);
CREATE POLICY "system_config_admin_insert" ON system_config FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "system_config_admin_update" ON system_config FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "system_config_admin_delete" ON system_config FOR DELETE USING (get_my_role() = 'admin');

-- ─── Default Seed Data ────────────────────────────────────────────────────────
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

INSERT INTO categories (name, color_shade, description) VALUES
  ('General Equipment', '#86efac', 'Common nursing and medical equipment'),
  ('Laboratory Equipment', '#22c55e', 'Equipment used in laboratory procedures'),
  ('Critical Equipment', '#15803d', 'High-priority or specialized clinical equipment')
ON CONFLICT (name) DO NOTHING;

INSERT INTO procedures (name, description) VALUES
  ('Basic Vital Signs', 'Blood pressure, temperature, pulse, respiration'),
  ('Wound Care', 'Wound dressing and irrigation procedures'),
  ('Intravenous Therapy', 'IV insertion, maintenance, and removal'),
  ('Physical Assessment', 'Head-to-toe physical examination'),
  ('Urinary Catheterization', 'Urinary catheter insertion and maintenance'),
  ('Nasogastric Tube Insertion', 'NGT insertion and feeding'),
  ('Medication Administration', 'Oral and parenteral medication administration'),
  ('Blood Extraction', 'Venipuncture and specimen collection'),
  ('Basic Life Support', 'CPR and emergency procedures')
ON CONFLICT (name) DO NOTHING;

INSERT INTO system_config (key, value) VALUES
  ('block_if_open_transaction', 'true'),
  ('allow_staff_override', 'true'),
  ('max_items_per_borrow', '0')
ON CONFLICT (key) DO NOTHING;
