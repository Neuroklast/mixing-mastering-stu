import { logoutAdmin } from '@/app/admin/_actions/logout'

/** Legacy URL: a GET offers the logout action but never revokes a session. */
export default function LogoutPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <form action={logoutAdmin} className="space-y-4 text-center">
        <h1 className="text-lg font-semibold">Sign out of Admin?</h1>
        <button type="submit" className="rounded bg-violet-700 px-5 py-3 font-medium hover:bg-violet-600">
          Sign out
        </button>
      </form>
    </main>
  )
}
