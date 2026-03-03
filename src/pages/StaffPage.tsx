import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, Loader2, UserCheck, UserX } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/types'

const schema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  role: z.enum(['admin', 'staff']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormData = z.infer<typeof schema>

export function StaffPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { role: 'staff' } })

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at')
      return (data ?? []) as Profile[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Use Supabase admin API via service role or invite method
      // For client-side, we use signUp then update role in profiles
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.full_name } },
      })
      if (error) throw error
      if (authData.user) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          email: data.email,
          full_name: data.full_name,
          role: data.role,
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      setOpen(false)
      form.reset({ role: 'staff' })
      toast({ title: 'Staff account created. They will receive a confirmation email.' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: 'admin' | 'staff' }) => {
      await supabase.from('profiles').update({ role }).eq('id', id)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); toast({ title: 'Role updated' }) },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Accounts</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage staff and admin user accounts</p>
        </div>
        <Button onClick={() => { form.reset({ role: 'staff' }); setOpen(true) }}>
          <Plus className="w-4 h-4" /> Add Staff
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24">Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                          {s.full_name[0]?.toUpperCase()}
                        </div>
                        {s.full_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{s.email}</TableCell>
                    <TableCell>
                      <Badge variant={s.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                        {s.role === 'admin' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        {s.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(s.created_at)}</TableCell>
                    <TableCell>
                      <Select
                        value={s.role}
                        onValueChange={(v) => updateRoleMutation.mutate({ id: s.id, role: v as 'admin' | 'staff' })}
                      >
                        <SelectTrigger className="h-8 text-xs w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {staff.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">No staff accounts</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Account</DialogTitle>
            <DialogDescription>Create a login account for a staff or admin member.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input {...form.register('full_name')} />
              {form.formState.errors.full_name && <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" {...form.register('email')} />
              {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Temporary Password *</Label>
              <Input type="password" {...form.register('password')} />
              {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select value={form.watch('role')} onValueChange={(v) => form.setValue('role', v as 'admin' | 'staff')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Create Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
