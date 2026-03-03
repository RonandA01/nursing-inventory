import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { formatDate, formatDateTime, txStatusColor, txStatusLabel, calcOverdueDays } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { BorrowTransaction } from '@/types'

export function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('borrow_transactions')
        .select('*, borrower:borrowers(*), procedure:procedures(*)')
        .order('date_borrowed', { ascending: false })
      return ((data ?? []) as BorrowTransaction[]).map((tx) => ({
        ...tx,
        days_overdue: calcOverdueDays(tx.expected_return_date),
      }))
    },
  })

  const filtered = transactions.filter((tx) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      tx.borrower?.student_name?.toLowerCase().includes(q) ||
      tx.borrower?.student_id?.toLowerCase().includes(q) ||
      tx.procedure?.name?.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || tx.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-muted-foreground text-sm mt-1">All borrow and return records</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or procedure..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="borrowed">Borrowed</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Procedure</TableHead>
                  <TableHead>Date Borrowed</TableHead>
                  <TableHead>Expected Return</TableHead>
                  <TableHead>Date Returned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Days Overdue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium text-sm">
                      {tx.borrower?.student_name}
                      <br /><span className="text-xs text-muted-foreground">{tx.borrower?.student_id}</span>
                    </TableCell>
                    <TableCell className="text-sm">{tx.borrower?.college_department}</TableCell>
                    <TableCell className="text-sm">{tx.procedure?.name}</TableCell>
                    <TableCell className="text-sm">{formatDateTime(tx.date_borrowed)}</TableCell>
                    <TableCell className="text-sm">{formatDate(tx.expected_return_date)}</TableCell>
                    <TableCell className="text-sm">{formatDate(tx.date_returned)}</TableCell>
                    <TableCell>
                      <span className={cn('text-xs px-2 py-1 rounded-full font-medium', txStatusColor(tx.status))}>
                        {txStatusLabel(tx.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {tx.days_overdue > 0 ? (
                        <span className="text-xs font-bold text-red-600">{tx.days_overdue}d</span>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-10">No transactions found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
