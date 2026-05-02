import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy – SONORATIVA',
  description: 'How SONORATIVA collects, uses, and protects your personal information.',
}

export default function PrivacyPage(): JSX.Element {
  const lastUpdated = '2026-05-01'

  return (
    <article className="prose-legal">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tighter font-heading mb-2">
        Privacy Policy
      </h1>
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-10">
        Last updated: {lastUpdated}
      </p>

      <Section title="1. Introduction">
        <p>
          SONORATIVA (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is a professional
          audio engineering service. This Privacy Policy explains what personal data we collect
          when you use our website at <strong>sonorativa.com</strong> (&ldquo;Site&rdquo;),
          why we collect it, and how we protect it.
        </p>
        <p>
          By using the Site you agree to the collection and use of information in accordance
          with this policy.
        </p>
      </Section>

      <Section title="2. Data We Collect">
        <h3 className="text-base font-bold mt-4 mb-2 font-heading">2.1 Information You Provide</h3>
        <ul>
          <li>
            <strong>Contact / order form:</strong> name, e-mail address, selected service, genre,
            and any additional notes you submit when requesting a quote.
          </li>
        </ul>

        <h3 className="text-base font-bold mt-4 mb-2 font-heading">2.2 Automatically Collected Data</h3>
        <ul>
          <li>
            <strong>Essential cookies:</strong> a single first-party cookie that stores your
            cookie-consent preference. No third-party tracking cookies are set.
          </li>
          <li>
            <strong>Server logs:</strong> standard web-server logs (IP address, browser
            user-agent, requested URL, timestamp) for security and operational monitoring.
            Logs are retained for 30 days.
          </li>
        </ul>

        <h3 className="text-base font-bold mt-4 mb-2 font-heading">2.3 Audio Samples</h3>
        <p>
          Demo audio files played through the on-site player are streamed from our servers.
          No audio data is recorded from your microphone.
        </p>
      </Section>

      <Section title="3. How We Use Your Data">
        <ul>
          <li>To respond to your service enquiry and deliver the requested services.</li>
          <li>To communicate about your order status.</li>
          <li>To improve the Site&apos;s performance and security.</li>
        </ul>
        <p>
          We do not sell, rent, or share your personal data with third parties for marketing
          purposes.
        </p>
      </Section>

      <Section title="4. Legal Basis (GDPR)">
        <p>
          If you are located in the European Economic Area (EEA), we process your data on the
          following legal bases:
        </p>
        <ul>
          <li>
            <strong>Contract performance</strong> (Art. 6(1)(b) GDPR) — processing necessary
            to deliver the audio engineering service you requested.
          </li>
          <li>
            <strong>Legitimate interests</strong> (Art. 6(1)(f) GDPR) — server logs used for
            security and fraud prevention.
          </li>
          <li>
            <strong>Consent</strong> (Art. 6(1)(a) GDPR) — for any non-essential cookies
            (currently none are used).
          </li>
        </ul>
      </Section>

      <Section title="5. Data Retention">
        <p>
          Order and contact data is retained for the duration of the service relationship and
          for up to <strong>6 years</strong> thereafter for accounting and legal compliance
          purposes. You may request deletion at any time (see Section 7).
        </p>
      </Section>

      <Section title="6. Third-Party Services">
        <p>
          We use the following sub-processors to operate the Site:
        </p>
        <ul>
          <li><strong>Supabase</strong> — database and file storage (EU region).</li>
          <li>
            <strong>Sentry</strong> — error monitoring (data is anonymised where possible).
          </li>
          <li>
            <strong>Google Fonts</strong> — font delivery via CDN (your IP is transmitted to
            Google; see{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Google Privacy Policy
            </a>
            ).
          </li>
        </ul>
      </Section>

      <Section title="7. Your Rights">
        <p>
          Under applicable data protection law (including GDPR) you have the right to:
        </p>
        <ul>
          <li>Access a copy of your personal data.</li>
          <li>Correct inaccurate or incomplete data.</li>
          <li>Request deletion of your data (&ldquo;right to be forgotten&rdquo;).</li>
          <li>Object to or restrict processing.</li>
          <li>Data portability (receive your data in a machine-readable format).</li>
          <li>Withdraw consent at any time (where processing is based on consent).</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:privacy@sonorativa.com" className="underline underline-offset-2">
            privacy@sonorativa.com
          </a>
          . We will respond within 30 days.
        </p>
      </Section>

      <Section title="8. Cookies">
        <p>
          We use only <strong>essential, first-party cookies</strong>:
        </p>
        <table className="w-full text-sm border-collapse mt-3">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 font-mono uppercase text-xs tracking-wider">Name</th>
              <th className="text-left py-2 pr-4 font-mono uppercase text-xs tracking-wider">Purpose</th>
              <th className="text-left py-2 font-mono uppercase text-xs tracking-wider">Expires</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4 font-mono text-xs">sonorativa-cookie-consent</td>
              <td className="py-2 pr-4 text-muted-foreground text-xs">Stores your cookie consent choice</td>
              <td className="py-2 text-muted-foreground text-xs">Session (localStorage)</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4 font-mono text-xs">ios-audio-hint-dismissed</td>
              <td className="py-2 pr-4 text-muted-foreground text-xs">Hides the iOS silent-switch hint once dismissed</td>
              <td className="py-2 text-muted-foreground text-xs">Session (sessionStorage)</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3">No analytics, advertising, or third-party tracking cookies are used.</p>
      </Section>

      <Section title="9. Security">
        <p>
          We implement appropriate technical and organisational measures to protect your
          personal data from unauthorised access, disclosure, alteration, or destruction.
          All data in transit is encrypted using TLS 1.2 or higher.
        </p>
      </Section>

      <Section title="10. Children">
        <p>
          The Site is not directed at children under 13 years of age. We do not knowingly
          collect personal data from children.
        </p>
      </Section>

      <Section title="11. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. The &ldquo;Last updated&rdquo;
          date at the top will reflect any changes. Continued use of the Site after changes
          constitutes acceptance of the updated policy.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          If you have questions about this Privacy Policy or wish to exercise your rights,
          please contact:
        </p>
        <address className="not-italic font-mono text-sm text-muted-foreground mt-2 space-y-1">
          <p>SONORATIVA</p>
          <p>
            E-mail:{' '}
            <a href="mailto:privacy@sonorativa.com" className="underline underline-offset-2">
              privacy@sonorativa.com
            </a>
          </p>
        </address>
      </Section>
    </article>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}): JSX.Element {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold tracking-tight font-heading mb-3 pb-2 border-b border-border">
        {title}
      </h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-foreground [&_a]:text-foreground">
        {children}
      </div>
    </section>
  )
}
