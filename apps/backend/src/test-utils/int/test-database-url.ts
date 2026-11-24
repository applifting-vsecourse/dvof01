import { config as loadEnv } from 'dotenv';

/** Port of the backend instance the integration tests start (dev runs on 4050). */
export const TEST_API_PORT = Number(process.env.TEST_API_PORT ?? 4051);
export const TEST_API_URL = `http://localhost:${TEST_API_PORT}`;

/**
 * Integration tests never touch the dev database. They use TEST_DATABASE_URL
 * when set (CI), otherwise the dev DATABASE_URL with the database renamed to
 * `quacker_test` — same Docker Postgres, separate database.
 */
export const resolveTestDatabaseUrl = (): string => {
  // .env holds the auth secret and URLs the app needs; never override what CI set.
  loadEnv({ quiet: true });

  const explicit = process.env.TEST_DATABASE_URL;
  const base =
    explicit ??
    process.env.DATABASE_URL ??
    'postgresql://quacker:quacker@localhost:5433/quacker';

  const url = new URL(base);
  if (!explicit) {
    url.pathname = '/quacker_test';
  }

  if (!url.pathname.endsWith('_test')) {
    throw new Error(
      `Refusing to run integration tests against "${url.pathname.slice(1)}": the database name must end with _test.`,
    );
  }

  return url.toString();
};
