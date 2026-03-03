import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, Edit2, Trash2, Loader2, Settings2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { SystemConfig, Compartment, Category } from '@/types'

const compartmentSchema = z.object({
  name: z.string().min(2, 'Name required'),
  category_id: z.string().optional(),
})
type CompartmentForm = z.infer<typeof compartmentSchema>

export function SettingsPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [compOpen, setCompOpen] = useState(false)
  const [editComp, setEditComp] = useState<Compartment | null>(null)
  const compForm = useForm<CompartmentForm>({ resolver: zodResolver(compartmentSchema) })

  const { data: configs = [] } = useQuery({
    queryKey: ['system-config'],
    queryFn: async () => {
      const { data } = await supabase.from('system_config').select('*').order('key')
      return (data ?? []) as SystemConfig[]
    },
  })

  const { data: compartments = [] } = useQuery({
    queryKey: ['compartments'],
    queryFn: async () => {
      const { data } = await supabase.from('compartments').select('*, category:categories(*)').order('name')
      return (data ?? []) as Compartment[]
    },
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('name')
      return (data ?? []) as Category[]
    },
  })

  const saveComp = useMutation({
    mutationFn: async (data: CompartmentForm) => {
      const payload = { name: data.name, category_id: data.category_id || null }
      if (editComp) {
        await supabase.from('compartments').update(payload).eq('id', editComp.id)
      } else {
        await supabase.from('compartments').insert(payload)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compartments'] })
      setCompOpen(false)
      setEditComp(null)
      compForm.reset()
      toast({ title: editComp ? 'Compartment updated' : 'Compartment created' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteComp = useMutation({
    mutationFn: async (id: string) => { await supabase.from('compartments').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compartments'] }); toast({ title: 'Compartment deleted' }) },
  })

  const updateConfig = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await supabase.from('system_config').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['system-config'] }); toast({ title: 'Setting saved' }) },
  })

  const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure borrowing rules and system behavior</p>
      </div>

      {/* Borrowing Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Settings2 className="w-4 h-4" />Borrowing Rules</CardTitle>
          <CardDescription>Configure enforcement policies for borrowing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Block borrowing if open transaction exists</p>
              <p className="text-xs text-muted-foreground">Prevent students from borrowing if they have an unreturned transaction</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={configMap['block_if_open_transaction'] !== 'false'}
                onChange={(e) => updateConfig.mutate({ key: 'block_if_open_transaction', value: e.target.checked ? 'true' : 'false' })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Allow staff override</p>
              <p className="text-xs text-muted-foreground">Staff can override borrow restriction for special cases</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={configMap['allow_staff_override'] === 'true'}
                onChange={(e) => updateConfig.mutate({ key: 'allow_staff_override', value: e.target.checked ? 'true' : 'false' })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Maximum items per borrow</p>
              <p className="text-xs text-muted-foreground">Set to 0 for unlimited</p>
            </div>
            <Input
              type="number"
              min="0"
              className="w-24 text-center"
              defaultValue={configMap['max_items_per_borrow'] ?? '0'}
              onBlur={(e) => updateConfig.mutate({ key: 'max_items_per_borrow', value: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Compartments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Compartments</CardTitle>
              <CardDescription>Storage compartment locations for equipment</CardDescription>
            </div>
            <Button size="sm" onClick={() => { setEditComp(null); compForm.reset(); setCompOpen(true) }}>
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compartment Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compartments.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    {c.category ? (
                      <span className="text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: c.category.color_shade }}>
                        {c.category.name}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditComp(c); compForm.reset({ name: c.name, category_id: c.category_id ?? '' }); setCompOpen(true) }}><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteComp.mutate(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {compartments.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No compartments yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Compartment Dialog */}
      <Dialog open={compOpen} onOpenChange={setCompOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editComp ? 'Edit' : 'Add'} Compartment</DialogTitle></DialogHeader>
          <form onSubmit={compForm.handleSubmit((d) => saveComp.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input {...compForm.register('name')} placeholder="e.g. Cabinet A - Shelf 1" />
              {compForm.formState.errors.name && <p className="text-xs text-destructive">{compForm.formState.errors.name.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCompOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveComp.isPending}>{saveComp.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
