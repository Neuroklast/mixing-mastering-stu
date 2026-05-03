'use client'

import {
  BaseModal,
  BaseModalContent,
  BaseModalHeader,
  BaseModalTitle,
  BaseModalDescription,
} from '@/components/ui/base-modal'
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
  <BaseModal.Root open={open} onOpenChange={onOpenChange}>
    <BaseModalContent size="xl" aria-describedby="services-modal-desc">
      <BaseModalHeader>
        <BaseModalTitle className="text-3xl md:text-4xl">
          Service Packages
        </BaseModalTitle>
        <BaseModalDescription id="services-modal-desc">
          Professional audio engineering with dedicated support.
        </BaseModalDescription>
      </BaseModalHeader>
      <ServicesSection onSelectPackage={onSelectPackage} />
    </BaseModalContent>
  </BaseModal.Root>
)
