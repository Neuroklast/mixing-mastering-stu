import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service – SONORATIVA',
  description: 'Terms and conditions for using SONORATIVA audio engineering services.',
}

export default function TermsPage(): JSX.Element {
  const lastUpdated = '2026-05-01'

  return (
    <article className="prose-legal">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tighter font-heading mb-2">
        Terms of Service
      </h1>
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-10">
        Last updated: {lastUpdated}
      </p>

      <Section title="1. Acceptance of Terms">
        <p>
          By accessing or using the SONORATIVA website (&ldquo;Site&rdquo;) or submitting a
          service request, you agree to be bound by these Terms of Service
          (&ldquo;Terms&rdquo;). If you do not agree, please do not use the Site.
        </p>
      </Section>

      <Section title="2. Services">
        <p>
          SONORATIVA offers professional audio mixing and mastering services
          (&ldquo;Services&rdquo;). The scope, pricing, and deliverables for each engagement
          are agreed individually via a written quote or order confirmation.
        </p>
        <p>
          We reserve the right to refuse a service request at our discretion, for example if
          the submitted material violates Section 5 below.
        </p>
      </Section>

      <Section title="3. Payment">
        <ul>
          <li>All prices are quoted in USD unless otherwise stated.</li>
          <li>Full payment is due before delivery of final files, unless agreed otherwise.</li>
          <li>Payments are non-refundable once processing has commenced.</li>
          <li>
            We reserve the right to adjust pricing at any time; confirmed orders are
            honoured at the quoted price.
          </li>
        </ul>
      </Section>

      <Section title="4. Revisions">
        <p>
          Revision allowances are stated per service package (e.g. &ldquo;Up to 3
          revisions&rdquo;). Revisions must be requested within <strong>14 days</strong> of
          delivery. Additional revisions beyond the included allowance may be invoiced
          separately.
        </p>
      </Section>

      <Section title="5. Client Responsibilities and Content">
        <ul>
          <li>
            You confirm that you own or have the necessary licences for all audio material
            submitted to us.
          </li>
          <li>
            You must not submit material that infringes third-party intellectual property
            rights, is defamatory, or violates applicable law.
          </li>
          <li>
            You are responsible for providing stems/sessions in the agreed format and
            quality. Re-submission of incorrectly formatted files may incur additional
            charges.
          </li>
        </ul>
      </Section>

      <Section title="6. Intellectual Property">
        <p>
          Upon full payment, you receive a licence to use the finished mix/master
          commercially. SONORATIVA retains the right to reference the project in its
          portfolio (artist name, track title, service type) unless you request otherwise
          in writing.
        </p>
        <p>
          All production techniques, signal processing chains, and know-how remain the
          intellectual property of SONORATIVA.
        </p>
      </Section>

      <Section title="7. Confidentiality">
        <p>
          Both parties agree to keep all non-public creative and business information
          shared during the engagement confidential. This does not apply to information
          that is or becomes publicly available through no fault of the receiving party.
        </p>
      </Section>

      <Section title="8. Turnaround and Delays">
        <p>
          Estimated turnaround times are provided in good faith and are not contractually
          guaranteed unless expressly stated in writing. We are not liable for delays caused
          by late submission of materials or factors outside our control.
        </p>
      </Section>

      <Section title="9. Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, SONORATIVA shall not be liable
          for any indirect, incidental, special, or consequential damages arising from your
          use of the Services or the Site.
        </p>
        <p>
          Our total liability for any claim arising from a specific order shall not exceed
          the amount paid for that order.
        </p>
      </Section>

      <Section title="10. Disclaimer of Warranties">
        <p>
          The Site and Services are provided &ldquo;as is&rdquo; without warranty of any
          kind, express or implied. We do not warrant that the Site will be uninterrupted or
          error-free.
        </p>
      </Section>

      <Section title="11. Governing Law">
        <p>
          These Terms are governed by and construed in accordance with applicable law. Any
          dispute shall be resolved through good-faith negotiation before pursuing formal
          legal remedies.
        </p>
      </Section>

      <Section title="12. Changes to These Terms">
        <p>
          We may update these Terms at any time. The &ldquo;Last updated&rdquo; date at the
          top will reflect any changes. Continued use of the Site after changes constitutes
          acceptance of the revised Terms.
        </p>
      </Section>

      <Section title="13. Contact">
        <p>For questions about these Terms, contact us at:</p>
        <address className="not-italic font-mono text-sm text-muted-foreground mt-2 space-y-1">
          <p>SONORATIVA</p>
          <p>
            E-mail:{' '}
            <a href="mailto:legal@sonorativa.com" className="underline underline-offset-2">
              legal@sonorativa.com
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
