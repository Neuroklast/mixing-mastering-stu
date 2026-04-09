import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
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

interface ContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultService?: string
}

interface ContactFormData {
  name: string
  email: string
  service: string
  genre: string
  trackCount: string
  timeline: string
  message: string
}

export function ContactDialog({ open, onOpenChange, defaultService }: ContactDialogProps) {
  const [submissions, setSubmissions] = useKV<ContactFormData[]>('contact-submissions', [])
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    service: defaultService || '',
    genre: '',
    trackCount: '1',
    timeline: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.service) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmissions((current) => {
      const updated = current || []
      return [...updated, { ...formData }]
    })
    
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
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Get Started</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Tell us about your project and we'll get back to you with a custom quote.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
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
              <Label htmlFor="email">Email *</Label>
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
            <Label htmlFor="service">Service *</Label>
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
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                placeholder="e.g., Hip-Hop, Rock, Electronic"
                className="bg-secondary border-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="track-count">Number of Tracks</Label>
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
            <Label htmlFor="timeline">Timeline</Label>
            <Input
              id="timeline"
              value={formData.timeline}
              onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
              placeholder="e.g., 1 week, flexible, ASAP"
              className="bg-secondary border-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Additional Details</Label>
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
              className="border-input"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
