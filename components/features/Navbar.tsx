'use client'

import { useState } from 'react'
import { Waveform, List, Envelope } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ContactDialog } from '@/components/features/ContactDialog'
import { ServicesModal } from '@/components/features/ServicesModal'

type NavSection = 'services' | 'contact' | null

export const Navbar = (): JSX.Element => {
  const [activeSection, setActiveSection] = useState<NavSection>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedService, setSelectedService] = useState('')

  const openSection = (section: NavSection): void => {
    setActiveSection(section)
    setIsMobileMenuOpen(false)
  }

  const handleServiceSelect = (serviceId: string): void => {
    setSelectedService(serviceId)
    setActiveSection('contact')
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[--background]/90 backdrop-blur-sm border-b border-[--border]">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <BrandLogo />

            <div className="hidden md:flex items-center gap-6">
              <NavButton label="Services" onClick={() => openSection('services')} />
              <Button
                size="sm"
                className="font-mono uppercase tracking-wider"
                onClick={() => openSection('contact')}
              >
                <Envelope className="h-4 w-4 mr-2" weight="bold" />
                Contact
              </Button>
            </div>

            <button
              className="md:hidden"
              aria-label="Toggle menu"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <List className="h-6 w-6 text-[--accent]" weight="bold" />
            </button>
          </div>
        </div>

        <MobileMenu
          isOpen={isMobileMenuOpen}
          onOpenServices={() => openSection('services')}
          onOpenContact={() => openSection('contact')}
        />
      </nav>

      <ServicesModal
        open={activeSection === 'services'}
        onOpenChange={(open) => !open && setActiveSection(null)}
        onSelectPackage={handleServiceSelect}
      />
      <ContactDialog
        open={activeSection === 'contact'}
        onOpenChange={(open) => !open && setActiveSection(null)}
        defaultService={selectedService}
      />
    </>
  )
}

const BrandLogo = (): JSX.Element => (
  <div className="flex items-center gap-3">
    <Waveform className="h-6 w-6 text-[--accent]" weight="bold" />
    <span className="font-bold text-xl tracking-tighter font-heading">SONORATIVA</span>
  </div>
)

interface NavButtonProps { label: string; onClick: () => void }
const NavButton = ({ label, onClick }: NavButtonProps): JSX.Element => (
  <button
    onClick={onClick}
    className="text-sm font-mono uppercase tracking-wider hover:text-[--accent] transition-colors"
  >
    {label}
  </button>
)

interface MobileMenuProps {
  isOpen: boolean
  onOpenServices: () => void
  onOpenContact: () => void
}
const MobileMenu = ({ isOpen, onOpenServices, onOpenContact }: MobileMenuProps): JSX.Element => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="md:hidden border-t border-[--border] bg-[--card]"
      >
        <div className="container max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
          <NavButton label="Services" onClick={onOpenServices} />
          <Button
            size="sm"
            className="font-mono uppercase tracking-wider w-full"
            onClick={onOpenContact}
          >
            <Envelope className="h-4 w-4 mr-2" weight="bold" />
            Contact
          </Button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)
