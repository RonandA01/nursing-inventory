import { useQuery } from '@tanstack/react-query'
import {
  Package, ArrowDownToLine, AlertTriangle, Clock, Activity,
  Wrench, Trash2, CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { formatDate, formatDateTime, calcOverdueDays, txStatusColor, txStatusLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { BorrowTransaction } from '@/types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { subDays, format } from 'date-fns'

function MetricCard({ title, value, icon: Icon, color, description }: {
  title: string; value: number | string; icon: React.ElementType; color: string; description?: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { data: metrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const [borrowed, returned, overdue, available, damaged, disposed, maintenance] = await Promise.all([
        supabase.from('borrow_transactions').select('id', { count: 'exact' }).eq('status', 'borrowed'),
        supabase.from('borrow_transactions').select('id', { count: 'exact' }).eq('status', 'returned')
          .gte('date_returned', new Date().toISOString().split('T')[0]),
        supabase.from('borrow_transactions').select('id', { count: 'exact' }).eq('status', 'overdue'),
        supabase.from('equipment_items').select('id', { count: 'exact' }).eq('status', 'available'),
        supabase.from('equipment_items').select('id', { count: 'exact' }).eq('status', 'damaged'),
        supabase.from('equipment_items').select('id', { count: 'exact' }).eq('status', 'disposed'),
        supabase.from('equipment_items').select('id', { count: 'exact' }).eq('status', 'under_maintenance'),
      ])
      return {
        active_borrowed: borrowed.count ?? 0,
        returned_today: returned.count ?? 0,
        overdue: overdue.count ?? 0,
        available_items: available.count ?? 0,
        damaged_items: damaged.count ?? 0,
        disposed_items: disposed.count ?? 0,
        under_maintenance: maintenance.count ?? 0,
      }
    },
  })

  const { data: overdueTransactions = [] } = useQuery({
    queryKey: ['overdue-transactions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('borrow_transactions')
        .select('*, borrower:borrowers(*), procedure:procedures(*)')
        .in('status', ['borrowed', 'overdue'])
        .not('expected_return_date', 'is', null)
        .order('expected_return_date', { ascending: true })
        .limit(10)
      return ((data ?? []) as BorrowTransaction[]).map((tx) => ({
        ...tx,
        days_overdue: calcOverdueDays(tx.expected_return_date),
      })).filter((tx) => tx.days_overdue > 0)
    },
  })

  const { data: recentTransactions = [] } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('borrow_transactions')
        .select('*, borrower:borrowers(*), procedure:procedures(*)')
        .order('date_borrowed', { ascending: false })
        .limit(5)
      return (data ?? []) as BorrowTransaction[]
    },
  })

  // Last 7 days borrow activity
  const { data: chartData = [] } = useQuery({
    queryKey: ['borrow-chart'],
    queryFn: async () => {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i)
        return format(d, 'yyyy-MM-dd')
      })
      const results = await Promise.all(
        days.map(async (day) => {
          const { count } = await supabase
            .from('borrow_transactions')
            .select('id', { count: 'exact' })
            .gte('date_borrowed', `${day}T00:00:00`)
            .lte('date_borrowed', `${day}T23:59:59`)
          return { day: format(new Date(day), 'EEE'), borrows: count ?? 0 }
        })
      )
      return results
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time inventory monitoring</p>
      </div>

      {/* Borrow Metrics */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Borrow Activity</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Active Borrows" value={metrics?.active_borrowed ?? 0} icon={Package} color="bg-blue-500" />
          <MetricCard title="Returned Today" value={metrics?.returned_today ?? 0} icon={CheckCircle2} color="bg-green-500" />
          <MetricCard title="Overdue" value={metrics?.overdue ?? 0} icon={AlertTriangle} color="bg-red-500" />
          <MetricCard title="Not Yet Returned" value={metrics?.active_borrowed ?? 0} icon={Clock} color="bg-orange-500" />
        </div>
      </div>

      {/* Inventory Metrics */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Inventory Status</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Available" value={metrics?.available_items ?? 0} icon={ArrowDownToLine} color="bg-green-600" />
          <MetricCard title="Currently Borrowed" value={metrics?.active_borrowed ?? 0} icon={Activity} color="bg-blue-600" />
          <MetricCard title="Damaged" value={metrics?.damaged_items ?? 0} icon={AlertTriangle} color="bg-orange-500" />
          <MetricCard title="Under Maintenance" value={metrics?.under_maintenance ?? 0} icon={Wrench} color="bg-yellow-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Borrow Activity — Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="borrows" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Overdue Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Overdue Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {overdueTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 pb-4">No overdue items.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Procedure</TableHead>
                    <TableHead>Days Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium text-sm">
                        {tx.borrower?.student_name}
                        <br /><span className="text-xs text-muted-foreground">{tx.borrower?.student_id}</span>
                      </TableCell>
                      <TableCell className="text-sm">{tx.procedure?.name}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{tx.days_overdue}d</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Procedure</TableHead>
                <TableHead>Date Borrowed</TableHead>
                <TableHead>Expected Return</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium text-sm">
                    {tx.borrower?.student_name}
                    <br /><span className="text-xs text-muted-foreground">{tx.borrower?.student_id}</span>
                  </TableCell>
                  <TableCell className="text-sm">{tx.procedure?.name}</TableCell>
                  <TableCell className="text-sm">{formatDateTime(tx.date_borrowed)}</TableCell>
                  <TableCell className="text-sm">{formatDate(tx.expected_return_date)}</TableCell>
                  <TableCell>
                    <span className={cn('text-xs px-2 py-1 rounded-full font-medium', txStatusColor(tx.status))}>
                      {txStatusLabel(tx.status)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {recentTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No transactions yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
