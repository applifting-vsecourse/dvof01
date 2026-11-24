import { ChildProcess, execSync, spawn } from 'node:child_process';
import { join } from 'node:path';
import {
  resolveTestDatabaseUrl,
  TEST_API_PORT,
  TEST_API_URL,
} from './test-database-url';

const backendRoot = join(__dirname, '..', '..', '..');

declare global {
  var __INT_SERVER__: ChildProcess | undefined;
}

/**
 * Runs once before all integration tests:
 * 1. brings the test database schema up to date from our Prisma migrations
 *    (creating the database if it is missing),
 * 2. starts a real backend on TEST_API_PORT against that database.
 *
 * The backend runs as its own process (like `pnpm seed`, through ts-node)
 * because better-auth ships as ESM only, which jest cannot load in-process.
 */
export default async function globalSetup(): Promise<void> {
  const databaseUrl = resolveTestDatabaseUrl();
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    PORT: String(TEST_API_PORT),
    BACKEND_URL: TEST_API_URL,
    NODE_ENV: 'test',
    TS_NODE_TRANSPILE_ONLY: 'true',
  };

  execSync('pnpm exec prisma migrate deploy', {
    cwd: backendRoot,
    env,
    stdio: 'inherit',
  });

  let output = '';
  const server = spawn(
    process.execPath,
    ['-r', 'ts-node/register', '-r', 'tsconfig-paths/register', 'src/main.ts'],
    { cwd: backendRoot, env, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  server.stdout?.on('data', (chunk) => (output += chunk));
  server.stderr?.on('data', (chunk) => (output += chunk));
  globalThis.__INT_SERVER__ = server;

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) break;
    try {
      // Any HTTP answer (401 here) means Nest is up and routing.
      await fetch(`${TEST_API_URL}/api/quacks`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  server.kill();
  throw new Error(`Test backend did not start on ${TEST_API_URL}:\n${output}`);
}
