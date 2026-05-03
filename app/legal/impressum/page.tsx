import type { Metadata } from 'next'
import { getLegalPageBySlug } from '@/services/legalService'

export const metadata: Metadata = {
  title: 'Impressum – SONORATIVA',
  description: 'Impressum und gesetzlich vorgeschriebene Informationen gemäß § 5 TMG.',
}

export default async function ImpressumPage(): Promise<JSX.Element> {
  const result = await getLegalPageBySlug('impressum')

  if (!result.success) {
    return (
      <article className="prose-legal">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter font-heading mb-2">
          Impressum
        </h1>
        <p className="text-sm text-muted-foreground font-mono mt-6">
          Diese Seite wird gerade aktualisiert. Bitte versuchen Sie es später erneut.
        </p>
      </article>
    )
  }

  const page = result.data

  return (
    <article className="prose-legal">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tighter font-heading mb-2">
        {page.title}
      </h1>
      {page.lastUpdated && (
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-10">
          Zuletzt aktualisiert: {page.lastUpdated}
        </p>
      )}
      <div
        className="space-y-3 text-sm text-muted-foreground leading-relaxed
          [&_h2]:text-lg [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:font-heading
          [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3
          [&_p]:mt-3 [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2
          [&_a:hover]:text-accent [&_strong]:text-foreground"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </article>
  )
}
