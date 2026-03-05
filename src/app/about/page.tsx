import type { Metadata } from 'next';
import { AboutContent } from './about-content';

export const metadata: Metadata = {
  title: 'How The Stack Works',
  description:
    'Learn why The Stack exists, who it is for, and how its tools and guides help you make smarter card and banking decisions.'
};

export default function AboutPage() {
  return <AboutContent />;
}
