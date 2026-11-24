// API behaviour of likes (cases.md, A1–A12): real HTTP against the test database.
import {
  createTestApp,
  SignedInUser,
  TestApp,
} from '@/test-utils/int/test-app';

type FeedQuack = {
  id: string;
  text: string;
  likeCount: number;
  likedByMe: boolean;
  deletedAt?: string | null;
  replies?: FeedQuack[];
};

describe('Likes API', () => {
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

  const postQuack = async (
    author: SignedInUser,
    text: string,
    replyToId?: string,
  ): Promise<string> => {
    const response = await author.agent
      .post('/api/quacks')
      .send(replyToId ? { text, replyToId } : { text })
      .expect(201);
    return response.body.id;
  };

  const feed = async (viewer: SignedInUser): Promise<FeedQuack[]> =>
    (await viewer.agent.get('/api/quacks').expect(200)).body;

  const findInFeed = (quacks: FeedQuack[], id: string): FeedQuack => {
    for (const quack of quacks) {
      if (quack.id === id) return quack;
      const reply = quack.replies?.find((r) => r.id === id);
      if (reply) return reply;
    }
    throw new Error(`Quack ${id} not in feed`);
  };

  it('A1: a signed-out visitor gets 401 for like and unlike', async () => {
    const author = await t.signUp();
    const quackId = await postQuack(author, 'hello');

    await t.anonymous().put(`/api/quacks/${quackId}/like`).expect(401);
    await t.anonymous().delete(`/api/quacks/${quackId}/like`).expect(401);
  });

  it('A2: liking a quack counts one like and marks it as mine', async () => {
    const author = await t.signUp();
    const fan = await t.signUp();
    const quackId = await postQuack(author, 'hello');

    const response = await fan.agent
      .put(`/api/quacks/${quackId}/like`)
      .expect(200);

    expect(response.body).toEqual({
      quackId,
      likeCount: 1,
      likedByMe: true,
    });
  });

  it('A3: liking twice still counts one like', async () => {
    const author = await t.signUp();
    const fan = await t.signUp();
    const quackId = await postQuack(author, 'hello');

    await fan.agent.put(`/api/quacks/${quackId}/like`).expect(200);
    const response = await fan.agent
      .put(`/api/quacks/${quackId}/like`)
      .expect(200);

    expect(response.body).toMatchObject({ likeCount: 1, likedByMe: true });
  });

  it('A4: two concurrent likes by the same user store exactly one like', async () => {
    const author = await t.signUp();
    const fan = await t.signUp();
    const quackId = await postQuack(author, 'hello');

    const responses = await Promise.all([
      fan.agent.put(`/api/quacks/${quackId}/like`),
      fan.agent.put(`/api/quacks/${quackId}/like`),
    ]);

    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    const rows = await t.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM "like"
      WHERE "quackId" = ${quackId} AND "userId" = ${fan.id}`;
    expect(Number(rows[0].count)).toBe(1);
  });

  it('A5: unliking takes my like back', async () => {
    const author = await t.signUp();
    const fan = await t.signUp();
    const quackId = await postQuack(author, 'hello');
    await fan.agent.put(`/api/quacks/${quackId}/like`).expect(200);

    const response = await fan.agent
      .delete(`/api/quacks/${quackId}/like`)
      .expect(200);

    expect(response.body).toEqual({
      quackId,
      likeCount: 0,
      likedByMe: false,
    });
  });

  it('A6: unliking without a like is a no-op', async () => {
    const author = await t.signUp();
    const fan = await t.signUp();
    const quackId = await postQuack(author, 'hello');

    const response = await fan.agent
      .delete(`/api/quacks/${quackId}/like`)
      .expect(200);

    expect(response.body).toEqual({
      quackId,
      likeCount: 0,
      likedByMe: false,
    });
  });

  it('A7: likes from several people add up, and unliking removes only mine', async () => {
    const author = await t.signUp();
    const a = await t.signUp('Duck A');
    const b = await t.signUp('Duck B');
    const quackId = await postQuack(author, 'hello');

    await a.agent.put(`/api/quacks/${quackId}/like`).expect(200);
    const afterB = await b.agent.put(`/api/quacks/${quackId}/like`).expect(200);
    expect(afterB.body).toMatchObject({ likeCount: 2, likedByMe: true });

    const afterUnlike = await a.agent
      .delete(`/api/quacks/${quackId}/like`)
      .expect(200);
    expect(afterUnlike.body).toMatchObject({ likeCount: 1, likedByMe: false });

    const seenByB = findInFeed(await feed(b), quackId);
    expect(seenByB).toMatchObject({ likeCount: 1, likedByMe: true });
  });

  it('A8: the feed shows the like count and my own like state', async () => {
    const author = await t.signUp();
    const a = await t.signUp('Duck A');
    const b = await t.signUp('Duck B');
    const liked = await postQuack(author, 'liked one');
    const notLiked = await postQuack(author, 'lonely one');
    await a.agent.put(`/api/quacks/${liked}/like`).expect(200);

    const feedOfA = await feed(a);
    const feedOfB = await feed(b);

    expect(findInFeed(feedOfA, liked)).toMatchObject({
      likeCount: 1,
      likedByMe: true,
    });
    expect(findInFeed(feedOfB, liked)).toMatchObject({
      likeCount: 1,
      likedByMe: false,
    });
    expect(findInFeed(feedOfA, notLiked)).toMatchObject({
      likeCount: 0,
      likedByMe: false,
    });
  });

  it('A9: the author may like their own quack', async () => {
    const author = await t.signUp();
    const quackId = await postQuack(author, 'I like this myself');

    const response = await author.agent
      .put(`/api/quacks/${quackId}/like`)
      .expect(200);

    expect(response.body).toMatchObject({ likeCount: 1, likedByMe: true });
  });

  it('A10: a reply can be liked on its own', async () => {
    const author = await t.signUp();
    const fan = await t.signUp();
    const parentId = await postQuack(author, 'parent');
    const replyId = await postQuack(fan, 'reply', parentId);

    await author.agent.put(`/api/quacks/${replyId}/like`).expect(200);

    const quacks = await feed(fan);
    expect(findInFeed(quacks, replyId)).toMatchObject({
      likeCount: 1,
      likedByMe: false,
    });
    expect(findInFeed(quacks, parentId)).toMatchObject({
      likeCount: 0,
      likedByMe: false,
    });
  });

  it('A11: liking or unliking an unknown quack is 404', async () => {
    const fan = await t.signUp();

    await fan.agent.put('/api/quacks/does-not-exist/like').expect(404);
    await fan.agent.delete('/api/quacks/does-not-exist/like').expect(404);
  });

  it('A12: a deleted quack (tombstone) cannot be liked and loses its likes', async () => {
    const author = await t.signUp();
    const fan = await t.signUp();
    const quackId = await postQuack(author, 'soon gone');
    await postQuack(fan, 'a reply keeps the tombstone', quackId);
    await fan.agent.put(`/api/quacks/${quackId}/like`).expect(200);

    await author.agent.delete(`/api/quacks/${quackId}`).expect(204);

    await fan.agent.put(`/api/quacks/${quackId}/like`).expect(404);
    await fan.agent.delete(`/api/quacks/${quackId}/like`).expect(404);
    const tombstone = findInFeed(await feed(fan), quackId);
    expect(tombstone.deletedAt).toBeTruthy();
    expect(tombstone).toMatchObject({ likeCount: 0, likedByMe: false });
  });
});
