'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(params.get('error') === 'forbidden' ? 'Access denied.' : '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const redirect = params.get('redirect') ?? '/admin'
    router.push(redirect)
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '380px', padding: '2rem', background: '#111', border: '1px solid #222', borderRadius: '12px' }}>
        <h1 style={{ marginBottom: '1.5rem', color: '#fff', fontSize: '1.5rem' }}>Admin Login</h1>
        {error && <p style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#aaa', fontSize: '0.85rem' }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
        />
        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#aaa', fontSize: '0.85rem' }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '0.75rem', background: '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
