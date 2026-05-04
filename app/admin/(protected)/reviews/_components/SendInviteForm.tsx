'use client'

import { useState } from 'react'
import { sendReviewInvite } from '../_actions'

const SERVICE_OPTIONS = ['Mix', 'Master', 'Mix & Master', 'Producing']

export default function SendInviteForm() {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const formData = new FormData(e.currentTarget)
    try {
      await sendReviewInvite(formData)
    } finally {
      setPending(false)
      setOpen(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.6rem',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '0.9rem',
    boxSizing: 'border-box' as const,
    marginBottom: '0.75rem',
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          padding: '0.6rem 1.2rem',
          background: 'transparent',
          border: '1px solid #7c3aed',
          borderRadius: '6px',
          color: '#7c3aed',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        ✉ Send Invite
      </button>
    )
  }

  return (
    <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '1.5rem', maxWidth: '480px' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#fff' }}>
        Send Review Invite
      </h2>
      <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
        The client will receive an email with a personal link to leave a review. The submitted review
        will be inactive by default — activate it from the list below once you&apos;ve reviewed it.
      </p>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.25rem' }}>
          Client Name *
        </label>
        <input name="client_name" required placeholder="e.g. Jane Smith" style={inputStyle} />

        <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.25rem' }}>
          Client Email *
        </label>
        <input name="client_email" type="email" required placeholder="jane@example.com" style={inputStyle} />

        <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.25rem' }}>
          Service
        </label>
        <select name="service" style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">— optional —</option>
          {SERVICE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
          <button
            type="submit"
            disabled={pending}
            style={{
              padding: '0.65rem 1.25rem',
              background: '#7c3aed',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: pending ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? 'Sending…' : 'Send Email'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              padding: '0.65rem 1.25rem',
              background: 'none',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#aaa',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
