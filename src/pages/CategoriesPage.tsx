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
import type { Category } from '@/types'

const greenShades = [
  { label: 'Light Green', value: '#86efac' },
  { label: 'Medium Green', value: '#22c55e' },
  { label: 'Dark Green', value: '#15803d' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Forest Green', value: '#166534' },
  { label: 'Lime Green', value: '#84cc16' },
  { label: 'Teal Green', value: '#0d9488' },
  { label: 'Sage', value: '#6b7280' },
]

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  color_shade: z.string().min(1, 'Color required'),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function CategoriesPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { color_shade: '#22c55e' } })
  const colorValue = form.watch('color_shade')

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('name')
      return (data ?? []) as Category[]
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editing) {
        await supabase.from('categories').update(data).eq('id', editing.id)
      } else {
        await supabase.from('categories').insert(data)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      setOpen(false)
      setEditing(null)
      form.reset({ color_shade: '#22c55e' })
      toast({ title: editing ? 'Category updated' : 'Category created' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('categories').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast({ title: 'Category deleted' }) },
  })

  function openEdit(cat: Category) {
    setEditing(cat)
    form.reset({ name: cat.name, color_shade: cat.color_shade, description: cat.description ?? '' })
    setOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage equipment categories and green color shades</p>
        </div>
        <Button onClick={() => { setEditing(null); form.reset({ color_shade: '#22c55e' }); setOpen(true) }}>
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Color</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg border" style={{ backgroundColor: cat.color_shade }} />
                      <span className="text-xs font-mono text-muted-foreground">{cat.color_shade}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-3 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: cat.color_shade }}>
                      {cat.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{cat.description ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(cat)}><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(cat.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {categories.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-10">No categories yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Category</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input {...form.register('name')} />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Color Shade *</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={colorValue}
                  onChange={(e) => form.setValue('color_shade', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border"
                />
                <Input {...form.register('color_shade')} placeholder="#22c55e" className="flex-1" />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {greenShades.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => form.setValue('color_shade', s.value)}
                    className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full text-white hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: s.value }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input {...form.register('description')} />
            </div>

            <div className="p-3 rounded-lg" style={{ backgroundColor: colorValue + '20' }}>
              <p className="text-sm font-medium" style={{ color: colorValue }}>Preview</p>
              <span className="px-3 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: colorValue }}>
                {form.watch('name') || 'Category Name'}
              </span>
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
