-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 005: Fix RLS policy recursion causing 500 errors
--
-- Root cause:
--   profiles_read policy contains a subquery that SELECTs from profiles,
--   triggering the same policy → infinite recursion → 500.
--   Additionally, FOR ALL admin write policies run during SELECT queries,
--   hitting the same recursive profiles check even for unauthenticated users.
--
-- Fixes:
--   1. Create a SECURITY DEFINER function for the admin check (bypasses RLS)
--   2. Rewrite profiles_read to use the non-recursive function
--   3. Replace all FOR ALL admin policies with explicit write-only policies
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Fix 1: SECURITY DEFINER helper — bypasses RLS, no recursion ─────────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── Fix 2: Rewrite profiles_read (was recursive) ────────────────────────────
DROP POLICY IF EXISTS "profiles_read" ON profiles;
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (
  auth.uid() = id OR get_my_role() = 'admin'
);

-- ─── Fix 3: Admin write policies — change FOR ALL to write-only ──────────────
-- Departments
DROP POLICY IF EXISTS "departments_admin_write" ON departments;
CREATE POLICY "departments_admin_insert" ON departments
  FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "departments_admin_update" ON departments
  FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "departments_admin_delete" ON departments
  FOR DELETE USING (get_my_role() = 'admin');

-- Procedures
DROP POLICY IF EXISTS "procedures_admin_write" ON procedures;
CREATE POLICY "procedures_admin_insert" ON procedures
  FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "procedures_admin_update" ON procedures
  FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "procedures_admin_delete" ON procedures
  FOR DELETE USING (get_my_role() = 'admin');

-- Categories
DROP POLICY IF EXISTS "categories_admin_write" ON categories;
CREATE POLICY "categories_admin_insert" ON categories
  FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "categories_admin_update" ON categories
  FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "categories_admin_delete" ON categories
  FOR DELETE USING (get_my_role() = 'admin');

-- Compartments
DROP POLICY IF EXISTS "compartments_admin_write" ON compartments;
CREATE POLICY "compartments_admin_insert" ON compartments
  FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "compartments_admin_update" ON compartments
  FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "compartments_admin_delete" ON compartments
  FOR DELETE USING (get_my_role() = 'admin');

-- Equipment Models
DROP POLICY IF EXISTS "equipment_models_admin_write" ON equipment_models;
CREATE POLICY "equipment_models_admin_insert" ON equipment_models
  FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "equipment_models_admin_update" ON equipment_models
  FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "equipment_models_admin_delete" ON equipment_models
  FOR DELETE USING (get_my_role() = 'admin');

-- Procedure Equipment
DROP POLICY IF EXISTS "procedure_equipment_admin_write" ON procedure_equipment;
CREATE POLICY "procedure_equipment_admin_insert" ON procedure_equipment
  FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "procedure_equipment_admin_update" ON procedure_equipment
  FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "procedure_equipment_admin_delete" ON procedure_equipment
  FOR DELETE USING (get_my_role() = 'admin');

-- System Config
DROP POLICY IF EXISTS "system_config_admin_write" ON system_config;
CREATE POLICY "system_config_admin_insert" ON system_config
  FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY "system_config_admin_update" ON system_config
  FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "system_config_admin_delete" ON system_config
  FOR DELETE USING (get_my_role() = 'admin');
