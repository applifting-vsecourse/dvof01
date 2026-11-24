import { PrismaService } from '@/core/prisma/prisma.service';
import * as request from 'supertest';
import TestAgent from 'supertest/lib/agent';
import { TEST_API_URL } from './test-database-url';

export type TestApp = {
  /** Direct access to the test database, for arranging and checking data. */
  prisma: PrismaService;
  /** An HTTP client with no session: a signed-out visitor. */
  anonymous: () => TestAgent;
  /** Signs up a fresh user and returns a client that carries their session cookie. */
  signUp: (name?: string) => Promise<SignedInUser>;
  /** Wipes every table (except Prisma's migration log) between tests. */
  resetDatabase: () => Promise<void>;
  close: () => Promise<void>;
};

export type SignedInUser = {
  id: string;
  username: string;
  agent: TestAgent;
};

let userCounter = 0;

/**
 * Integration-test client for the backend that global-setup started on
 * TEST_API_URL. Requests are real HTTP; data lives in the test database.
 */
export const createTestApp = async (): Promise<TestApp> => {
  const prisma = new PrismaService();
  await prisma.$connect();

  // better-auth checks the Origin of cookie-carrying requests.
  const origin = process.env.FRONTEND_URL ?? 'http://localhost:3050';
  const anonymous = (): TestAgent =>
    request.agent(TEST_API_URL).set('Origin', origin);

  const signUp = async (name = 'Test Duck'): Promise<SignedInUser> => {
    userCounter += 1;
    const username = `duck${Date.now()}${userCounter}`;
    const agent = anonymous();

    const response = await agent
      .post('/api/auth/sign-up/email')
      .send({
        name,
        username,
        email: `${username}@example.com`,
        password: 'password123',
      })
      .expect(200);

    return { id: response.body.user.id, username, agent };
  };

  const resetDatabase = async (): Promise<void> => {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
    if (tables.length === 0) return;
    const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} CASCADE;`);
  };

  return {
    prisma,
    anonymous,
    signUp,
    resetDatabase,
    close: () => prisma.$disconnect(),
  };
};
