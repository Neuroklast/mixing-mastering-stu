'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ServicesSection } from '@/components/features/ServicesSection'

interface ServicesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPackage: (packageId: string) => void
}

export const ServicesModal = ({
  open,
  onOpenChange,
  onSelectPackage,
}: ServicesModalProps): JSX.Element => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[--background]/95 backdrop-blur-md overflow-y-auto"
        onClick={() => onOpenChange(false)}
      >
        <div className="min-h-screen flex items-start justify-center p-4 pt-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[--card] border border-[--border] rounded overflow-hidden p-8 md:p-12">
              <div className="flex items-start justify-between mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tighter font-heading">
                    SERVICE PACKAGES
                  </h2>
                  <p className="text-lg text-[--muted-foreground] font-mono mt-2">
                    Professional audio engineering with dedicated support.
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="rounded-full"
                  aria-label="Close"
                >
                  ✕
                </Button>
              </div>
              <ServicesSection onSelectPackage={onSelectPackage} />
            </div>
          </motion.div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)
