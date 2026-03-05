import type { Metadata } from 'next';
import { AboutContent } from './about-content';

export const metadata: Metadata = {
  title: 'About',
  description: 'How The Stack works, how we evaluate cards, and how we make money.'
};

export default function AboutPage() {
  return <AboutContent />;
}
