/**
 * @deprecated Use /legal/privacy instead. This route is kept as a redirect
 * for backward compatibility with old links.
 */
import { redirect } from 'next/navigation'

export default function DatenschutzRedirectPage(): never {
  redirect('/legal/privacy')
}
