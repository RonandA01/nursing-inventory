-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003: Sample data based on actual NCF CHS inventory and procedures
-- Procedures: NGT, Nebulizer Inhalation, Suctioning, CPR, Administration of
--             Oxygen, Changing an IV Infusion, Discontinuing an IV Infusion
-- Run AFTER 001_schema.sql and 002_make_student_id_optional.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Clear existing sample data (respecting FK order) ────────────────────────
DELETE FROM borrow_items;
DELETE FROM borrow_transactions;
DELETE FROM procedure_equipment;
DELETE FROM equipment_items;
DELETE FROM equipment_models;
DELETE FROM compartments;
DELETE FROM procedures WHERE name IN (
  'Basic Vital Signs','Wound Care','Intravenous Therapy','Physical Assessment',
  'Urinary Catheterization','Nasogastric Tube Insertion','Medication Administration',
  'Blood Extraction','Basic Life Support',
  'NGT','Nebulizer Inhalation','Suctioning','CPR',
  'Administration of Oxygen','Changing an IV Infusion','Discontinuing an IV Infusion'
);

-- ─── Procedures ───────────────────────────────────────────────────────────────
INSERT INTO procedures (name, description) VALUES
  ('NGT',                          'Nasogastric tube insertion procedure'),
  ('Nebulizer Inhalation',         'Aerosol medication delivery via nebulizer compressor'),
  ('Suctioning',                   'Airway suctioning to remove secretions'),
  ('CPR',                          'Cardiopulmonary resuscitation emergency procedure'),
  ('Administration of Oxygen',     'Supplemental oxygen delivery to the patient'),
  ('Changing an IV Infusion',      'Replacement of IV fluid bag and tubing'),
  ('Discontinuing an IV Infusion', 'Safe removal of IV catheter and discontinuation of infusion')
ON CONFLICT (name) DO NOTHING;

-- ─── Compartments (actual rooms / storage areas) ──────────────────────────────
INSERT INTO compartments (id, name, category_id) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Central Supply Room (ST304)',        (SELECT id FROM categories WHERE name = 'General Equipment')),
  ('b1000000-0000-0000-0000-000000000002', 'Mini Hospital (ST301)',              (SELECT id FROM categories WHERE name = 'Critical Equipment')),
  ('b1000000-0000-0000-0000-000000000003', 'CHS Simulation Room (ST303)',        (SELECT id FROM categories WHERE name = 'Critical Equipment')),
  ('b1000000-0000-0000-0000-000000000004', 'OR/DR Simulation Room (ST309)',      (SELECT id FROM categories WHERE name = 'Critical Equipment')),
  ('b1000000-0000-0000-0000-000000000005', 'Nursing Proficiency Lab 1 (ST307)',  (SELECT id FROM categories WHERE name = 'Laboratory Equipment')),
  ('b1000000-0000-0000-0000-000000000006', 'Nursing Proficiency Lab 2 (ST308)',  (SELECT id FROM categories WHERE name = 'Laboratory Equipment')),
  ('b1000000-0000-0000-0000-000000000007', 'Anatomy Lab (Room 201)',             (SELECT id FROM categories WHERE name = 'Laboratory Equipment')),
  ('b1000000-0000-0000-0000-000000000008', 'Caregiving Room (5F ST Annex)',      (SELECT id FROM categories WHERE name = 'General Equipment')),
  ('b1000000-0000-0000-0000-000000000009', 'Nursing Storage Room (Room 308)',    (SELECT id FROM categories WHERE name = 'General Equipment'))
ON CONFLICT (id) DO NOTHING;

