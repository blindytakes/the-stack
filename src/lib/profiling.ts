import { getPyroscopeEnvStatus } from '@/lib/observability-config';

type PyroscopeModule = {
  init: (config: {
    appName: string;
    authToken?: string;
    basicAuthPassword?: string;
    basicAuthUser?: string;
    serverAddress: string;
    tags?: Record<string, string>;
    wall?: {
      collectCpuTime?: boolean;
    };
  }) => void;
  start: () => void;
};

let pyroscopeStarted = false;

function readTrimmedEnv(name: string) {
  return process.env[name]?.trim() || undefined;
}

function collectTags() {
  const tags: Record<string, string> = {
    runtime: 'nodejs'
  };

  const environment = readTrimmedEnv('VERCEL_ENV') || readTrimmedEnv('NODE_ENV');
  const region = readTrimmedEnv('VERCEL_REGION') || readTrimmedEnv('AWS_REGION');
  const branch = readTrimmedEnv('VERCEL_GIT_COMMIT_REF');

  if (environment) tags.environment = environment;
  if (region) tags.region = region;
  if (branch) tags.branch = branch;

  return tags;
}

export async function registerPyroscopeProfiling() {
  const pyroscopeEnv = getPyroscopeEnvStatus();

  if (!pyroscopeEnv.enabled) {
    return;
  }

  if (pyroscopeStarted) {
    return;
  }

  if (!pyroscopeEnv.configured) {
    console.warn('[pyroscope] Profiling is enabled but Pyroscope env vars are incomplete.', {
      serverAddressConfigured: pyroscopeEnv.serverAddressConfigured,
      authConfigured: pyroscopeEnv.authConfigured,
      applicationName: pyroscopeEnv.applicationName
    });
    return;
  }

  const serverAddress = readTrimmedEnv('PYROSCOPE_ADHOC_SERVER_ADDRESS') || readTrimmedEnv('PYROSCOPE_SERVER_ADDRESS');

  if (!serverAddress) {
    return;
  }

  try {
    const Pyroscope = (await import('@pyroscope/nodejs')) as PyroscopeModule;

    Pyroscope.init({
      appName: pyroscopeEnv.applicationName,
      authToken: readTrimmedEnv('PYROSCOPE_AUTH_TOKEN'),
      basicAuthUser: readTrimmedEnv('PYROSCOPE_BASIC_AUTH_USER'),
      basicAuthPassword: readTrimmedEnv('PYROSCOPE_BASIC_AUTH_PASSWORD'),
      serverAddress,
      tags: collectTags(),
      wall: {
        collectCpuTime: true
      }
    });
    Pyroscope.start();
    pyroscopeStarted = true;
    console.info('[pyroscope] Registered profiling for the-stack', {
      applicationName: pyroscopeEnv.applicationName,
      serverAddressConfigured: pyroscopeEnv.serverAddressConfigured,
      authConfigured: pyroscopeEnv.authConfigured
    });
  } catch (error) {
    console.warn('[pyroscope] Failed to register profiling:', error);
  }
}
