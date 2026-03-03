import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Loader2, Stethoscope } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import type { Procedure, EquipmentModel } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function ProceduresPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Procedure | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedProc, setSelectedProc] = useState<Procedure | null>(null)
  const [assignedIds, setAssignedIds] = useState<string[]>([])

  const form = useForm<FormData>({ resolver: zodResolver(schema) })

  const { data: procedures = [] } = useQuery({
    queryKey: ['procedures'],
    queryFn: async () => {
      const { data } = await supabase.from('procedures').select('*').order('name')
      return (data ?? []) as Procedure[]
    },
  })

  const { data: models = [] } = useQuery({
    queryKey: ['equipment-models'],
    queryFn: async () => {
      const { data } = await supabase.from('equipment_models').select('*, category:categories(*)').order('name')
      return (data ?? []) as EquipmentModel[]
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editing) {
        await supabase.from('procedures').update(data).eq('id', editing.id)
      } else {
        await supabase.from('procedures').insert(data)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['procedures'] })
      setOpen(false)
      setEditing(null)
      form.reset()
      toast({ title: editing ? 'Procedure updated' : 'Procedure created' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('procedures').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['procedures'] }); toast({ title: 'Procedure deleted' }) },
  })

  const saveAssignments = useMutation({
    mutationFn: async () => {
      if (!selectedProc) return
      await supabase.from('procedure_equipment').delete().eq('procedure_id', selectedProc.id)
      if (assignedIds.length > 0) {
        await supabase.from('procedure_equipment').insert(
          assignedIds.map((mid) => ({ procedure_id: selectedProc.id, equipment_model_id: mid }))
        )
      }
    },
    onSuccess: () => {
      setAssignOpen(false)
      toast({ title: 'Equipment assignments saved' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  async function openAssign(proc: Procedure) {
    setSelectedProc(proc)
    const { data } = await supabase
      .from('procedure_equipment')
      .select('equipment_model_id')
      .eq('procedure_id', proc.id)
    setAssignedIds((data ?? []).map((r) => r.equipment_model_id))
    setAssignOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Procedures</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage procedures and their suggested equipment</p>
        </div>
        <Button onClick={() => { setEditing(null); form.reset(); setOpen(true) }}>
          <Plus className="w-4 h-4" /> Add Procedure
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Procedure</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {procedures.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-green-600" />
                      {p.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.description ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => openAssign(p)}>Assign Equipment</Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(p); form.reset({ name: p.name, description: p.description ?? '' }); setOpen(true) }}><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {procedures.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-10">No procedures yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Procedure Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Procedure</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input {...form.register('name')} />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input {...form.register('description')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Equipment Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Equipment — {selectedProc?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {models.map((m) => (
              <label key={m.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignedIds.includes(m.id)}
                  onChange={(e) =>
                    setAssignedIds((prev) =>
                      e.target.checked ? [...prev, m.id] : prev.filter((x) => x !== m.id)
                    )
                  }
                  className="accent-green-600 w-4 h-4"
                />
                <span className="text-sm font-medium">{m.name}</span>
                {m.category && (
                  <Badge className="text-xs" style={{ backgroundColor: m.category.color_shade, color: 'white' }}>
                    {m.category.name}
                  </Badge>
                )}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={() => saveAssignments.mutate()} disabled={saveAssignments.isPending}>
              {saveAssignments.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Save Assignments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
