'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  BaseModal,
  BaseModalContent,
  BaseModalHeader,
  BaseModalTitle,
  BaseModalDescription,
} from '@/components/ui/base-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createOrderAction } from '@/app/actions/createOrder'
import { SERVICES_CONFIG, getServiceById } from '@/lib/services-config'
import { CONTACT_RESPONSE_PROMISE } from '@/lib/site'

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

    const selectedService = getServiceById(form.serviceType)
    if (!selectedService) {
      toast.error('Invalid service selected. Please choose a valid option.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createOrderAction({
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        serviceType: toServiceType(form.serviceType),
        packageTier: selectedService.packageTier,
        notes: [form.genre && `Genre: ${form.genre}`, form.notes].filter(Boolean).join('\n') || undefined,
        totalPrice: selectedService.priceUsd,
      })

      if (!result.success) {
        toast.error('Submission failed', { description: result.error })
        return
      }

      toast.success('Request submitted!', { description: CONTACT_RESPONSE_PROMISE })
      setForm(INITIAL_FORM)
      onOpenChange(false)
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <BaseModal.Root open={open} onOpenChange={onOpenChange}>
      <BaseModalContent size="lg" aria-describedby="contact-modal-desc">
        <BaseModalHeader>
          <BaseModalTitle>Get Started</BaseModalTitle>
          <BaseModalDescription id="contact-modal-desc">
            Tell us about your project and we&apos;ll send a custom quote.
          </BaseModalDescription>
        </BaseModalHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName" className="font-mono uppercase text-xs tracking-wider">
                Name <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </Label>
              <Input
                id="contactName"
                value={form.clientName}
                onChange={(e) => updateField('clientName')(e.target.value)}
                placeholder="Your name"
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail" className="font-mono uppercase text-xs tracking-wider">
                Email <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </Label>
              <Input
                id="contactEmail"
                type="email"
                value={form.clientEmail}
                onChange={(e) => updateField('clientEmail')(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-mono uppercase text-xs tracking-wider">
                Service <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </Label>
              <Select value={form.serviceType} onValueChange={updateField('serviceType')}>
                <SelectTrigger aria-label="Select service"><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  {SERVICES_CONFIG.map((svc) => (
                    <SelectItem key={svc.id} value={svc.id}>
                      {svc.name} – {svc.displayPrice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactGenre" className="font-mono uppercase text-xs tracking-wider">
                Genre
              </Label>
              <Input
                id="contactGenre"
                value={form.genre}
                onChange={(e) => updateField('genre')(e.target.value)}
                placeholder="e.g. Hip-Hop, Rock, Electronic"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactNotes" className="font-mono uppercase text-xs tracking-wider">
              Additional Details
            </Label>
            <Textarea
              id="contactNotes"
              value={form.notes}
              onChange={(e) => updateField('notes')(e.target.value)}
              placeholder="Reference tracks, specific requirements, timeline..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
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
      </BaseModalContent>
    </BaseModal.Root>
  )
}
