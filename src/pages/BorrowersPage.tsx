import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { Borrower } from '@/types'

export function BorrowersPage() {
  const [search, setSearch] = useState('')

  const { data: borrowers = [], isLoading } = useQuery({
    queryKey: ['borrowers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('borrowers')
        .select('*')
        .order('student_name')
      return (data ?? []) as Borrower[]
    },
  })

  const { data: activeCounts = {} } = useQuery({
    queryKey: ['borrower-active-counts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('borrow_transactions')
        .select('borrower_id')
        .eq('status', 'borrowed')
      const counts: Record<string, number> = {}
      data?.forEach((tx) => {
        counts[tx.borrower_id] = (counts[tx.borrower_id] ?? 0) + 1
      })
      return counts
    },
  })

  const filtered = borrowers.filter((b) => {
    const q = search.toLowerCase()
    return !q || b.student_name.toLowerCase().includes(q) || b.college_department.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Borrowers</h1>
        <p className="text-muted-foreground text-sm mt-1">Student profiles auto-created when borrowing</p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
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
                  <TableHead>Instructor</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Active Borrows</TableHead>
                  <TableHead>Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-green-700" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{b.student_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{b.college_department}</TableCell>
                    <TableCell className="text-sm">{b.instructor_name}</TableCell>
                    <TableCell className="text-sm">{b.subject}</TableCell>
                    <TableCell className="text-sm">{b.class_schedule}</TableCell>
                    <TableCell>
                      {activeCounts[b.id] ? (
                        <Badge variant="destructive">{activeCounts[b.id]} active</Badge>
                      ) : (
                        <Badge variant="secondary">None</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(b.created_at)}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">No borrowers found</TableCell>
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
