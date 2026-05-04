'use client'

/**
 * BaseModal – single source of truth for all modal overlays in SONORATIVA.
 *
 * Design tokens: black/white/red CI, backdrop-blur, border-border, bg-card.
 * Use the `size` prop to control max-width:
 *   'md'  – max-w-lg   (default; forms, confirmations)
 *   'lg'  – max-w-2xl  (medium panels)
 *   'xl'  – max-w-6xl  (full-page panels such as Service Packages)
 *
 * All sizes share:
 *   - Radix Dialog primitives (focus trap, ESC, aria-modal, aria-labelledby)
 *   - Identical backdrop (bg-black/85 backdrop-blur-md)
 *   - Identical close button (top-right, ✕, 8×8 touch target)
 *   - Same bg-card / border / rounded / padding / shadow tokens
 *   - Same enter/exit animation (fade + zoom)
 *
 * Legacy `variant` prop is still accepted for backwards-compatibility but
 * ignored — use `size` instead.
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

// ── Size config ────────────────────────────────────────────────────────────────
type ModalSize = 'md' | 'lg' | 'xl'

/** Max-width class per size. The rest of the shell is identical. */
const SIZE_MAX_W: Record<ModalSize, string> = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-6xl',
}

/** Shared shell classes applied to every BaseModalContent. */
const SHELL_CLASS =
  'fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto' +
  ' bg-card border border-border rounded-lg p-6 md:p-8 shadow-2xl' +
  ' data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95' +
  ' data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]' +
  ' data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95' +
  ' data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]' +
  ' duration-200'

// ── BaseModalContent ──────────────────────────────────────────────────────────
export interface BaseModalContentProps
  extends Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, 'title'> {
  /** Controls max-width. Default 'md'. */
  size?: ModalSize
  /**
   * @deprecated Use `size` instead. Kept for backwards-compatibility.
   * 'wide' maps to size='xl', 'center' maps to size='md'.
   */
  variant?: 'center' | 'wide'
}

export const BaseModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  BaseModalContentProps
>(({ className, children, size, variant, ...props }, ref) => {
  // Resolve size: explicit `size` wins; otherwise map legacy `variant`
  const resolvedSize: ModalSize =
    size ?? (variant === 'wide' ? 'xl' : 'md')

  return (
    <DialogPrimitive.Portal>
      <BaseModalOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(SHELL_CLASS, SIZE_MAX_W[resolvedSize], className)}
        {...props}
      >
        {children}
        <BaseModalCloseButton />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})
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
