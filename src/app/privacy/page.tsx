import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How The Stack collects, uses, and protects data.'
};

export default function PrivacyPage() {
  const supportEmail = process.env.SUPPORT_EMAIL?.trim();

  return (
    <div className="container-page pt-12 pb-16 max-w-3xl">
      <h1 className="font-[var(--font-heading)] text-4xl text-text-primary">Privacy Policy</h1>
      <p className="mt-4 text-sm text-text-muted">Last updated: March 1, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-7 text-text-secondary">
        <section>
          <h2 className="text-base font-semibold text-text-primary">Information we collect</h2>
          <p>
            We collect information you provide directly (for example, newsletter signups), and
            technical/usage data generated through normal use of the site.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Contact data: email address submitted for newsletter delivery.</li>
            <li>Device and usage data: page views, events, browser/device metadata, and referrer.</li>
            <li>Operational data: logs and diagnostics needed for security and reliability.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Cookies and tracking</h2>
          <p>
            We use analytics technologies (including PostHog) to measure product performance and
            improve user experience. Depending on your browser and region, this may involve cookies
            or similar identifiers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">How we use information</h2>
          <p>
            We use data to operate and improve the product, deliver newsletter content, prevent
            abuse, monitor system health, and analyze usage trends.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Legal bases (where applicable)</h2>
          <p>
            Where required by law, we process personal data based on one or more of these legal
            grounds: consent, legitimate interests, contractual necessity, and legal obligations.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Sharing and processors</h2>
          <p>
            We do not sell personal information. We may use service providers for email delivery,
            hosting, and analytics under contractual protections.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Hosting and infrastructure providers.</li>
            <li>Email delivery and audience management providers.</li>
            <li>Analytics and observability vendors.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Retention</h2>
          <p>
            We retain personal data only as long as reasonably necessary for the purposes described
            above, including legal, accounting, and security needs.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Your privacy rights</h2>
          <p>
            Depending on your jurisdiction (including GDPR and CCPA/CPRA), you may have rights to
            access, correct, delete, restrict, or export your data, and to object to certain
            processing activities.
          </p>
          <p className="mt-2">
            To make a request, contact us at{' '}
            {supportEmail ? (
              <a href={`mailto:${supportEmail}`} className="text-brand-teal hover:opacity-90">
                {supportEmail}
              </a>
            ) : (
              <span className="text-text-muted">
                our support channel (set <code>SUPPORT_EMAIL</code> to publish).
              </span>
            )}
            {!supportEmail ? '' : '.'}
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Children&apos;s privacy</h2>
          <p>
            This site is not directed to children under 13, and we do not knowingly collect
            personal information from children under 13 (COPPA).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Policy updates</h2>
          <p>
            We may update this policy from time to time. Material changes will be reflected by an
            updated effective date on this page.
          </p>
        </section>
      </div>
    </div>
  );
}
