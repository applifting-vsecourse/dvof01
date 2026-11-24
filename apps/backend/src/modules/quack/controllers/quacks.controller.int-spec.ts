// Example integration test — the pattern to copy for API behaviour.
// Real HTTP requests go through the real Nest app into the test database.
import { createTestApp, TestApp } from '@/test-utils/int/test-app';

describe('GET /api/quacks', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.resetDatabase();
  });

  afterAll(async () => {
    await t.close();
  });

  it('rejects a signed-out visitor with 401', async () => {
    await t.anonymous().get('/api/quacks').expect(401);
  });

  it('returns 200 and the feed to a signed-in user', async () => {
    const duck = await t.signUp();
    await duck.agent.post('/api/quacks').send({ text: 'hello' }).expect(201);

    const response = await duck.agent.get('/api/quacks').expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      text: 'hello',
      user: { username: duck.username },
    });
  });
});
