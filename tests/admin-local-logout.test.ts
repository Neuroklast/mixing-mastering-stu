import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('admin logout safety contract', () => {
  it('never logs out in a GET page render', () => {
    const page = read('app/admin/logout/page.tsx')
    expect(page).not.toContain('auth.signOut(')
    expect(page).toContain('form action={logoutAdmin}')
  })
  it('uses a session-local POST server action', () => {
    const action = read('app/admin/_actions/logout.ts')
    expect(action).toContain("'use server'")
    expect(action).toContain("auth.signOut({ scope: 'local' })")
    expect(action).toContain('if (error)')
  })
  it('uses explicit forms rather than prefetchable logout links on both layouts', () => {
    const nav = read('app/admin/_components/AdminNav.tsx')
    expect(nav.split('action={logoutAdmin}')).toHaveLength(3)
    expect(nav).not.toContain('href="/admin/logout"')
  })
  it('ends password-recovery session locally and checks upstream failures', () => {
    const reset = read('app/auth/reset-password/page.tsx')
    expect(reset).toContain("auth.signOut({ scope: 'local' })")
    expect(reset).toContain('if (signOutError)')
  })
})
