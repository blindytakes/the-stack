import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms governing use of The Stack.'
};

export default function TermsPage() {
  const supportEmail = process.env.SUPPORT_EMAIL?.trim();

  return (
    <div className="container-page pt-12 pb-16 max-w-3xl">
      <h1 className="font-[var(--font-heading)] text-4xl text-text-primary">Terms of Use</h1>
      <p className="mt-4 text-sm text-text-muted">Last updated: March 1, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-7 text-text-secondary">
        <section>
          <h2 className="text-base font-semibold text-text-primary">Acceptance of terms</h2>
          <p>
            By accessing or using The Stack, you agree to these Terms of Use. If you do not agree,
            do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Educational content only</h2>
          <p>
            The Stack provides educational information and product comparisons. Nothing on this
            site is legal, tax, investment, or individualized financial advice.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Accuracy and availability</h2>
          <p>
            We work to keep data current, but card offers and terms change quickly. You are
            responsible for confirming details with issuers before applying.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Acceptable use</h2>
          <p>
            You agree not to misuse the service, attempt unauthorized access, or interfere with
            normal operation.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Intellectual property</h2>
          <p>
            The Stack name, branding, content selection, and software are protected by applicable
            intellectual property laws. Except where expressly permitted, you may not copy,
            republish, or distribute site content for commercial use.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Affiliate relationships</h2>
          <p>
            Some outbound links are affiliate links and may result in compensation. This does not
            create a fiduciary relationship between you and The Stack.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Liability limits</h2>
          <p>
            The Stack is provided on an &quot;as is&quot; basis. To the maximum extent permitted by
            law, we disclaim liability for indirect or consequential damages.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless The Stack for claims arising from your misuse
            of the service or your violation of these terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Termination</h2>
          <p>
            We may suspend or terminate access at any time if we believe you are violating these
            terms or creating operational or legal risk.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Governing law</h2>
          <p>
            These terms are governed by the laws of the State of New York, without regard to
            conflict-of-law principles.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Changes to terms</h2>
          <p>
            We may update these terms periodically. Continued use of the service after changes are
            posted constitutes acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Contact</h2>
          <p>
            Questions about these terms can be sent to{' '}
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
      </div>
    </div>
  );
}
