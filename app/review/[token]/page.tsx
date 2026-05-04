import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { submitReviewViaToken } from './_actions'

const SERVICE_LABELS: Record<string, string> = {
  Mix: 'Mixing',
  Master: 'Mastering',
  'Mix & Master': 'Mixing & Mastering',
  Producing: 'Producing',
}

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { token } = await params
  const sp = await searchParams
  const success = sp.success === '1'
  const error = sp.error

  const supabase = createAdminClient()
  const { data: invite } = await supabase
    .from('review_invites')
    .select('id, client_name, service, used_at, expires_at')
    .eq('token', token)
    .single()

  if (!invite) notFound()

  const expired =
    invite.expires_at && new Date(invite.expires_at as string) < new Date()
  const alreadyUsed = Boolean(invite.used_at)

  const submitAction = submitReviewViaToken.bind(null, token)

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0d0d0d',
        color: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: '540px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', fontWeight: 600, marginBottom: '0.5rem' }}>
            SONORATIVA
          </p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Share Your Experience
          </h1>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            Hi {String(invite.client_name)}, we&apos;d love to hear how your{' '}
            {invite.service ? (SERVICE_LABELS[String(invite.service)] ?? String(invite.service)) : 'session'}{' '}
            turned out.
          </p>
        </div>

        {/* Success state */}
        {success && (
          <div style={{ padding: '1.5rem', background: '#052e16', border: '1px solid #166534', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎉</p>
            <h2 style={{ color: '#4ade80', marginBottom: '0.5rem' }}>Thank you!</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
              Your review has been submitted and will go live after a quick check.
              We really appreciate you taking the time.
            </p>
          </div>
        )}

        {/* Error: already used */}
        {!success && (alreadyUsed || error === 'already_used') && (
          <div style={{ padding: '1.5rem', background: '#1c1000', border: '1px solid #78350f', borderRadius: '8px', textAlign: 'center' }}>
            <h2 style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>Already submitted</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
              This review link has already been used. Each link can only be used once.
            </p>
          </div>
        )}

        {/* Error: expired */}
        {!success && !alreadyUsed && (expired || error === 'expired') && (
          <div style={{ padding: '1.5rem', background: '#1c0000', border: '1px solid #7f1d1d', borderRadius: '8px', textAlign: 'center' }}>
            <h2 style={{ color: '#f87171', marginBottom: '0.5rem' }}>Link expired</h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
              This review link has expired. Please contact us if you still want to leave a review.
            </p>
          </div>
        )}

        {/* Review form */}
        {!success && !alreadyUsed && !expired && error !== 'expired' && error !== 'already_used' && (
          <form
            action={submitAction}
            style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '2rem' }}
          >
            {/* Star rating */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.75rem', fontWeight: 500 }}>
                Rating *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="rating"
                      value={n}
                      required
                      style={{ position: 'absolute', opacity: 0, width: 0 }}
                    />
                    <span
                      style={{
                        display: 'inline-block',
                        width: '2.5rem',
                        height: '2.5rem',
                        lineHeight: '2.5rem',
                        textAlign: 'center',
                        borderRadius: '50%',
                        border: '2px solid #333',
                        fontSize: '1rem',
                        color: '#f5f5f5',
                        background: '#1a1a1a',
                      }}
                    >
                      {n}
                    </span>
                  </label>
                ))}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.4rem' }}>1 = poor · 5 = excellent</p>
            </div>

            {/* Review text */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.4rem', fontWeight: 500 }}>
                Your Review *
              </label>
              <textarea
                name="text"
                required
                rows={5}
                placeholder="Tell us what you thought about your experience…"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#f5f5f5',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Optional project link */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.4rem', fontWeight: 500 }}>
                Project Link <span style={{ color: '#555', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                name="project_link"
                type="url"
                placeholder="https://open.spotify.com/…"
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#f5f5f5',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.85rem',
                background: '#7c3aed',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Submit Review
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#444', marginTop: '2rem' }}>
          © {new Date().getFullYear()} SONORATIVA · Professional Audio Engineering
        </p>
      </div>
    </main>
  )
}
