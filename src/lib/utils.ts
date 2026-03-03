import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, format, parseISO } from 'date-fns'
import type { ItemStatus, TransactionStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return format(parseISO(date), 'MMM dd, yyyy')
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—'
  return format(parseISO(date), 'MMM dd, yyyy h:mm a')
}

export function calcOverdueDays(expectedReturnDate: string | null): number {
  if (!expectedReturnDate) return 0
  const days = differenceInDays(new Date(), parseISO(expectedReturnDate))
  return days > 0 ? days : 0
}

export function itemStatusLabel(status: ItemStatus): string {
  const map: Record<ItemStatus, string> = {
    available: 'Available',
    borrowed: 'Borrowed',
    damaged: 'Damaged',
    disposed: 'Disposed',
    under_maintenance: 'Under Maintenance',
  }
  return map[status]
}

export function itemStatusColor(status: ItemStatus): string {
  const map: Record<ItemStatus, string> = {
    available: 'bg-green-100 text-green-800',
    borrowed: 'bg-blue-100 text-blue-800',
    damaged: 'bg-orange-100 text-orange-800',
    disposed: 'bg-red-100 text-red-800',
    under_maintenance: 'bg-yellow-100 text-yellow-800',
  }
  return map[status]
}

export function txStatusLabel(status: TransactionStatus): string {
  const map: Record<TransactionStatus, string> = {
    borrowed: 'Borrowed',
    returned: 'Returned',
    overdue: 'Overdue',
  }
  return map[status]
}

export function txStatusColor(status: TransactionStatus): string {
  const map: Record<TransactionStatus, string> = {
    borrowed: 'bg-blue-100 text-blue-800',
    returned: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  }
  return map[status]
}
