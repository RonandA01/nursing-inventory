import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileBarChart, FileSpreadsheet, FileText, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { formatDate, formatDateTime, txStatusLabel, txStatusColor, itemStatusLabel, itemStatusColor, calcOverdueDays } from '@/lib/utils'
import { exportTransactionsToExcel, exportTransactionsToPDF, exportInventoryToExcel, exportInventoryToPDF } from '@/lib/export'
import { cn } from '@/lib/utils'
import type { BorrowTransaction, EquipmentItem } from '@/types'

type ReportType = 'transactions' | 'inventory' | 'overdue' | 'damaged'

export function ReportsPage() {
  const { toast } = useToast()
  const [reportType, setReportType] = useState<ReportType>('transactions')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ['report-transactions', dateFrom, dateTo],
    queryFn: async () => {
      let q = supabase
        .from('borrow_transactions')
        .select('*, borrower:borrowers(*), procedure:procedures(*)')
        .order('date_borrowed', { ascending: false })
      if (dateFrom) q = q.gte('date_borrowed', `${dateFrom}T00:00:00`)
      if (dateTo) q = q.lte('date_borrowed', `${dateTo}T23:59:59`)
      const { data } = await q
      return ((data ?? []) as BorrowTransaction[]).map((tx) => ({
        ...tx,
        days_overdue: calcOverdueDays(tx.expected_return_date),
      }))
    },
  })

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['report-inventory'],
    queryFn: async () => {
      const { data } = await supabase
        .from('equipment_items')
        .select('*, equipment_model:equipment_models(*, category:categories(*)), compartment:compartments(*)')
        .order('unique_code')
      return (data ?? []) as EquipmentItem[]
    },
  })

  const displayTransactions = reportType === 'overdue'
    ? transactions.filter((t) => t.days_overdue > 0)
    : reportType === 'transactions'
    ? transactions
    : []

  const displayItems = reportType === 'inventory'
    ? items
    : reportType === 'damaged'
    ? items.filter((i) => i.status === 'damaged' || i.status === 'disposed')
    : []

  const isTransactionReport = reportType === 'transactions' || reportType === 'overdue'
  const isLoading = isTransactionReport ? loadingTx : loadingItems

  function handleExcel() {
    if (isTransactionReport) {
      exportTransactionsToExcel(displayTransactions, reportType)
      toast({ title: 'Excel file downloaded' })
    } else {
      exportInventoryToExcel(displayItems, reportType)
      toast({ title: 'Excel file downloaded' })
    }
  }

  function handlePDF() {
    const title = {
      transactions: 'Borrow Transactions Report',
      overdue: 'Overdue Items Report',
      inventory: 'Inventory Report',
      damaged: 'Damaged & Disposed Items Report',
    }[reportType]

    if (isTransactionReport) {
      exportTransactionsToPDF(displayTransactions, title)
    } else {
      exportInventoryToPDF(displayItems, title)
    }
    toast({ title: 'PDF file downloaded' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Generate and export system reports</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><FileBarChart className="w-4 h-4" />Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-1.5">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transactions">All Borrow Transactions</SelectItem>
                  <SelectItem value="overdue">Overdue Items</SelectItem>
                  <SelectItem value="inventory">Full Inventory</SelectItem>
                  <SelectItem value="damaged">Damaged & Disposed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isTransactionReport && (
              <>
                <div className="space-y-1.5">
                  <Label>Date From</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
                </div>
                <div className="space-y-1.5">
                  <Label>Date To</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
                </div>
              </>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={handleExcel}>
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </Button>
              <Button onClick={handlePDF}>
                <FileText className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {reportType === 'transactions' && `Borrow Transactions (${displayTransactions.length})`}
              {reportType === 'overdue' && `Overdue Items (${displayTransactions.length})`}
              {reportType === 'inventory' && `Full Inventory (${displayItems.length})`}
              {reportType === 'damaged' && `Damaged & Disposed (${displayItems.length})`}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : isTransactionReport ? (
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
                  {reportType === 'overdue' && <TableHead>Days Overdue</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayTransactions.map((tx) => (
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
                    {reportType === 'overdue' && (
                      <TableCell>
                        <span className="text-xs font-bold text-red-600">{tx.days_overdue}d</span>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {displayTransactions.length === 0 && (
                  <TableRow><TableCell colSpan={reportType === 'overdue' ? 8 : 7} className="text-center text-muted-foreground py-10">No records found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Compartment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.unique_code}</TableCell>
                    <TableCell className="font-medium text-sm">{item.equipment_model?.name}</TableCell>
                    <TableCell>
                      {item.equipment_model?.category && (
                        <span className="text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: item.equipment_model.category.color_shade }}>
                          {item.equipment_model.category.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{item.compartment?.name ?? '—'}</TableCell>
                    <TableCell>
                      <span className={cn('text-xs px-2 py-1 rounded-full font-medium', itemStatusColor(item.status))}>
                        {itemStatusLabel(item.status)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {displayItems.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">No records found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
