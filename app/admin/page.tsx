import Link from 'next/link'

const COLLECTIONS = ['showcase', 'gallery', 'reviews', 'credits', 'legal', 'media']

export default function AdminDashboard() {
  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {COLLECTIONS.map((col) => (
          <Link
            key={col}
            href={`/admin/${col}`}
            style={{
              display: 'block',
              padding: '1.5rem',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#fff',
              textTransform: 'capitalize',
              fontWeight: 600,
            }}
          >
            {col}
          </Link>
        ))}
      </div>
    </div>
  )
}