-- ─── Equipment Models ─────────────────────────────────────────────────────────
INSERT INTO equipment_models (id, name, category_id, description) VALUES

  -- ── General Equipment ──────────────────────────────────────────────────────
  ('a1000000-0000-0000-0000-000000000001', 'Manikin',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Training mannequin for nursing procedure practice'),
  ('a1000000-0000-0000-0000-000000000002', 'Syringe',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Disposable syringe for medication and fluid administration'),
  ('a1000000-0000-0000-0000-000000000003', 'Stethoscope',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Acoustic stethoscope for auscultation'),
  ('a1000000-0000-0000-0000-000000000004', 'Adhesive Tape',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Medical adhesive tape for securing tubes and dressings'),
  ('a1000000-0000-0000-0000-000000000005', 'Kidney Basin',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Kidney-shaped basin for collecting waste and fluids'),
  ('a1000000-0000-0000-0000-000000000006', 'Clean Gloves',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Non-sterile examination gloves'),
  ('a1000000-0000-0000-0000-000000000007', 'Sterile Gloves',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Sterile surgical gloves for aseptic procedures'),
  ('a1000000-0000-0000-0000-000000000008', 'Towel',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Clean towel for patient hygiene and procedure use'),
  ('a1000000-0000-0000-0000-000000000009', 'Medicine Cup',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Small cup for medication preparation and administration'),
  ('a1000000-0000-0000-0000-000000000010', 'Alcohol Swabs',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Pre-moistened isopropyl alcohol swabs for skin disinfection'),
  ('a1000000-0000-0000-0000-000000000011', 'Sterile Gauze Pads',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Sterile 2x2 gauze pads for wound care and IV removal'),
  ('a1000000-0000-0000-0000-000000000012', 'Tourniquet',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Latex-free tourniquet for venipuncture and IV procedures'),
  ('a1000000-0000-0000-0000-000000000013', 'PPE Mask and Eye Protection',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Personal protective equipment: surgical mask and goggles'),
  ('a1000000-0000-0000-0000-000000000014', 'Waste Disposal Bag',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Biohazard waste bag for clinical waste disposal'),
  ('a1000000-0000-0000-0000-000000000015', 'Clamp',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'IV line clamp for controlling fluid flow'),
  ('a1000000-0000-0000-0000-000000000016', 'Sterile Water',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Sterile water container for suctioning procedures'),
  ('a1000000-0000-0000-0000-000000000017', 'Sphygmomanometer',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Aneroid blood pressure apparatus with cuff'),
  ('a1000000-0000-0000-0000-000000000018', 'Clinical Thermometer',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Digital clinical thermometer for temperature measurement'),
  ('a1000000-0000-0000-0000-000000000019', 'Reflex Hammer',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Taylor percussion hammer for neurological assessment'),
  ('a1000000-0000-0000-0000-000000000020', 'CPR Board',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Hard board for CPR chest compressions on soft surfaces'),
  ('a1000000-0000-0000-0000-000000000021', 'Portable Weighing Scale',
    (SELECT id FROM categories WHERE name = 'General Equipment'),
    'Portable scale for patient weight measurement'),

  -- ── Laboratory Equipment ───────────────────────────────────────────────────
  ('a1000000-0000-0000-0000-000000000022', 'Nasogastric Tube',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'Flexible tube passed through the nose into the stomach'),
  ('a1000000-0000-0000-0000-000000000023', 'Nebulizer Machine',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'Compressor-driven nebulizer for aerosol medication delivery'),
  ('a1000000-0000-0000-0000-000000000024', 'Mouthpiece/Face Mask',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'Nebulizer mouthpiece or face mask for aerosol inhalation'),
  ('a1000000-0000-0000-0000-000000000025', 'T-piece (Nebulizer)',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'T-shaped connector for nebulizer assembly'),
  ('a1000000-0000-0000-0000-000000000026', 'Connecting Tubing',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'Flexible tubing for connecting nebulizer/suction components'),
  ('a1000000-0000-0000-0000-000000000027', 'Pulse Oximeter',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'Fingertip pulse oximeter for SpO2 and heart rate monitoring'),
  ('a1000000-0000-0000-0000-000000000028', 'Suction Catheter',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'Sterile catheter for suctioning secretions from airways'),
  ('a1000000-0000-0000-0000-000000000029', 'Flow Meter',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'Oxygen flow meter for regulating oxygen delivery rate'),
  ('a1000000-0000-0000-0000-000000000030', 'Humidifier Bottle',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'Water humidifier bottle attached to oxygen delivery system'),
  ('a1000000-0000-0000-0000-000000000031', 'Oxygen Tubing',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'Flexible tubing connecting oxygen source to patient'),
  ('a1000000-0000-0000-0000-000000000032', 'Nasal Cannula',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'Two-prong nasal cannula for low-flow oxygen delivery'),
  ('a1000000-0000-0000-0000-000000000033', 'Oxygen Face Mask',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'Simple face mask for medium-flow oxygen delivery'),
  ('a1000000-0000-0000-0000-000000000034', 'IV Fluid Bag',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'IV solution bag per doctor''s order'),
  ('a1000000-0000-0000-0000-000000000035', 'IV Tubing',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'IV administration tubing set'),
  ('a1000000-0000-0000-0000-000000000036', 'IV Pole',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'Adjustable stainless steel IV infusion pole'),
  ('a1000000-0000-0000-0000-000000000037', 'Otoscope',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'Diagnostic otoscope for ear and throat examination'),
  ('a1000000-0000-0000-0000-000000000038', 'Glucometer',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'Blood glucose monitoring device'),
  ('a1000000-0000-0000-0000-000000000039', 'Fetal Doppler',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'Handheld Doppler device for fetal heart rate monitoring'),
  ('a1000000-0000-0000-0000-000000000040', 'Infant Weighing Scale',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'Scale for weighing newborns and infants'),
  ('a1000000-0000-0000-0000-000000000041', 'Microscope',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'LCD digital or compound microscope for specimen examination'),
  ('a1000000-0000-0000-0000-000000000042', 'IV Arm Simulator',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'Training arm for IV insertion and venipuncture practice'),
  ('a1000000-0000-0000-0000-000000000043', 'Vaporizer/Steam Inhaler',
    (SELECT id FROM categories WHERE name = 'Laboratory Equipment'),
    'Electric vaporizer for steam inhalation therapy'),

  -- ── Critical Equipment ─────────────────────────────────────────────────────
  ('a1000000-0000-0000-0000-000000000044', 'Suction Machine',
    (SELECT id FROM categories WHERE name = 'Critical Equipment'),
    'Electric suction machine for airway secretion removal'),
  ('a1000000-0000-0000-0000-000000000045', 'Ambu Bag',
    (SELECT id FROM categories WHERE name = 'Critical Equipment'),
    'Bag valve mask (BVM) for manual ventilation during CPR'),
  ('a1000000-0000-0000-0000-000000000046', 'Oxygen Tank',
    (SELECT id FROM categories WHERE name = 'Critical Equipment'),
    'Pressurized oxygen tank with regulator'),
  ('a1000000-0000-0000-0000-000000000047', 'Infusion Pump',
    (SELECT id FROM categories WHERE name = 'Critical Equipment'),
    'Electronic infusion pump for controlled IV fluid delivery'),
  ('a1000000-0000-0000-0000-000000000048', 'AED Trainer',
    (SELECT id FROM categories WHERE name = 'Critical Equipment'),
    'Automated External Defibrillator trainer unit'),
  ('a1000000-0000-0000-0000-000000000049', 'ECG Machine',
    (SELECT id FROM categories WHERE name = 'Critical Equipment'),
    '12-lead electrocardiogram machine'),
  ('a1000000-0000-0000-0000-000000000050', 'Cardiac Monitor',
    (SELECT id FROM categories WHERE name = 'Critical Equipment'),
    'Bedside cardiac monitor for continuous vital signs monitoring'),
  ('a1000000-0000-0000-0000-000000000051', 'Hospital Bed',
    (SELECT id FROM categories WHERE name = 'Critical Equipment'),
    'Adjustable hospital bed with mattress and side rails'),
  ('a1000000-0000-0000-0000-000000000052', 'Wheelchair',
    (SELECT id FROM categories WHERE name = 'Critical Equipment'),
    'Standard manual wheelchair for patient transport'),
  ('a1000000-0000-0000-0000-000000000053', 'Emergency Cart',
    (SELECT id FROM categories WHERE name = 'Critical Equipment'),
    'Emergency/crash cart with essential resuscitation supplies'),
  ('a1000000-0000-0000-0000-000000000054', 'Stretcher',
    (SELECT id FROM categories WHERE name = 'Critical Equipment'),
    'Stainless steel stretcher/gurney for patient transport')

ON CONFLICT (id) DO NOTHING;

-- ─── Equipment Items (physical units) ────────────────────────────────────────
INSERT INTO equipment_items (unique_code, equipment_model_id, compartment_id, status) VALUES

  -- Manikin (2 units) → Central Supply Room
  ('MAN-001', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('MAN-002', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Syringe (5 units) → Central Supply Room
  ('SYR-001', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('SYR-002', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('SYR-003', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('SYR-004', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('SYR-005', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Stethoscope (5 units) → Central Supply Room
  ('STH-001', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('STH-002', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('STH-003', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('STH-004', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('STH-005', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Adhesive Tape (3 units) → Central Supply Room
  ('TAP-001', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('TAP-002', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('TAP-003', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Kidney Basin (5 units) → Central Supply Room
  ('KDB-001', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('KDB-002', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('KDB-003', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('KDB-004', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('KDB-005', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Clean Gloves (3 boxes) → Central Supply Room
  ('GLV-001', 'a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('GLV-002', 'a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('GLV-003', 'a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Sterile Gloves (3 units) → Central Supply Room
  ('SGL-001', 'a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('SGL-002', 'a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('SGL-003', 'a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Towel (3 units) → Central Supply Room
  ('TWL-001', 'a1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('TWL-002', 'a1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('TWL-003', 'a1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Medicine Cup (3 units) → Central Supply Room
  ('MCP-001', 'a1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('MCP-002', 'a1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('MCP-003', 'a1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Alcohol Swabs (3 units) → Central Supply Room
  ('ALC-001', 'a1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('ALC-002', 'a1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('ALC-003', 'a1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Sterile Gauze Pads (3 units) → Central Supply Room
  ('GZP-001', 'a1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('GZP-002', 'a1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('GZP-003', 'a1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Tourniquet (3 units) → Central Supply Room
  ('TRQ-001', 'a1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('TRQ-002', 'a1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('TRQ-003', 'a1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- PPE Mask and Eye Protection (3 units) → Central Supply Room
  ('PPE-001', 'a1000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('PPE-002', 'a1000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('PPE-003', 'a1000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Waste Disposal Bag (3 units) → Central Supply Room
  ('WDB-001', 'a1000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('WDB-002', 'a1000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('WDB-003', 'a1000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Clamp (3 units) → Central Supply Room
  ('CLP-001', 'a1000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('CLP-002', 'a1000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('CLP-003', 'a1000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Sterile Water (3 units) → Central Supply Room
  ('STW-001', 'a1000000-0000-0000-0000-000000000016', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('STW-002', 'a1000000-0000-0000-0000-000000000016', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('STW-003', 'a1000000-0000-0000-0000-000000000016', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Sphygmomanometer (4 units) → Central Supply Room
  ('SBP-001', 'a1000000-0000-0000-0000-000000000017', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('SBP-002', 'a1000000-0000-0000-0000-000000000017', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('SBP-003', 'a1000000-0000-0000-0000-000000000017', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('SBP-004', 'a1000000-0000-0000-0000-000000000017', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Clinical Thermometer (3 units) → Central Supply Room
  ('THM-001', 'a1000000-0000-0000-0000-000000000018', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('THM-002', 'a1000000-0000-0000-0000-000000000018', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('THM-003', 'a1000000-0000-0000-0000-000000000018', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Reflex Hammer (2 units) → Central Supply Room
  ('RFH-001', 'a1000000-0000-0000-0000-000000000019', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('RFH-002', 'a1000000-0000-0000-0000-000000000019', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- CPR Board (2 units) → Central Supply Room
  ('CPB-001', 'a1000000-0000-0000-0000-000000000020', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('CPB-002', 'a1000000-0000-0000-0000-000000000020', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Portable Weighing Scale (1 unit) → Central Supply Room
  ('PWS-001', 'a1000000-0000-0000-0000-000000000021', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Nasogastric Tube (3 units) → Central Supply Room
  ('NGT-001', 'a1000000-0000-0000-0000-000000000022', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('NGT-002', 'a1000000-0000-0000-0000-000000000022', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('NGT-003', 'a1000000-0000-0000-0000-000000000022', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Nebulizer Machine (2 units) → Nursing Proficiency Lab 1
  ('NBL-001', 'a1000000-0000-0000-0000-000000000023', 'b1000000-0000-0000-0000-000000000005', 'available'),
  ('NBL-002', 'a1000000-0000-0000-0000-000000000023', 'b1000000-0000-0000-0000-000000000005', 'available'),

  -- Mouthpiece/Face Mask (3 units) → Central Supply Room
  ('MFM-001', 'a1000000-0000-0000-0000-000000000024', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('MFM-002', 'a1000000-0000-0000-0000-000000000024', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('MFM-003', 'a1000000-0000-0000-0000-000000000024', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- T-piece Nebulizer (3 units) → Central Supply Room
  ('TPB-001', 'a1000000-0000-0000-0000-000000000025', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('TPB-002', 'a1000000-0000-0000-0000-000000000025', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('TPB-003', 'a1000000-0000-0000-0000-000000000025', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Connecting Tubing (3 units) → Central Supply Room
  ('CTB-001', 'a1000000-0000-0000-0000-000000000026', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('CTB-002', 'a1000000-0000-0000-0000-000000000026', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('CTB-003', 'a1000000-0000-0000-0000-000000000026', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Pulse Oximeter (3 units) → Central Supply Room
  ('POX-001', 'a1000000-0000-0000-0000-000000000027', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('POX-002', 'a1000000-0000-0000-0000-000000000027', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('POX-003', 'a1000000-0000-0000-0000-000000000027', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Suction Catheter (3 units) → Central Supply Room
  ('SCT-001', 'a1000000-0000-0000-0000-000000000028', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('SCT-002', 'a1000000-0000-0000-0000-000000000028', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('SCT-003', 'a1000000-0000-0000-0000-000000000028', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Flow Meter (2 units) → Mini Hospital
  ('FLM-001', 'a1000000-0000-0000-0000-000000000029', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('FLM-002', 'a1000000-0000-0000-0000-000000000029', 'b1000000-0000-0000-0000-000000000002', 'available'),

  -- Humidifier Bottle (2 units) → Mini Hospital
  ('HMB-001', 'a1000000-0000-0000-0000-000000000030', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('HMB-002', 'a1000000-0000-0000-0000-000000000030', 'b1000000-0000-0000-0000-000000000002', 'available'),

  -- Oxygen Tubing (3 units) → Mini Hospital
  ('OTB-001', 'a1000000-0000-0000-0000-000000000031', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('OTB-002', 'a1000000-0000-0000-0000-000000000031', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('OTB-003', 'a1000000-0000-0000-0000-000000000031', 'b1000000-0000-0000-0000-000000000002', 'available'),

  -- Nasal Cannula (3 units) → Central Supply Room
  ('NSC-001', 'a1000000-0000-0000-0000-000000000032', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('NSC-002', 'a1000000-0000-0000-0000-000000000032', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('NSC-003', 'a1000000-0000-0000-0000-000000000032', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Oxygen Face Mask (3 units) → Central Supply Room
  ('OFM-001', 'a1000000-0000-0000-0000-000000000033', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('OFM-002', 'a1000000-0000-0000-0000-000000000033', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('OFM-003', 'a1000000-0000-0000-0000-000000000033', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- IV Fluid Bag (3 units) → Central Supply Room
  ('IVF-001', 'a1000000-0000-0000-0000-000000000034', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('IVF-002', 'a1000000-0000-0000-0000-000000000034', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('IVF-003', 'a1000000-0000-0000-0000-000000000034', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- IV Tubing (3 units) → Central Supply Room
  ('IVT-001', 'a1000000-0000-0000-0000-000000000035', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('IVT-002', 'a1000000-0000-0000-0000-000000000035', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('IVT-003', 'a1000000-0000-0000-0000-000000000035', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- IV Pole (3 units) → Mini Hospital
  ('IVP-001', 'a1000000-0000-0000-0000-000000000036', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('IVP-002', 'a1000000-0000-0000-0000-000000000036', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('IVP-003', 'a1000000-0000-0000-0000-000000000036', 'b1000000-0000-0000-0000-000000000002', 'available'),

  -- Otoscope (2 units) → Central Supply Room
  ('OTS-001', 'a1000000-0000-0000-0000-000000000037', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('OTS-002', 'a1000000-0000-0000-0000-000000000037', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Glucometer (2 units) → Central Supply Room
  ('GLC-001', 'a1000000-0000-0000-0000-000000000038', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('GLC-002', 'a1000000-0000-0000-0000-000000000038', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Fetal Doppler (2 units) → Central Supply Room
  ('FTD-001', 'a1000000-0000-0000-0000-000000000039', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('FTD-002', 'a1000000-0000-0000-0000-000000000039', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Infant Weighing Scale (2 units) → Central Supply Room
  ('IWS-001', 'a1000000-0000-0000-0000-000000000040', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('IWS-002', 'a1000000-0000-0000-0000-000000000040', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Microscope (5 units) → Anatomy Lab
  ('MCS-001', 'a1000000-0000-0000-0000-000000000041', 'b1000000-0000-0000-0000-000000000007', 'available'),
  ('MCS-002', 'a1000000-0000-0000-0000-000000000041', 'b1000000-0000-0000-0000-000000000007', 'available'),
  ('MCS-003', 'a1000000-0000-0000-0000-000000000041', 'b1000000-0000-0000-0000-000000000007', 'available'),
  ('MCS-004', 'a1000000-0000-0000-0000-000000000041', 'b1000000-0000-0000-0000-000000000007', 'available'),
  ('MCS-005', 'a1000000-0000-0000-0000-000000000041', 'b1000000-0000-0000-0000-000000000007', 'available'),

  -- IV Arm Simulator (5 units) → Nursing Proficiency Lab 1
  ('IVA-001', 'a1000000-0000-0000-0000-000000000042', 'b1000000-0000-0000-0000-000000000005', 'available'),
  ('IVA-002', 'a1000000-0000-0000-0000-000000000042', 'b1000000-0000-0000-0000-000000000005', 'available'),
  ('IVA-003', 'a1000000-0000-0000-0000-000000000042', 'b1000000-0000-0000-0000-000000000005', 'available'),
  ('IVA-004', 'a1000000-0000-0000-0000-000000000042', 'b1000000-0000-0000-0000-000000000005', 'available'),
  ('IVA-005', 'a1000000-0000-0000-0000-000000000042', 'b1000000-0000-0000-0000-000000000005', 'available'),

  -- Vaporizer/Steam Inhaler (2 units) → Central Supply Room
  ('VAP-001', 'a1000000-0000-0000-0000-000000000043', 'b1000000-0000-0000-0000-000000000001', 'available'),
  ('VAP-002', 'a1000000-0000-0000-0000-000000000043', 'b1000000-0000-0000-0000-000000000001', 'available'),

  -- Suction Machine (2 units) → Mini Hospital
  ('SCM-001', 'a1000000-0000-0000-0000-000000000044', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('SCM-002', 'a1000000-0000-0000-0000-000000000044', 'b1000000-0000-0000-0000-000000000002', 'available'),

  -- Ambu Bag (3 units) → Mini Hospital
  ('AMB-001', 'a1000000-0000-0000-0000-000000000045', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('AMB-002', 'a1000000-0000-0000-0000-000000000045', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('AMB-003', 'a1000000-0000-0000-0000-000000000045', 'b1000000-0000-0000-0000-000000000002', 'available'),

  -- Oxygen Tank (2 units) → Mini Hospital
  ('OXT-001', 'a1000000-0000-0000-0000-000000000046', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('OXT-002', 'a1000000-0000-0000-0000-000000000046', 'b1000000-0000-0000-0000-000000000002', 'available'),

  -- Infusion Pump (1 unit) → CHS Simulation Room
  ('INP-001', 'a1000000-0000-0000-0000-000000000047', 'b1000000-0000-0000-0000-000000000003', 'available'),

  -- AED Trainer (1 unit) → CHS Simulation Room
  ('AED-001', 'a1000000-0000-0000-0000-000000000048', 'b1000000-0000-0000-0000-000000000003', 'available'),

  -- ECG Machine (2 units) → CHS Simulation Room
  ('ECG-001', 'a1000000-0000-0000-0000-000000000049', 'b1000000-0000-0000-0000-000000000003', 'available'),
  ('ECG-002', 'a1000000-0000-0000-0000-000000000049', 'b1000000-0000-0000-0000-000000000003', 'available'),

  -- Cardiac Monitor (1 unit) → CHS Simulation Room
  ('CDM-001', 'a1000000-0000-0000-0000-000000000050', 'b1000000-0000-0000-0000-000000000003', 'available'),

  -- Hospital Bed (5 units) → Mini Hospital
  ('HSB-001', 'a1000000-0000-0000-0000-000000000051', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('HSB-002', 'a1000000-0000-0000-0000-000000000051', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('HSB-003', 'a1000000-0000-0000-0000-000000000051', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('HSB-004', 'a1000000-0000-0000-0000-000000000051', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('HSB-005', 'a1000000-0000-0000-0000-000000000051', 'b1000000-0000-0000-0000-000000000002', 'available'),

  -- Wheelchair (2 units) → Mini Hospital
  ('WCH-001', 'a1000000-0000-0000-0000-000000000052', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('WCH-002', 'a1000000-0000-0000-0000-000000000052', 'b1000000-0000-0000-0000-000000000002', 'available'),

  -- Emergency Cart (2 units) → CHS Simulation Room
  ('EMC-001', 'a1000000-0000-0000-0000-000000000053', 'b1000000-0000-0000-0000-000000000003', 'available'),
  ('EMC-002', 'a1000000-0000-0000-0000-000000000053', 'b1000000-0000-0000-0000-000000000003', 'available'),

  -- Stretcher (2 units) → Mini Hospital
  ('STR-001', 'a1000000-0000-0000-0000-000000000054', 'b1000000-0000-0000-0000-000000000002', 'available'),
  ('STR-002', 'a1000000-0000-0000-0000-000000000054', 'b1000000-0000-0000-0000-000000000002', 'available')

ON CONFLICT (unique_code) DO NOTHING;

-- ─── Procedure ↔ Equipment Links ──────────────────────────────────────────────
INSERT INTO procedure_equipment (procedure_id, equipment_model_id) VALUES

  -- NGT → Manikin, Nasogastric Tube, Syringe, Stethoscope, Adhesive Tape,
  --        Kidney Basin, Clean Gloves, Towel, Medicine Cup
  ((SELECT id FROM procedures WHERE name = 'NGT'), 'a1000000-0000-0000-0000-000000000001'),
  ((SELECT id FROM procedures WHERE name = 'NGT'), 'a1000000-0000-0000-0000-000000000022'),
  ((SELECT id FROM procedures WHERE name = 'NGT'), 'a1000000-0000-0000-0000-000000000002'),
  ((SELECT id FROM procedures WHERE name = 'NGT'), 'a1000000-0000-0000-0000-000000000003'),
  ((SELECT id FROM procedures WHERE name = 'NGT'), 'a1000000-0000-0000-0000-000000000004'),
  ((SELECT id FROM procedures WHERE name = 'NGT'), 'a1000000-0000-0000-0000-000000000005'),
  ((SELECT id FROM procedures WHERE name = 'NGT'), 'a1000000-0000-0000-0000-000000000006'),
  ((SELECT id FROM procedures WHERE name = 'NGT'), 'a1000000-0000-0000-0000-000000000008'),
  ((SELECT id FROM procedures WHERE name = 'NGT'), 'a1000000-0000-0000-0000-000000000009'),

  -- Nebulizer Inhalation → Nebulizer Machine, Medicine Cup, Mouthpiece/Face Mask,
  --   T-piece, Connecting Tubing, Syringe, Alcohol Swabs, Clean Gloves, Towel,
  --   Kidney Basin, Pulse Oximeter, Stethoscope, Waste Disposal Bag
  ((SELECT id FROM procedures WHERE name = 'Nebulizer Inhalation'), 'a1000000-0000-0000-0000-000000000023'),
  ((SELECT id FROM procedures WHERE name = 'Nebulizer Inhalation'), 'a1000000-0000-0000-0000-000000000009'),
  ((SELECT id FROM procedures WHERE name = 'Nebulizer Inhalation'), 'a1000000-0000-0000-0000-000000000024'),
  ((SELECT id FROM procedures WHERE name = 'Nebulizer Inhalation'), 'a1000000-0000-0000-0000-000000000025'),
  ((SELECT id FROM procedures WHERE name = 'Nebulizer Inhalation'), 'a1000000-0000-0000-0000-000000000026'),
  ((SELECT id FROM procedures WHERE name = 'Nebulizer Inhalation'), 'a1000000-0000-0000-0000-000000000002'),
  ((SELECT id FROM procedures WHERE name = 'Nebulizer Inhalation'), 'a1000000-0000-0000-0000-000000000010'),
  ((SELECT id FROM procedures WHERE name = 'Nebulizer Inhalation'), 'a1000000-0000-0000-0000-000000000006'),
  ((SELECT id FROM procedures WHERE name = 'Nebulizer Inhalation'), 'a1000000-0000-0000-0000-000000000008'),
  ((SELECT id FROM procedures WHERE name = 'Nebulizer Inhalation'), 'a1000000-0000-0000-0000-000000000005'),
  ((SELECT id FROM procedures WHERE name = 'Nebulizer Inhalation'), 'a1000000-0000-0000-0000-000000000027'),
  ((SELECT id FROM procedures WHERE name = 'Nebulizer Inhalation'), 'a1000000-0000-0000-0000-000000000003'),
  ((SELECT id FROM procedures WHERE name = 'Nebulizer Inhalation'), 'a1000000-0000-0000-0000-000000000014'),

  -- Suctioning → Suction Machine, Suction Catheter, Connecting Tubing,
  --   Sterile Gloves, Clean Gloves, Sterile Water, Kidney Basin,
  --   PPE Mask and Eye Protection, Oxygen Tank, Ambu Bag
  ((SELECT id FROM procedures WHERE name = 'Suctioning'), 'a1000000-0000-0000-0000-000000000044'),
  ((SELECT id FROM procedures WHERE name = 'Suctioning'), 'a1000000-0000-0000-0000-000000000028'),
  ((SELECT id FROM procedures WHERE name = 'Suctioning'), 'a1000000-0000-0000-0000-000000000026'),
  ((SELECT id FROM procedures WHERE name = 'Suctioning'), 'a1000000-0000-0000-0000-000000000007'),
  ((SELECT id FROM procedures WHERE name = 'Suctioning'), 'a1000000-0000-0000-0000-000000000006'),
  ((SELECT id FROM procedures WHERE name = 'Suctioning'), 'a1000000-0000-0000-0000-000000000016'),
  ((SELECT id FROM procedures WHERE name = 'Suctioning'), 'a1000000-0000-0000-0000-000000000005'),
  ((SELECT id FROM procedures WHERE name = 'Suctioning'), 'a1000000-0000-0000-0000-000000000013'),
  ((SELECT id FROM procedures WHERE name = 'Suctioning'), 'a1000000-0000-0000-0000-000000000046'),
  ((SELECT id FROM procedures WHERE name = 'Suctioning'), 'a1000000-0000-0000-0000-000000000045'),

  -- CPR → Gloves, Face Mask
  ((SELECT id FROM procedures WHERE name = 'CPR'), 'a1000000-0000-0000-0000-000000000006'),
  ((SELECT id FROM procedures WHERE name = 'CPR'), 'a1000000-0000-0000-0000-000000000024'),

  -- Administration of Oxygen → Oxygen Tank, Flow Meter, Humidifier Bottle,
  --   Oxygen Tubing, Nasal Cannula, Oxygen Face Mask
  ((SELECT id FROM procedures WHERE name = 'Administration of Oxygen'), 'a1000000-0000-0000-0000-000000000046'),
  ((SELECT id FROM procedures WHERE name = 'Administration of Oxygen'), 'a1000000-0000-0000-0000-000000000029'),
  ((SELECT id FROM procedures WHERE name = 'Administration of Oxygen'), 'a1000000-0000-0000-0000-000000000030'),
  ((SELECT id FROM procedures WHERE name = 'Administration of Oxygen'), 'a1000000-0000-0000-0000-000000000031'),
  ((SELECT id FROM procedures WHERE name = 'Administration of Oxygen'), 'a1000000-0000-0000-0000-000000000032'),
  ((SELECT id FROM procedures WHERE name = 'Administration of Oxygen'), 'a1000000-0000-0000-0000-000000000033'),

  -- Changing an IV Infusion → IV Fluid Bag, IV Tubing, Alcohol Swabs, Clean Gloves,
  --   IV Pole, Infusion Pump, Kidney Basin, Clamp
  ((SELECT id FROM procedures WHERE name = 'Changing an IV Infusion'), 'a1000000-0000-0000-0000-000000000034'),
  ((SELECT id FROM procedures WHERE name = 'Changing an IV Infusion'), 'a1000000-0000-0000-0000-000000000035'),
  ((SELECT id FROM procedures WHERE name = 'Changing an IV Infusion'), 'a1000000-0000-0000-0000-000000000010'),
  ((SELECT id FROM procedures WHERE name = 'Changing an IV Infusion'), 'a1000000-0000-0000-0000-000000000006'),
  ((SELECT id FROM procedures WHERE name = 'Changing an IV Infusion'), 'a1000000-0000-0000-0000-000000000036'),
  ((SELECT id FROM procedures WHERE name = 'Changing an IV Infusion'), 'a1000000-0000-0000-0000-000000000047'),
  ((SELECT id FROM procedures WHERE name = 'Changing an IV Infusion'), 'a1000000-0000-0000-0000-000000000005'),
  ((SELECT id FROM procedures WHERE name = 'Changing an IV Infusion'), 'a1000000-0000-0000-0000-000000000015'),

  -- Discontinuing an IV Infusion → Clean Gloves, Sterile Gauze Pads, Adhesive Tape,
  --   Alcohol Swabs, Kidney Basin, Waste Disposal Bag, Tourniquet
  ((SELECT id FROM procedures WHERE name = 'Discontinuing an IV Infusion'), 'a1000000-0000-0000-0000-000000000006'),
  ((SELECT id FROM procedures WHERE name = 'Discontinuing an IV Infusion'), 'a1000000-0000-0000-0000-000000000011'),
  ((SELECT id FROM procedures WHERE name = 'Discontinuing an IV Infusion'), 'a1000000-0000-0000-0000-000000000004'),
  ((SELECT id FROM procedures WHERE name = 'Discontinuing an IV Infusion'), 'a1000000-0000-0000-0000-000000000010'),
  ((SELECT id FROM procedures WHERE name = 'Discontinuing an IV Infusion'), 'a1000000-0000-0000-0000-000000000005'),
  ((SELECT id FROM procedures WHERE name = 'Discontinuing an IV Infusion'), 'a1000000-0000-0000-0000-000000000014'),
  ((SELECT id FROM procedures WHERE name = 'Discontinuing an IV Infusion'), 'a1000000-0000-0000-0000-000000000012')

ON CONFLICT (procedure_id, equipment_model_id) DO NOTHING;
