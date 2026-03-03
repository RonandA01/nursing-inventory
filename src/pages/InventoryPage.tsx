import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { itemStatusColor, itemStatusLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { EquipmentModel, EquipmentItem, Category, Compartment, ItemStatus } from '@/types'

const modelSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  category_id: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
})
const itemSchema = z.object({
  unique_code: z.string().min(1, 'Unique code is required'),
  equipment_model_id: z.string().min(1, 'Equipment model is required'),
  compartment_id: z.string().optional(),
  status: z.enum(['available', 'borrowed', 'damaged', 'disposed', 'under_maintenance']),
})
type ModelForm = z.infer<typeof modelSchema>
type ItemForm = z.infer<typeof itemSchema>

const statusOptions: ItemStatus[] = ['available', 'borrowed', 'damaged', 'disposed', 'under_maintenance']

export function InventoryPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modelOpen, setModelOpen] = useState(false)
  const [itemOpen, setItemOpen] = useState(false)
  const [editModel, setEditModel] = useState<EquipmentModel | null>(null)
  const [editItem, setEditItem] = useState<EquipmentItem | null>(null)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('name')
      return (data ?? []) as Category[]
    },
  })

  const { data: compartments = [] } = useQuery({
    queryKey: ['compartments'],
    queryFn: async () => {
      const { data } = await supabase.from('compartments').select('*').order('name')
      return (data ?? []) as Compartment[]
    },
  })

  const { data: models = [], isLoading: loadingModels } = useQuery({
    queryKey: ['equipment-models'],
    queryFn: async () => {
      const { data } = await supabase
        .from('equipment_models')
        .select('*, category:categories(*)')
        .order('name')
      return (data ?? []) as EquipmentModel[]
    },
  })

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['equipment-items'],
    queryFn: async () => {
      const { data } = await supabase
        .from('equipment_items')
        .select('*, equipment_model:equipment_models(*, category:categories(*)), compartment:compartments(*)')
        .order('unique_code')
      return (data ?? []) as EquipmentItem[]
    },
  })

  // Model form
  const modelForm = useForm<ModelForm>({ resolver: zodResolver(modelSchema) })
  const itemForm = useForm<ItemForm>({ resolver: zodResolver(itemSchema), defaultValues: { status: 'available' } })

  const saveModel = useMutation({
    mutationFn: async (data: ModelForm) => {
      if (editModel) {
        await supabase.from('equipment_models').update(data).eq('id', editModel.id)
      } else {
        await supabase.from('equipment_models').insert(data)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment-models'] })
      setModelOpen(false)
      setEditModel(null)
      modelForm.reset()
      toast({ title: editModel ? 'Model updated' : 'Model created' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const saveItem = useMutation({
    mutationFn: async (data: ItemForm) => {
      const payload = { ...data, compartment_id: data.compartment_id || null }
      if (editItem) {
        await supabase.from('equipment_items').update(payload).eq('id', editItem.id)
      } else {
        await supabase.from('equipment_items').insert(payload)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment-items'] })
      setItemOpen(false)
      setEditItem(null)
      itemForm.reset({ status: 'available' })
      toast({ title: editItem ? 'Item updated' : 'Item added' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const deleteModel = useMutation({
    mutationFn: async (id: string) => { await supabase.from('equipment_models').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment-models'] }); toast({ title: 'Model deleted' }) },
  })

  const deleteItem = useMutation({
    mutationFn: async (id: string) => { await supabase.from('equipment_items').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment-items'] }); toast({ title: 'Item deleted' }) },
  })

  function openEditModel(m: EquipmentModel) {
    setEditModel(m)
    modelForm.reset({ name: m.name, category_id: m.category_id, description: m.description ?? '' })
    setModelOpen(true)
  }

  function openEditItem(item: EquipmentItem) {
    setEditItem(item)
    itemForm.reset({
      unique_code: item.unique_code,
      equipment_model_id: item.equipment_model_id,
      compartment_id: item.compartment_id ?? '',
      status: item.status,
    })
    setItemOpen(true)
  }

  const filteredItems = items.filter((i) => {
    const q = search.toLowerCase()
    return !q || i.unique_code.toLowerCase().includes(q) || i.equipment_model?.name?.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage equipment models and physical units</p>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Equipment Items ({items.length})</TabsTrigger>
          <TabsTrigger value="models">Equipment Models ({models.length})</TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search by code or name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Button onClick={() => { setEditItem(null); itemForm.reset({ status: 'available' }); setItemOpen(true) }}>
                  <Plus className="w-4 h-4" /> Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingItems ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Compartment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">{item.unique_code}</TableCell>
                        <TableCell className="font-medium text-sm">{item.equipment_model?.name}</TableCell>
                        <TableCell>
                          {item.equipment_model?.category && (
                            <span
                              className="text-xs px-2 py-1 rounded-full font-medium text-white"
                              style={{ backgroundColor: item.equipment_model.category.color_shade }}
                            >
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
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditItem(item)}><Edit2 className="w-3.5 h-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteItem.mutate(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredItems.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No items found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-end">
                <Button onClick={() => { setEditModel(null); modelForm.reset(); setModelOpen(true) }}>
                  <Plus className="w-4 h-4" /> Add Model
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingModels ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {models.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>
                          {m.category && (
                            <span className="text-xs px-2 py-1 rounded-full font-medium text-white" style={{ backgroundColor: m.category.color_shade }}>
                              {m.category.name}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.description ?? '—'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditModel(m)}><Edit2 className="w-3.5 h-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteModel.mutate(m.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {models.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-10">No equipment models yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Model Dialog */}
      <Dialog open={modelOpen} onOpenChange={setModelOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editModel ? 'Edit' : 'Add'} Equipment Model</DialogTitle></DialogHeader>
          <form onSubmit={modelForm.handleSubmit((d) => saveModel.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input {...modelForm.register('name')} />
              {modelForm.formState.errors.name && <p className="text-xs text-destructive">{modelForm.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={modelForm.watch('category_id')} onValueChange={(v) => modelForm.setValue('category_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input {...modelForm.register('description')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModelOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveModel.isPending}>{saveModel.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'Edit' : 'Add'} Equipment Item</DialogTitle></DialogHeader>
          <form onSubmit={itemForm.handleSubmit((d) => saveItem.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Unique Code / Barcode *</Label>
              <Input {...itemForm.register('unique_code')} placeholder="e.g. STH-001" />
              {itemForm.formState.errors.unique_code && <p className="text-xs text-destructive">{itemForm.formState.errors.unique_code.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Equipment Model *</Label>
              <Select value={itemForm.watch('equipment_model_id')} onValueChange={(v) => itemForm.setValue('equipment_model_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                <SelectContent>{models.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Compartment</Label>
              <Select value={itemForm.watch('compartment_id')} onValueChange={(v) => itemForm.setValue('compartment_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select compartment (optional)" /></SelectTrigger>
                <SelectContent>{compartments.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select value={itemForm.watch('status')} onValueChange={(v) => itemForm.setValue('status', v as ItemStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statusOptions.map((s) => <SelectItem key={s} value={s}>{itemStatusLabel(s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setItemOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveItem.isPending}>{saveItem.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
