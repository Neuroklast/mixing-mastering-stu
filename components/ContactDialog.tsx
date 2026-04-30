'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createOrder } from '@/app/actions/createOrder'

interface ContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultService?: string
}

interface FormState {
  name: string
  email: string
  service: string
  genre: string
  trackCount: string
  timeline: string
  message: string
}

function serviceToType(
  service: string,
): 'mixing' | 'mastering' | 'mixing_mastering' {
  if (service === 'mastering') return 'mastering'
  if (service === 'bundle') return 'mixing_mastering'
  return 'mixing'
}

function serviceToPriceCents(service: string): number {
  if (service === 'mastering') return 10000
  if (service === 'bundle') return 27500
  return 20000
}

export function ContactDialog({
  open,
  onOpenChange,
  defaultService = '',
}: ContactDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    service: defaultService,
    genre: '',
    trackCount: '1',
    timeline: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.service) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const result = await createOrder({
        client_name: formData.name,
        client_email: formData.email,
        service_type: serviceToType(formData.service),
        package_tier: 'starter',
        notes: [
          formData.genre && `Genre: ${formData.genre}`,
          formData.trackCount && `Tracks: ${formData.trackCount}`,
          formData.timeline && `Timeline: ${formData.timeline}`,
          formData.message,
        ]
          .filter(Boolean)
          .join('\n') || null,
        total_price: serviceToPriceCents(formData.service) / 100,
      })

      if (!result.success) {
        toast.error('Submission failed', { description: result.error })
        return
      }

      toast.success('Request submitted!', {
        description: "We'll get back to you within 24 hours.",
      })
      setFormData({
        name: '',
        email: '',
        service: '',
        genre: '',
        trackCount: '1',
        timeline: '',
        message: '',
      })
      onOpenChange(false)
    } catch {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight uppercase font-heading">
            Get Started
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-mono">
            Tell us about your project and we&apos;ll get back to you with a custom quote.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-mono uppercase text-xs tracking-wider">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
                required
                className="bg-secondary border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-mono uppercase text-xs tracking-wider">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                required
                className="bg-secondary border-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service" className="font-mono uppercase text-xs tracking-wider">
              Service *
            </Label>
            <Select
              value={formData.service}
              onValueChange={(value) => setFormData({ ...formData, service: value })}
            >
              <SelectTrigger id="service" className="bg-secondary border-input">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mixing">Mixing</SelectItem>
                <SelectItem value="mastering">Mastering</SelectItem>
                <SelectItem value="bundle">Mix + Master Bundle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genre" className="font-mono uppercase text-xs tracking-wider">
                Genre
              </Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                placeholder="e.g., Hip-Hop, Rock, Electronic"
                className="bg-secondary border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="track-count" className="font-mono uppercase text-xs tracking-wider">
                Number of Tracks
              </Label>
              <Input
                id="track-count"
                type="number"
                min="1"
                value={formData.trackCount}
                onChange={(e) => setFormData({ ...formData, trackCount: e.target.value })}
                className="bg-secondary border-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline" className="font-mono uppercase text-xs tracking-wider">
              Timeline
            </Label>
            <Input
              id="timeline"
              value={formData.timeline}
              onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
              placeholder="e.g., 1 week, flexible, ASAP"
              className="bg-secondary border-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="font-mono uppercase text-xs tracking-wider">
              Additional Details
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Tell us more about your project, reference tracks, specific requirements..."
              rows={4}
              className="bg-secondary border-input resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-input font-mono uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-accent hover:bg-accent/90 text-white font-mono uppercase tracking-wider"
            >
              {submitting ? 'Submitting…' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
