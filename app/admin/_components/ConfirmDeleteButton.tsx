'use client'

import { useRef } from 'react'

interface ConfirmDeleteButtonProps {
  action: () => void
  message?: string
}

/**
 * Wraps a server action delete in a window.confirm dialog.
 * Usage:
 *   <ConfirmDeleteButton action={deleteItem.bind(null, id)} />
 */
export default function ConfirmDeleteButton({
  action,
  message = 'Delete this item? This cannot be undone.',
}: ConfirmDeleteButtonProps) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form ref={formRef} action={action}>
      <button
        type="button"
        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
        onClick={() => {
          if (window.confirm(message)) {
            formRef.current?.requestSubmit()
          }
        }}
      >
        Delete
      </button>
    </form>
  )
}
