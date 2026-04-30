'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createOrderAction } from '@/app/actions/createOrder'

interface ContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultService?: string
}

interface ContactFormState {
  clientName: string
  clientEmail: string
  serviceType: string
  genre: string
  notes: string
}

const SERVICE_PRICES: Record<string, number> = {
  mixing: 200,
  mastering: 100,
  bundle: 275,
}

const toServiceType = (serviceId: string): 'mixing' | 'mastering' | 'mixing_mastering' => {
  if (serviceId === 'mastering') return 'mastering'
  if (serviceId === 'bundle') return 'mixing_mastering'
  return 'mixing'
}

const INITIAL_FORM: ContactFormState = {
  clientName: '',
  clientEmail: '',
  serviceType: '',
  genre: '',
  notes: '',
}

export const ContactDialog = ({
  open,
  onOpenChange,
  defaultService = '',
}: ContactDialogProps): JSX.Element => {
  const [form, setForm] = useState<ContactFormState>({ ...INITIAL_FORM, serviceType: defaultService })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field: keyof ContactFormState) => (value: string): void =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()

    if (!form.clientName || !form.clientEmail || !form.serviceType) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createOrderAction({
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        serviceType: toServiceType(form.serviceType),
        packageTier: 'starter',
        notes: [form.genre && `Genre: ${form.genre}`, form.notes].filter(Boolean).join('\n') || undefined,
        totalPrice: SERVICE_PRICES[form.serviceType] ?? 0,
      })

      if (!result.success) {
        toast.error('Submission failed', { description: result.error })
        return
      }

      toast.success('Request submitted!', { description: "We'll respond within 24 hours." })
      setForm(INITIAL_FORM)
      onOpenChange(false)
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight uppercase font-heading">
            Get Started
          </DialogTitle>
          <DialogDescription className="font-mono">
            Tell us about your project and we&apos;ll send a custom quote.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName" className="font-mono uppercase text-xs tracking-wider">
                Name *
              </Label>
              <Input
                id="clientName"
                value={form.clientName}
                onChange={(e) => updateField('clientName')(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail" className="font-mono uppercase text-xs tracking-wider">
                Email *
              </Label>
              <Input
                id="clientEmail"
                type="email"
                value={form.clientEmail}
                onChange={(e) => updateField('clientEmail')(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-mono uppercase text-xs tracking-wider">Service *</Label>
              <Select value={form.serviceType} onValueChange={updateField('serviceType')}>
                <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixing">Mixing – $200</SelectItem>
                  <SelectItem value="mastering">Mastering – $100</SelectItem>
                  <SelectItem value="bundle">Mix + Master – $275</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre" className="font-mono uppercase text-xs tracking-wider">
                Genre
              </Label>
              <Input
                id="genre"
                value={form.genre}
                onChange={(e) => updateField('genre')(e.target.value)}
                placeholder="e.g. Hip-Hop, Rock, Electronic"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="font-mono uppercase text-xs tracking-wider">
              Additional Details
            </Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => updateField('notes')(e.target.value)}
              placeholder="Reference tracks, specific requirements, timeline..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}
              className="font-mono uppercase tracking-wider">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}
              className="font-mono uppercase tracking-wider">
              {isSubmitting ? 'Submitting…' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
