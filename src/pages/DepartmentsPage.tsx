import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { Department } from '@/types'

const schema = z.object({ name: z.string().min(2, 'Name required') })
type FormData = z.infer<typeof schema>

export function DepartmentsPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const form = useForm<FormData>({ resolver: zodResolver(schema) })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await supabase.from('departments').select('*').order('name')
      return (data ?? []) as Department[]
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editing) {
        await supabase.from('departments').update(data).eq('id', editing.id)
      } else {
        await supabase.from('departments').insert(data)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] })
      setOpen(false)
      setEditing(null)
      form.reset()
      toast({ title: editing ? 'Department updated' : 'Department created' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('departments').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast({ title: 'Department deleted' }) },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage college / department list for the borrow form</p>
        </div>
        <Button onClick={() => { setEditing(null); form.reset(); setOpen(true) }}>
          <Plus className="w-4 h-4" /> Add Department
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(d.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(d); form.reset({ name: d.name }); setOpen(true) }}><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(d.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {departments.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-10">No departments yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Department</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Department Name *</Label>
              <Input {...form.register('name')} placeholder="e.g. College of Nursing" />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
