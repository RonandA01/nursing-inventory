// ─── Database Enums ────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'staff'
export type ItemStatus = 'available' | 'borrowed' | 'damaged' | 'disposed' | 'under_maintenance'
export type TransactionStatus = 'borrowed' | 'returned' | 'overdue'
export type ReturnCondition = 'good' | 'damaged' | 'missing_parts' | 'disposed'

// ─── Database Row Types ────────────────────────────────────────────────────
export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
}

export interface Department {
  id: string
  name: string
  created_at: string
}

export interface Procedure {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  color_shade: string
  description: string | null
  created_at: string
}

export interface Compartment {
  id: string
  name: string
  category_id: string
  category?: Category
  created_at: string
}

export interface Borrower {
  id: string
  student_id?: string | null
  student_name: string
  college_department: string
  instructor_name: string
  subject: string
  group_number: string | null
  class_schedule: string
  created_at: string
  updated_at: string
}

export interface EquipmentModel {
  id: string
  name: string
  category_id: string
  description: string | null
  category?: Category
  created_at: string
  // computed
  available_count?: number
  total_count?: number
}

export interface ProcedureEquipment {
  procedure_id: string
  equipment_model_id: string
  equipment_model?: EquipmentModel
}

export interface EquipmentItem {
  id: string
  unique_code: string
  equipment_model_id: string
  compartment_id: string | null
  status: ItemStatus
  equipment_model?: EquipmentModel
  compartment?: Compartment
  created_at: string
}

export interface BorrowTransaction {
  id: string
  borrower_id: string
  procedure_id: string
  date_borrowed: string
  expected_return_date: string | null
  date_returned: string | null
  status: TransactionStatus
  created_by: string | null
  remarks: string | null
  created_at: string
  // joined
  borrower?: Borrower
  procedure?: Procedure
  borrow_items?: BorrowItem[]
  days_overdue?: number
}

export interface BorrowItem {
  id: string
  transaction_id: string
  equipment_item_id: string
  condition_on_return: ReturnCondition | null
  remarks: string | null
  equipment_item?: EquipmentItem
}

export interface SystemConfig {
  key: string
  value: string
  updated_at: string
  updated_by: string | null
}

// ─── Form Types ────────────────────────────────────────────────────────────
export interface BorrowFormData {
  student_name: string
  college_department: string
  instructor_name: string
  subject: string
  group_number: string
  class_schedule: string
  procedure_id: string
  expected_return_date: string
  selected_item_ids: string[]
  staff_override?: boolean
}

export interface ReturnFormData {
  transaction_id: string
  items: {
    borrow_item_id: string
    equipment_item_id: string
    condition: ReturnCondition
    remarks: string
  }[]
}

// ─── Dashboard Types ───────────────────────────────────────────────────────
export interface DashboardMetrics {
  active_borrowed: number
  returned_today: number
  overdue: number
  not_yet_returned: number
  avg_borrow_duration_days: number
  available_items: number
  damaged_items: number
  disposed_items: number
  under_maintenance_items: number
}
