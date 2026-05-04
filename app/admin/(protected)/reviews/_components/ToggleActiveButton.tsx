'use client'

import { toggleReviewActive } from '../_actions'

interface ToggleActiveButtonProps {
  id: string
  active: boolean
}

export default function ToggleActiveButton({ id, active }: ToggleActiveButtonProps) {
  const action = toggleReviewActive.bind(null, id, !active)

  return (
    <form action={action} style={{ display: 'inline' }}>
      <button
        type="submit"
        title={active ? 'Click to deactivate (hide from public)' : 'Click to activate (show on public site)'}
        style={{
          background: 'none',
          border: '1px solid',
          borderColor: active ? '#166534' : '#555',
          borderRadius: '4px',
          color: active ? '#4ade80' : '#888',
          cursor: 'pointer',
          fontSize: '0.75rem',
          padding: '0.2rem 0.5rem',
          fontWeight: 500,
        }}
      >
        {active ? '● Live' : '○ Hidden'}
      </button>
    </form>
  )
}
