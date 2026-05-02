'use client'

/**
 * BaseModal – single source of truth for all modal overlays in SONORATIVA.
 *
 * Design tokens: black/white/red CI, backdrop-blur, border-border, bg-card.
 * Variants:
 *   'center' – centred overlay, max-w-lg (default; use for forms, confirmations)
 *   'wide'   – top-aligned overlay, max-w-6xl, overflow-y-auto (use for full-page panels)
 *
 * Both variants share:
 *   - Radix Dialog primitives (focus trap, ESC, aria-modal, aria-labelledby)
 *   - Identical backdrop (bg-black/85 backdrop-blur-md)
 *   - Identical close button (top-right, ✕)
 *   - SONORATIVA border / bg tokens
 *   - Framer-motion-like enter/exit via Radix data-state animations
 */

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

// ── Re-export primitives so consumers stay decoupled from Radix ───────────────
export const BaseModalRoot = DialogPrimitive.Root
export const BaseModalTrigger = DialogPrimitive.Trigger
export const BaseModalClose = DialogPrimitive.Close

// ── Shared backdrop ───────────────────────────────────────────────────────────
const BaseModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/85 backdrop-blur-md',
      'data-[state=open]:animate-in data-[state=open]:fade-in-0',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
      className,
    )}
    {...props}
  />
))
BaseModalOverlay.displayName = 'BaseModalOverlay'

// ── Close button ─────────────────────────────────────────────────────────────
const BaseModalCloseButton = (): JSX.Element => (
  <DialogPrimitive.Close
    className={cn(
      'absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded',
      'border border-border text-muted-foreground',
      'transition-colors hover:border-white/40 hover:text-white',
      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card',
      'disabled:pointer-events-none',
    )}
    aria-label="Close"
  >
    <X weight="bold" className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </DialogPrimitive.Close>
)

// ── Variant config ─────────────────────────────────────────────────────────────
type ModalVariant = 'center' | 'wide'

const VARIANT_CONTENT_CLASS: Record<ModalVariant, string> = {
  center:
    'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto' +
    ' bg-card border border-border rounded p-6 shadow-2xl' +
    ' data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]' +
    ' data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]' +
    ' duration-200',
  wide:
    'fixed left-1/2 top-[5vh] z-50 w-full max-w-6xl -translate-x-1/2 max-h-[90vh] overflow-y-auto' +
    ' bg-card border border-border rounded p-8 md:p-12 shadow-2xl' +
    ' data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-4' +
    ' data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-4' +
    ' duration-200',
}

// ── BaseModalContent ──────────────────────────────────────────────────────────
export interface BaseModalContentProps
  extends Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, 'title'> {
  variant?: ModalVariant
}

export const BaseModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  BaseModalContentProps
>(({ className, children, variant = 'center', ...props }, ref) => (
  <DialogPrimitive.Portal>
    <BaseModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(VARIANT_CONTENT_CLASS[variant], className)}
      {...props}
    >
      {children}
      <BaseModalCloseButton />
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
BaseModalContent.displayName = 'BaseModalContent'

// ── Header (title + optional description) ────────────────────────────────────
export const BaseModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element => (
  <div className={cn('mb-6 pr-8', className)} {...props} />
)
BaseModalHeader.displayName = 'BaseModalHeader'

export const BaseModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-2xl font-bold tracking-tighter uppercase font-heading',
      className,
    )}
    {...props}
  />
))
BaseModalTitle.displayName = 'BaseModalTitle'

export const BaseModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('mt-1 font-mono text-sm text-muted-foreground', className)}
    {...props}
  />
))
BaseModalDescription.displayName = 'BaseModalDescription'

// ── Convenience compound export ───────────────────────────────────────────────
export const BaseModal = {
  Root: BaseModalRoot,
  Trigger: BaseModalTrigger,
  Content: BaseModalContent,
  Header: BaseModalHeader,
  Title: BaseModalTitle,
  Description: BaseModalDescription,
  Close: BaseModalClose,
}
