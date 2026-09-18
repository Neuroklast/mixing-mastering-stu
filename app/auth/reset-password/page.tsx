'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { resetPasswordSchema } from '@/lib/schemas/auth'

type Status = 'checking' | 'ready' | 'invalid'

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      if (params.get('error')) {
        if (!cancelled) setStatus('invalid')
        return
      }

      try {
        const supabase = createClient()

        // Dashboard-sent recovery emails use the implicit flow and deliver
        // tokens in the URL hash. @supabase/ssr only supports PKCE, so the
        // client cannot auto-detect them — set the session manually.
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : ''
        const hashParams = new URLSearchParams(hash)
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          window.history.replaceState(null, '', window.location.pathname + window.location.search)
          if (cancelled) return
          setStatus(sessionError ? 'invalid' : 'ready')
          return
        }

        // App-sent recovery emails use PKCE; /auth/callback already
        // exchanged the code and stored the session in cookies.
        const { data } = await supabase.auth.getSession()
        if (cancelled) return
        setStatus(data.session ? 'ready' : 'invalid')
      } catch (err) {
        console.error('[auth] recovery session check failed:', err)
        if (!cancelled) setStatus('invalid')
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword })
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid input')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password: parsed.data.password,
      })
      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }
      await supabase.auth.signOut()
      router.push('/admin/login?reset=success')
      router.refresh()
    } catch (err) {
      console.error('[auth] password update failed:', err)
      setError('Unable to update the password. Please try again later.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
      <div style={{ width: '100%', maxWidth: '380px', padding: '2rem', background: '#111', border: '1px solid #222', borderRadius: '12px' }}>
        <h1 style={{ marginBottom: '1.5rem', color: '#fff', fontSize: '1.5rem' }}>Set New Password</h1>

        {status === 'checking' && <p style={{ color: '#aaa' }}>Checking your reset link…</p>}

        {status === 'invalid' && (
          <>
            <p style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.9rem' }}>
              This reset link is invalid or has expired.
            </p>
            <p style={{ marginBottom: 0, fontSize: '0.85rem' }}>
              <Link href="/auth/forgot-password" style={{ color: '#a78bfa' }}>Request a new link</Link>
            </p>
          </>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit}>
            {error && <p style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', color: '#aaa', fontSize: '0.85rem' }}>New password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
            />
            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem', color: '#aaa', fontSize: '0.85rem' }}>Confirm new password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#aaa' }}>Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
