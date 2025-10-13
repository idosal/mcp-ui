import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export default async function globalSetup(): Promise<void> {
  const rootDir = dirname(fileURLToPath(import.meta.url));
  const serverSdkDir = join(rootDir, 'sdks', 'typescript', 'server');
  const bundlePath = join(serverSdkDir, 'src', 'adapters', 'appssdk', 'adapter-runtime.bundled.ts');

  if (existsSync(bundlePath)) {
    return;
  }

  const result = spawnSync(process.execPath, ['scripts/bundle-adapter.js'], {
    cwd: serverSdkDir,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Bundling Apps SDK adapter runtime failed with exit code ${result.status ?? 'unknown'}.`);
  }
}

