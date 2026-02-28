'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

type NewsletterSignupProps = {
  source?: string;
  heading?: string;
  description?: string;
  compact?: boolean;
};

export function NewsletterSignup({
  source = 'homepage',
  heading = 'Stay in the loop',
  description = 'Get weekly card picks and strategy — no spam, ever.',
  compact = false
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source })
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.error ?? 'Something went wrong.');
        return;
      }

      setStatus('success');
      setMessage(data.message);
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Could not connect. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <p className="text-sm text-brand-teal">{message}</p>
      </motion.div>
    );
  }

  return (
    <div>
      {!compact && (
        <>
          <h3 className="font-[var(--font-heading)] text-2xl text-text-primary">{heading}</h3>
          <p className="mt-2 text-sm text-text-secondary">{description}</p>
        </>
      )}
      <form onSubmit={handleSubmit} className={`flex gap-3 ${compact ? '' : 'mt-4'}`}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          required
          className="flex-1 rounded-full border border-white/10 bg-bg-surface px-4 py-2 text-sm text-text-primary placeholder:text-text-muted transition focus:border-brand-teal focus:outline-none"
        />
        <Button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Joining...' : 'Subscribe'}
        </Button>
      </form>
      {status === 'error' && (
        <p className="mt-2 text-sm text-brand-coral">{message}</p>
      )}
    </div>
  );
}
