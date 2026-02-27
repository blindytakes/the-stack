import type { NextConfig } from 'next';

const nextConfig = {
  experimental: {
    instrumentationHook: true
  }
} as unknown as NextConfig;

export default nextConfig;
