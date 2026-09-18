'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { forgotPasswordSchema } from '@/lib/schemas/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsed = forgotPasswordSchema.safeParse({ email })
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid email address')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        parsed.data.email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
        },
      )
      if (resetError) {
        setError(resetError.message)
        setLoading(false)
        return
      }
    } catch (err) {
      console.error('[auth] password reset request failed:', err)
      setError('Unable to send the reset email. Please try again later.')
      setLoading(false)
      return
    }

    setLoading(false)
    setSent(true)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
      <div style={{ width: '100%', maxWidth: '380px', padding: '2rem', background: '#111', border: '1px solid #222', borderRadius: '12px' }}>
        <h1 style={{ marginBottom: '1.5rem', color: '#fff', fontSize: '1.5rem' }}>Reset Password</h1>

        {sent ? (
          <>
            <p style={{ color: '#4ade80', marginBottom: '1rem', fontSize: '0.9rem' }}>
              If an account exists for that email, we sent a password reset link.
            </p>
            <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              Check your inbox and spam folder. The link expires after a short time.
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: '#888', marginBottom: '1rem', fontSize: '0.85rem' }}>
              Enter your admin email and we will send you a reset link.
            </p>
            {error && <p style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', color: '#aaa', fontSize: '0.85rem' }}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p style={{ marginTop: '1.5rem', marginBottom: 0, fontSize: '0.85rem' }}>
          <Link href="/admin/login" style={{ color: '#a78bfa' }}>Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
