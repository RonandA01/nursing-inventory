import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate, formatDateTime } from './utils'
import type { BorrowTransaction, EquipmentItem } from '@/types'

// ─── Excel Export ──────────────────────────────────────────────────────────
export function exportTransactionsToExcel(transactions: BorrowTransaction[], filename = 'borrow-transactions') {
  const rows = transactions.map((t) => ({
    'Transaction ID': t.id.substring(0, 8),
    'Student ID': t.borrower?.student_id ?? '',
    'Student Name': t.borrower?.student_name ?? '',
    Department: t.borrower?.college_department ?? '',
    Instructor: t.borrower?.instructor_name ?? '',
    Subject: t.borrower?.subject ?? '',
    Procedure: t.procedure?.name ?? '',
    'Date Borrowed': formatDateTime(t.date_borrowed),
    'Expected Return': formatDate(t.expected_return_date),
    'Date Returned': formatDate(t.date_returned),
    Status: t.status.toUpperCase(),
    'Days Overdue': t.days_overdue ?? 0,
    Remarks: t.remarks ?? '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportInventoryToExcel(items: EquipmentItem[], filename = 'inventory') {
  const rows = items.map((item) => ({
    'Unique Code': item.unique_code,
    'Item Name': item.equipment_model?.name ?? '',
    Category: item.equipment_model?.category?.name ?? '',
    Compartment: item.compartment?.name ?? '',
    Status: item.status.toUpperCase(),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// ─── PDF Export ────────────────────────────────────────────────────────────
export function exportTransactionsToPDF(transactions: BorrowTransaction[], title = 'Borrow Transactions Report') {
  const doc = new jsPDF({ orientation: 'landscape' })

  doc.setFontSize(16)
  doc.setTextColor(21, 128, 61)
  doc.text(title, 14, 16)

  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Generated: ${formatDateTime(new Date().toISOString())}`, 14, 22)

  autoTable(doc, {
    startY: 28,
    head: [['Student ID', 'Name', 'Department', 'Procedure', 'Borrowed', 'Expected Return', 'Returned', 'Status', 'Days Overdue']],
    body: transactions.map((t) => [
      t.borrower?.student_id ?? '',
      t.borrower?.student_name ?? '',
      t.borrower?.college_department ?? '',
      t.procedure?.name ?? '',
      formatDateTime(t.date_borrowed),
      formatDate(t.expected_return_date),
      formatDate(t.date_returned),
      t.status.toUpperCase(),
      t.days_overdue ?? 0,
    ]),
    headStyles: { fillColor: [21, 128, 61] },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    styles: { fontSize: 7 },
  })

  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`)
}

export function exportInventoryToPDF(items: EquipmentItem[], title = 'Inventory Report') {
  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.setTextColor(21, 128, 61)
  doc.text(title, 14, 16)

  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Generated: ${formatDateTime(new Date().toISOString())}`, 14, 22)

  autoTable(doc, {
    startY: 28,
    head: [['Unique Code', 'Item Name', 'Category', 'Compartment', 'Status']],
    body: items.map((item) => [
      item.unique_code,
      item.equipment_model?.name ?? '',
      item.equipment_model?.category?.name ?? '',
      item.compartment?.name ?? '',
      item.status.toUpperCase(),
    ]),
    headStyles: { fillColor: [21, 128, 61] },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    styles: { fontSize: 8 },
  })

  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`)
}
