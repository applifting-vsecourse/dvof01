import { resolveTestDatabaseUrl } from './test-database-url';

// Runs in every integration test worker before any module is imported, so
// PrismaService connects to the test database, never the dev one.
process.env.DATABASE_URL = resolveTestDatabaseUrl();
