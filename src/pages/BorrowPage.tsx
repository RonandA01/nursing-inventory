import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Loader2, AlertCircle, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import type { Procedure, Department, EquipmentItem, BorrowTransaction } from '@/types'
import { cn } from '@/lib/utils'

const schema = z.object({
  student_id: z.string().min(1, 'Student ID is required'),
  student_name: z.string().min(2, 'Full name is required'),
  college_department: z.string().min(1, 'Department is required'),
  instructor_name: z.string().min(2, 'Instructor name is required'),
  subject: z.string().min(1, 'Subject is required'),
  group_number: z.string().optional(),
  class_schedule: z.string().min(1, 'Class schedule is required'),
  procedure_id: z.string().min(1, 'Procedure is required'),
  expected_return_date: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function BorrowPage() {
  const { toast } = useToast()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [formData, setFormData] = useState<FormData | null>(null)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [openTx, setOpenTx] = useState<BorrowTransaction | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const procedureId = watch('procedure_id')
  const studentId = watch('student_id')

  // Departments
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await supabase.from('departments').select('*').order('name')
      return (data ?? []) as Department[]
    },
  })

  // Procedures
  const { data: procedures = [] } = useQuery({
    queryKey: ['procedures'],
    queryFn: async () => {
      const { data } = await supabase.from('procedures').select('*').order('name')
      return (data ?? []) as Procedure[]
    },
  })

  // Equipment suggestions based on selected procedure
  const { data: suggestedItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['procedure-items', procedureId],
    enabled: !!procedureId,
    queryFn: async () => {
      const { data: links } = await supabase
        .from('procedure_equipment')
        .select('equipment_model_id')
        .eq('procedure_id', procedureId)

      if (!links?.length) return []

      const modelIds = links.map((l) => l.equipment_model_id)
      const { data: items } = await supabase
        .from('equipment_items')
        .select('*, equipment_model:equipment_models(*, category:categories(*))')
        .in('equipment_model_id', modelIds)
        .in('status', ['available', 'borrowed'])
        .order('unique_code')

      return (items ?? []) as EquipmentItem[]
    },
  })

  // Check for open transaction
  const checkOpenTransaction = async (sid: string) => {
    const { data: borrower } = await supabase
      .from('borrowers')
      .select('id')
      .eq('student_id', sid)
      .maybeSingle()

    if (!borrower) return null

    const { data: tx } = await supabase
      .from('borrow_transactions')
      .select('*, procedure:procedures(*), borrow_items(*, equipment_item:equipment_items(*, equipment_model:equipment_models(*)))')
      .eq('borrower_id', borrower.id)
      .eq('status', 'borrowed')
      .maybeSingle()

    return tx as BorrowTransaction | null
  }

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!formData || selectedItemIds.length === 0) throw new Error('No items selected')

      // Upsert borrower profile
      const { data: borrower, error: bErr } = await supabase
        .from('borrowers')
        .upsert({
          student_id: formData.student_id,
          student_name: formData.student_name,
          college_department: formData.college_department,
          instructor_name: formData.instructor_name,
          subject: formData.subject,
          group_number: formData.group_number || null,
          class_schedule: formData.class_schedule,
        }, { onConflict: 'student_id' })
        .select()
        .single()

      if (bErr) throw bErr

      // Create transaction
      const { data: tx, error: txErr } = await supabase
        .from('borrow_transactions')
        .insert({
          borrower_id: borrower.id,
          procedure_id: formData.procedure_id,
          expected_return_date: formData.expected_return_date || null,
          status: 'borrowed',
          date_borrowed: new Date().toISOString(),
        })
        .select()
        .single()

      if (txErr) throw txErr

      // Create borrow items
      const itemRows = selectedItemIds.map((item_id) => ({
        transaction_id: tx.id,
        equipment_item_id: item_id,
      }))

      const { error: itemErr } = await supabase.from('borrow_items').insert(itemRows)
      if (itemErr) throw itemErr

      // Update item statuses to 'borrowed'
      await supabase
        .from('equipment_items')
        .update({ status: 'borrowed' })
        .in('id', selectedItemIds)

      return tx
    },
    onSuccess: () => {
      setSubmitted(true)
    },
    onError: (err: Error) => {
      toast({ title: 'Submission failed', description: err.message, variant: 'destructive' })
    },
  })

  async function onStepOneSubmit(data: FormData) {
    const open = await checkOpenTransaction(data.student_id)
    if (open) {
      setOpenTx(open)
      return
    }
    setFormData(data)
    setStep(2)
  }

  function toggleItem(id: string) {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleConfirm() {
    if (selectedItemIds.length === 0) {
      toast({ title: 'Select at least one item', variant: 'destructive' })
      return
    }
    setStep(3)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-900 mb-2">Borrow Request Submitted!</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Your borrow request has been recorded. Please wait for staff to prepare your equipment.
        </p>
        <Button onClick={() => { setSubmitted(false); setStep(1); setFormData(null); setSelectedItemIds([]) }}>
          Submit Another Request
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
              step >= s ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600'
            )}>{s}</div>
            {s < 3 && <div className={cn('flex-1 h-0.5 w-12', step > s ? 'bg-green-600' : 'bg-green-100')} />}
          </div>
        ))}
        <div className="ml-2 text-sm text-muted-foreground">
          {step === 1 && 'Borrower Information'}
          {step === 2 && 'Select Equipment'}
          {step === 3 && 'Confirm & Submit'}
        </div>
      </div>

      {/* Open transaction warning */}
      {openTx && (
        <Card className="border-orange-200 bg-orange-50 mb-4">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-orange-800">Active Borrow Transaction Found</p>
                <p className="text-sm text-orange-700 mt-1">
                  This student currently has an open borrow transaction for{' '}
                  <strong>{openTx.procedure?.name}</strong>. Please return existing equipment first.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-orange-300 text-orange-700"
                  onClick={() => setOpenTx(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Borrower Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Borrower Information</CardTitle>
            <CardDescription>Fill in your student details to borrow equipment</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onStepOneSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Student ID *</Label>
                  <Input placeholder="e.g. 2021-00001" {...register('student_id')} />
                  {errors.student_id && <p className="text-xs text-destructive">{errors.student_id.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input placeholder="Juan Dela Cruz" {...register('student_name')} />
                  {errors.student_name && <p className="text-xs text-destructive">{errors.student_name.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>College / Department *</Label>
                <Select onValueChange={(v) => setValue('college_department', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.college_department && <p className="text-xs text-destructive">{errors.college_department.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Instructor Name *</Label>
                  <Input placeholder="Prof. Santos" {...register('instructor_name')} />
                  {errors.instructor_name && <p className="text-xs text-destructive">{errors.instructor_name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Subject *</Label>
                  <Input placeholder="NCM 101" {...register('subject')} />
                  {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Group Number</Label>
                  <Input placeholder="Group 3 (optional)" {...register('group_number')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Class Schedule *</Label>
                  <Input placeholder="MWF 8:00-10:00 AM" {...register('class_schedule')} />
                  {errors.class_schedule && <p className="text-xs text-destructive">{errors.class_schedule.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Procedure *</Label>
                  <Select onValueChange={(v) => setValue('procedure_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select procedure" />
                    </SelectTrigger>
                    <SelectContent>
                      {procedures.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.procedure_id && <p className="text-xs text-destructive">{errors.procedure_id.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Expected Return Date</Label>
                  <Input type="date" {...register('expected_return_date')} />
                </div>
              </div>

              <Button type="submit" className="w-full mt-2">
                Next: Select Equipment
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Equipment Selection */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Equipment</CardTitle>
            <CardDescription>
              Suggested equipment for the selected procedure. Only available items can be selected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingItems ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : suggestedItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No equipment found for this procedure.
              </p>
            ) : (
              <div className="space-y-2 mb-4">
                {suggestedItems.map((item) => {
                  const isAvailable = item.status === 'available'
                  const isSelected = selectedItemIds.includes(item.id)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => isAvailable && toggleItem(item.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3',
                        isSelected ? 'border-green-600 bg-green-50' : 'border-border hover:border-green-300',
                        !isAvailable && 'opacity-50 cursor-not-allowed bg-muted'
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
                        isSelected ? 'bg-green-600 border-green-600' : 'border-input'
                      )}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                      </div>
                      <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.equipment_model?.name}</p>
                        <p className="text-xs text-muted-foreground">Code: {item.unique_code}</p>
                      </div>
                      <Badge
                        className={cn(
                          'text-xs shrink-0',
                          isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {isAvailable ? 'Available' : item.status}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            )}

            {selectedItemIds.length > 0 && (
              <p className="text-sm text-green-700 font-medium mb-3">
                {selectedItemIds.length} item(s) selected
              </p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={handleConfirm} className="flex-1" disabled={selectedItemIds.length === 0}>
                Review & Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && formData && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Borrow Request</CardTitle>
            <CardDescription>Review your request before submitting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Student ID:</span><p className="font-medium">{formData.student_id}</p></div>
              <div><span className="text-muted-foreground">Name:</span><p className="font-medium">{formData.student_name}</p></div>
              <div><span className="text-muted-foreground">Department:</span><p className="font-medium">{formData.college_department}</p></div>
              <div><span className="text-muted-foreground">Instructor:</span><p className="font-medium">{formData.instructor_name}</p></div>
              <div><span className="text-muted-foreground">Subject:</span><p className="font-medium">{formData.subject}</p></div>
              <div><span className="text-muted-foreground">Schedule:</span><p className="font-medium">{formData.class_schedule}</p></div>
              <div><span className="text-muted-foreground">Procedure:</span><p className="font-medium">{procedures.find(p => p.id === formData.procedure_id)?.name}</p></div>
              {formData.expected_return_date && (
                <div><span className="text-muted-foreground">Expected Return:</span><p className="font-medium">{formData.expected_return_date}</p></div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Selected Items ({selectedItemIds.length})</p>
              <div className="space-y-1">
                {suggestedItems.filter(i => selectedItemIds.includes(i.id)).map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-sm bg-green-50 rounded p-2">
                    <Package className="w-4 h-4 text-green-600" />
                    <span>{item.equipment_model?.name}</span>
                    <span className="text-muted-foreground">({item.unique_code})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={submitMutation.isPending}>Back</Button>
              <Button onClick={() => submitMutation.mutate()} className="flex-1" disabled={submitMutation.isPending}>
                {submitMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
