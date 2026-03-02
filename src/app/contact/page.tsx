import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact The Stack.'
};

export default function ContactPage() {
  const supportEmail = process.env.SUPPORT_EMAIL?.trim();

  return (
    <div className="container-page pt-12 pb-16 max-w-3xl">
      <h1 className="font-[var(--font-heading)] text-4xl text-text-primary">Contact</h1>
      <p className="mt-4 text-text-secondary">
        For support, corrections, data requests, or partnership inquiries, email:
      </p>
      {supportEmail ? (
        <a
          href={`mailto:${supportEmail}`}
          className="mt-3 inline-block text-brand-teal transition hover:opacity-90"
        >
          {supportEmail}
        </a>
      ) : (
        <p className="mt-3 text-sm text-text-muted">
          Support contact is not configured yet. Set <code>SUPPORT_EMAIL</code> to enable.
        </p>
      )}
    </div>
  );
}
