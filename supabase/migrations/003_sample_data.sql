-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003: Sample data for full system testing
-- Adds: compartments, equipment models, equipment items, procedure-equipment links
-- Run AFTER 001_schema.sql and 002_make_student_id_optional.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Compartments ─────────────────────────────────────────────────────────────
INSERT INTO compartments (id, name, category_id) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Cabinet A',    (SELECT id FROM categories WHERE name = 'General Equipment')),
  ('b1000000-0000-0000-0000-000000000002', 'Cabinet B',    (SELECT id FROM categories WHERE name = 'Laboratory Equipment')),
  ('b1000000-0000-0000-0000-000000000003', 'Cabinet C',    (SELECT id FROM categories WHERE name = 'Critical Equipment')),
  ('b1000000-0000-0000-0000-000000000004', 'Drawer 1',     (SELECT id FROM categories WHERE name = 'General Equipment')),
  ('b1000000-0000-0000-0000-000000000005', 'Storage Room', (SELECT id FROM categories WHERE name = 'Laboratory Equipment'))
ON CONFLICT (id) DO NOTHING;

-- ─── Equipment Models ─────────────────────────────────────────────────────────
INSERT INTO equipment_models (id, name, category_id, description) VALUES
  -- General Equipment
  ('a1000000-0000-0000-0000-000000000001', 'Sphygmomanometer',   (SELECT id FROM categories WHERE name = 'General Equipment'), 'Aneroid blood pressure apparatus with cuff'),
  ('a1000000-0000-0000-0000-000000000002', 'Stethoscope',        (SELECT id FROM categories WHERE name = 'General Equipment'), 'Acoustic stethoscope for auscultation'),
  ('a1000000-0000-0000-0000-000000000003', 'Clinical Thermometer',(SELECT id FROM categories WHERE name = 'General Equipment'), 'Digital clinical thermometer'),
  ('a1000000-0000-0000-0000-000000000004', 'Penlight',           (SELECT id FROM categories WHERE name = 'General Equipment'), 'Diagnostic penlight for pupil and throat assessment'),
  ('a1000000-0000-0000-0000-000000000005', 'Reflex Hammer',      (SELECT id FROM categories WHERE name = 'General Equipment'), 'Taylor percussion hammer for neurological exam'),
  ('a1000000-0000-0000-0000-000000000006', 'Bandage Scissors',   (SELECT id FROM categories WHERE name = 'General Equipment'), 'Blunt-tip scissors for wound dressing'),
  ('a1000000-0000-0000-0000-000000000007', 'Tourniquet',         (SELECT id FROM categories WHERE name = 'General Equipment'), 'Latex-free tourniquet for venipuncture'),
  ('a1000000-0000-0000-0000-000000000008', 'Medication Tray',    (SELECT id FROM categories WHERE name = 'General Equipment'), 'Stainless steel medication preparation tray'),
  -- Laboratory Equipment
  ('a1000000-0000-0000-0000-000000000009', 'Pulse Oximeter',     (SELECT id FROM categories WHERE name = 'Laboratory Equipment'), 'Fingertip pulse oximeter with SpO2 display'),
  ('a1000000-0000-0000-0000-000000000010', 'Otoscope',           (SELECT id FROM categories WHERE name = 'Laboratory Equipment'), 'Diagnostic otoscope for ear and throat examination'),
  ('a1000000-0000-0000-0000-000000000011', 'Vacutainer Set',     (SELECT id FROM categories WHERE name = 'Laboratory Equipment'), 'Blood collection vacutainer with needle holder'),
  ('a1000000-0000-0000-0000-000000000012', 'IV Administration Set',(SELECT id FROM categories WHERE name = 'Laboratory Equipment'), 'IV tubing, catheter, and connection set'),
  ('a1000000-0000-0000-0000-000000000013', 'Foley Catheter Kit', (SELECT id FROM categories WHERE name = 'Laboratory Equipment'), 'Urinary Foley catheter insertion kit'),
  ('a1000000-0000-0000-0000-000000000014', 'Nasogastric Tube Set',(SELECT id FROM categories WHERE name = 'Laboratory Equipment'), 'NGT with guide wire and irrigation syringe'),
  ('a1000000-0000-0000-0000-000000000015', 'Syringe Set',        (SELECT id FROM categories WHERE name = 'Laboratory Equipment'), 'Assorted syringes: 3cc, 5cc, 10cc'),
  -- Critical Equipment
  ('a1000000-0000-0000-0000-000000000016', 'AED Trainer',        (SELECT id FROM categories WHERE name = 'Critical Equipment'), 'Automated External Defibrillator trainer unit'),
  ('a1000000-0000-0000-0000-000000000017', 'Bag Valve Mask (BVM)',(SELECT id FROM categories WHERE name = 'Critical Equipment'), 'Manual resuscitator BVM for CPR practice'),
  ('a1000000-0000-0000-0000-000000000018', 'IV Infusion Stand',  (SELECT id FROM categories WHERE name = 'Critical Equipment'), 'Adjustable stainless steel IV pole')
