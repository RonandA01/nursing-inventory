import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Loader2, CheckCircle2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import type { BorrowTransaction, BorrowItem, ReturnCondition } from '@/types'

const conditions: { value: ReturnCondition; label: string }[] = [
  { value: 'good', label: 'Good' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'missing_parts', label: 'Missing Parts' },
  { value: 'disposed', label: 'Disposed' },
]

export function ReturnsPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [searchId, setSearchId] = useState('')
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<BorrowTransaction[]>([])
  const [selectedTx, setSelectedTx] = useState<BorrowTransaction | null>(null)
  const [itemConditions, setItemConditions] = useState<Record<string, { condition: ReturnCondition; remarks: string }>>({})
  const [success, setSuccess] = useState(false)

  async function search() {
    if (!searchId.trim()) return
    setLoading(true)
    setTransactions([])
    setSelectedTx(null)

    const { data: borrower } = await supabase
      .from('borrowers')
      .select('id')
      .eq('student_id', searchId.trim())
      .maybeSingle()

    if (!borrower) {
      toast({ title: 'No borrower found', description: `No student with ID "${searchId}" exists.`, variant: 'destructive' })
      setLoading(false)
      return
    }

    const { data: txs } = await supabase
      .from('borrow_transactions')
      .select('*, borrower:borrowers(*), procedure:procedures(*), borrow_items(*, equipment_item:equipment_items(*, equipment_model:equipment_models(*)))')
      .eq('borrower_id', borrower.id)
      .eq('status', 'borrowed')
      .order('date_borrowed', { ascending: false })

    setTransactions((txs ?? []) as BorrowTransaction[])
    setLoading(false)
  }

  function selectTransaction(tx: BorrowTransaction) {
    setSelectedTx(tx)
    const init: Record<string, { condition: ReturnCondition; remarks: string }> = {}
    tx.borrow_items?.forEach((item) => {
      init[item.id] = { condition: 'good', remarks: '' }
    })
    setItemConditions(init)
    setSuccess(false)
  }

  const returnMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTx) return

      const dateReturned = new Date().toISOString()

      // Update each borrow item condition
      for (const [itemId, state] of Object.entries(itemConditions)) {
        await supabase
          .from('borrow_items')
          .update({ condition_on_return: state.condition, remarks: state.remarks })
          .eq('id', itemId)

        // Update equipment item status
        const borrowItem = selectedTx.borrow_items?.find((bi) => bi.id === itemId)
        if (borrowItem) {
          const newStatus = state.condition === 'good' ? 'available' : state.condition === 'disposed' ? 'disposed' : 'damaged'
          await supabase
            .from('equipment_items')
            .update({ status: newStatus })
            .eq('id', borrowItem.equipment_item_id)
        }
      }

      // Update transaction
      await supabase
        .from('borrow_transactions')
        .update({ status: 'returned', date_returned: dateReturned })
        .eq('id', selectedTx.id)
    },
    onSuccess: () => {
      setSuccess(true)
      setTransactions([])
      setSelectedTx(null)
      qc.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      qc.invalidateQueries({ queryKey: ['recent-transactions'] })
      toast({ title: 'Return processed successfully!' })
    },
    onError: (err: Error) => {
      toast({ title: 'Return failed', description: err.message, variant: 'destructive' })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Process Returns</h1>
        <p className="text-muted-foreground text-sm mt-1">Search a borrower and process equipment returns</p>
      </div>

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">Return processed successfully. Equipment status updated.</p>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search Borrower</CardTitle>
          <CardDescription>Enter the student ID to find their active borrow transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Student ID (e.g. 2021-00001)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
            <Button onClick={search} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      {transactions.length > 0 && !selectedTx && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Borrow Transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.map((tx) => (
              <button
                key={tx.id}
                onClick={() => selectTransaction(tx)}
                className="w-full text-left p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tx.borrower?.student_name} <span className="text-muted-foreground text-sm">({tx.borrower?.student_id})</span></p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Procedure: {tx.procedure?.name} • Borrowed: {formatDateTime(tx.date_borrowed)}
                    </p>
                    <p className="text-sm mt-1">{tx.borrow_items?.length ?? 0} item(s)</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">Borrowed</Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {transactions.length === 0 && !loading && searchId && (
        <p className="text-center text-muted-foreground py-4">No active borrow transactions found for this student.</p>
      )}

      {/* Return Form */}
      {selectedTx && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Record Return</CardTitle>
            <CardDescription>
              {selectedTx.borrower?.student_name} — {selectedTx.procedure?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTx.borrow_items?.map((item) => (
              <div key={item.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-600" />
                  <p className="font-medium">{item.equipment_item?.equipment_model?.name}</p>
                  <span className="text-xs text-muted-foreground">({item.equipment_item?.unique_code})</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Condition</Label>
                    <Select
                      value={itemConditions[item.id]?.condition ?? 'good'}
                      onValueChange={(v) =>
                        setItemConditions((prev) => ({ ...prev, [item.id]: { ...prev[item.id], condition: v as ReturnCondition } }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {conditions.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Remarks</Label>
                    <Input
                      placeholder="Optional remarks"
                      value={itemConditions[item.id]?.remarks ?? ''}
                      onChange={(e) =>
                        setItemConditions((prev) => ({ ...prev, [item.id]: { ...prev[item.id], remarks: e.target.value } }))
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedTx(null)} className="flex-1" disabled={returnMutation.isPending}>
                Back
              </Button>
              <Button onClick={() => returnMutation.mutate()} className="flex-1" disabled={returnMutation.isPending}>
                {returnMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Return
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
