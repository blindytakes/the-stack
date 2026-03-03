export type AppNodeEnv = 'development' | 'test' | 'production';

export function getNodeEnv(): AppNodeEnv {
  const raw = process.env.NODE_ENV;
  if (raw === 'production' || raw === 'test') return raw;
  return 'development';
}

export function isProductionEnv(): boolean {
  return getNodeEnv() === 'production';
}

export function isDevelopmentEnv(): boolean {
  return getNodeEnv() === 'development';
}