ON CONFLICT (id) DO NOTHING;

-- ─── Equipment Items (physical units) ────────────────────────────────────────
INSERT INTO equipment_items (unique_code, equipment_model_id, compartment_id, status) VALUES
  -- Sphygmomanometers (3 units)
  ('BP-001', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('BP-002', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('BP-003', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'available'),
  -- Stethoscopes (5 units)
  ('ST-001', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('ST-002', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('ST-003', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('ST-004', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('ST-005', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'available'),
  -- Thermometers (3 units)
  ('TH-001', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004', 'available'),
  ('TH-002', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004', 'available'),
  ('TH-003', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004', 'available'),
  -- Penlights (3 units)
  ('PL-001', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 'available'),
  ('PL-002', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 'available'),
  ('PL-003', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 'available'),
  -- Reflex Hammers (2 units)
  ('RH-001', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004', 'available'),
  ('RH-002', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004', 'available'),
  -- Bandage Scissors (3 units)
  ('BS-001', 'a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('BS-002', 'a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('BS-003', 'a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'available'),
  -- Tourniquets (3 units)
  ('TQ-001', 'a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000004', 'available'),
  ('TQ-002', 'a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000004', 'available'),
  ('TQ-003', 'a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000004', 'available'),
  -- Medication Trays (2 units)
  ('MT-001', 'a1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('MT-002', 'a1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000001', 'available'),
  -- Pulse Oximeters (3 units)
  ('PO-001', 'a1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('PO-002', 'a1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('PO-003', 'a1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000002', 'available'),
  -- Otoscopes (2 units)
  ('OT-001', 'a1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('OT-002', 'a1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000002', 'available'),
  -- Vacutainer Sets (2 units)
  ('VS-001', 'a1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000005', 'available'),
  ('VS-002', 'a1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000005', 'available'),
  -- IV Administration Sets (3 units)
  ('IV-001', 'a1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000005', 'available'),
  ('IV-002', 'a1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000005', 'available'),
  ('IV-003', 'a1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000005', 'available'),
  -- Foley Catheter Kits (2 units)
  ('FC-001', 'a1000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000005', 'available'),
  ('FC-002', 'a1000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000005', 'available'),
  -- Nasogastric Tube Sets (2 units)
  ('NG-001', 'a1000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000005', 'available'),
  ('NG-002', 'a1000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000005', 'available'),
  -- Syringe Sets (3 units)
  ('SY-001', 'a1000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000005', 'available'),
  ('SY-002', 'a1000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000005', 'available'),
  ('SY-003', 'a1000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000005', 'available'),
  -- AED Trainers (1 unit)
  ('AED-001', 'a1000000-0000-0000-0000-000000000016', 'b1000000-0000-0000-0000-000000000003', 'available'),
  -- Bag Valve Masks (2 units)
  ('BV-001', 'a1000000-0000-0000-0000-000000000017', 'b1000000-0000-0000-0000-000000000003', 'available'),
  ('BV-002', 'a1000000-0000-0000-0000-000000000017', 'b1000000-0000-0000-0000-000000000003', 'available'),
  -- IV Infusion Stands (2 units)
  ('IS-001', 'a1000000-0000-0000-0000-000000000018', 'b1000000-0000-0000-0000-000000000003', 'available'),
  ('IS-002', 'a1000000-0000-0000-0000-000000000018', 'b1000000-0000-0000-0000-000000000003', 'available')
ON CONFLICT (unique_code) DO NOTHING;

-- ─── Procedure ↔ Equipment Links ──────────────────────────────────────────────
INSERT INTO procedure_equipment (procedure_id, equipment_model_id) VALUES
  -- Basic Vital Signs → BP, Stethoscope, Thermometer, Pulse Oximeter
  ((SELECT id FROM procedures WHERE name = 'Basic Vital Signs'), 'a1000000-0000-0000-0000-000000000001'),
  ((SELECT id FROM procedures WHERE name = 'Basic Vital Signs'), 'a1000000-0000-0000-0000-000000000002'),
  ((SELECT id FROM procedures WHERE name = 'Basic Vital Signs'), 'a1000000-0000-0000-0000-000000000003'),
  ((SELECT id FROM procedures WHERE name = 'Basic Vital Signs'), 'a1000000-0000-0000-0000-000000000009'),
  -- Wound Care → Bandage Scissors, Stethoscope, Tourniquet
  ((SELECT id FROM procedures WHERE name = 'Wound Care'), 'a1000000-0000-0000-0000-000000000006'),
  ((SELECT id FROM procedures WHERE name = 'Wound Care'), 'a1000000-0000-0000-0000-000000000002'),
  ((SELECT id FROM procedures WHERE name = 'Wound Care'), 'a1000000-0000-0000-0000-000000000007'),
  -- Intravenous Therapy → IV Set, Tourniquet, Syringe Set, IV Stand
  ((SELECT id FROM procedures WHERE name = 'Intravenous Therapy'), 'a1000000-0000-0000-0000-000000000012'),
  ((SELECT id FROM procedures WHERE name = 'Intravenous Therapy'), 'a1000000-0000-0000-0000-000000000007'),
  ((SELECT id FROM procedures WHERE name = 'Intravenous Therapy'), 'a1000000-0000-0000-0000-000000000015'),
  ((SELECT id FROM procedures WHERE name = 'Intravenous Therapy'), 'a1000000-0000-0000-0000-000000000018'),
  -- Physical Assessment → Stethoscope, Penlight, Reflex Hammer, Otoscope, BP
  ((SELECT id FROM procedures WHERE name = 'Physical Assessment'), 'a1000000-0000-0000-0000-000000000002'),
  ((SELECT id FROM procedures WHERE name = 'Physical Assessment'), 'a1000000-0000-0000-0000-000000000004'),
  ((SELECT id FROM procedures WHERE name = 'Physical Assessment'), 'a1000000-0000-0000-0000-000000000005'),
  ((SELECT id FROM procedures WHERE name = 'Physical Assessment'), 'a1000000-0000-0000-0000-000000000010'),
  ((SELECT id FROM procedures WHERE name = 'Physical Assessment'), 'a1000000-0000-0000-0000-000000000001'),
  -- Urinary Catheterization → Foley Kit, Syringe Set
  ((SELECT id FROM procedures WHERE name = 'Urinary Catheterization'), 'a1000000-0000-0000-0000-000000000013'),
  ((SELECT id FROM procedures WHERE name = 'Urinary Catheterization'), 'a1000000-0000-0000-0000-000000000015'),
  -- Nasogastric Tube Insertion → NG Tube Set, Syringe Set, Stethoscope
  ((SELECT id FROM procedures WHERE name = 'Nasogastric Tube Insertion'), 'a1000000-0000-0000-0000-000000000014'),
  ((SELECT id FROM procedures WHERE name = 'Nasogastric Tube Insertion'), 'a1000000-0000-0000-0000-000000000015'),
  ((SELECT id FROM procedures WHERE name = 'Nasogastric Tube Insertion'), 'a1000000-0000-0000-0000-000000000002'),
  -- Medication Administration → Medication Tray, Syringe Set
  ((SELECT id FROM procedures WHERE name = 'Medication Administration'), 'a1000000-0000-0000-0000-000000000008'),
  ((SELECT id FROM procedures WHERE name = 'Medication Administration'), 'a1000000-0000-0000-0000-000000000015'),
  -- Blood Extraction → Vacutainer Set, Tourniquet, Syringe Set
  ((SELECT id FROM procedures WHERE name = 'Blood Extraction'), 'a1000000-0000-0000-0000-000000000011'),
  ((SELECT id FROM procedures WHERE name = 'Blood Extraction'), 'a1000000-0000-0000-0000-000000000007'),
  ((SELECT id FROM procedures WHERE name = 'Blood Extraction'), 'a1000000-0000-0000-0000-000000000015'),
  -- Basic Life Support → AED Trainer, BVM
  ((SELECT id FROM procedures WHERE name = 'Basic Life Support'), 'a1000000-0000-0000-0000-000000000016'),
  ((SELECT id FROM procedures WHERE name = 'Basic Life Support'), 'a1000000-0000-0000-0000-000000000017')
ON CONFLICT (procedure_id, equipment_model_id) DO NOTHING;
