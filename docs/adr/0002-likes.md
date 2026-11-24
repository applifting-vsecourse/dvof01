# 0002 · Likes: one row per like, count computed

Status: Accepted · 2026-11-24

## Context

The product owner wants a like button and a like count on every quack: everyone can like a quack once and take the like back. Cases are in [`cases.md`](../../cases.md). The parts that shape the data model:

- **At most one like per user per quack**, also under concurrent requests (double-click, two tabs). `CLAUDE.md` requires single-action constraints to be enforced by the database, not only in code.
- **Each viewer sees their own state** (`likedByMe`) next to the shared count, for every quack and reply in the feed.
- **Taking a like back** must be possible, so we need to know _who_ liked, not only how many.
- **Deleting content** (ADR 0001): a tombstoned quack loses its likes; a hard-deleted quack or deleted user takes their likes with them.
- Scale: a teaching app with small data. Feed queries already compute poll vote counts with Prisma `_count`.

## Decision

A **`Like` table** — one row per (user, quack) — with a **composite unique index `@@unique([userId, quackId])`**. The count is **computed on read** (`_count` of `likes`), the viewer's state by including the viewer's own like row, exactly as poll votes are done today.

```prisma
model Like {
  id        String   @id @default(cuid())
  quackId   String
  userId    String
  quack     Quack    @relation(fields: [quackId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, quackId])
  @@index([quackId])
  @@map("like")
}
```

- Like = idempotent upsert (`PUT /api/quacks/:id/like`), unlike = `deleteMany` (`DELETE …/like`); both return `{ quackId, likeCount, likedByMe }`.
- Replies are quacks, so they get likes the same way.
- Tombstoning a quack deletes its likes in the same transaction that scrubs its content.

## Options considered

### 1. `Like` table with unique index, count computed — **chosen**

- **Pros:** one source of truth; the database itself guarantees one like per user (a duplicate insert cannot happen even under races); unlike is a row delete; `likedByMe` is a simple filtered include; "who liked it" (the second bonus) is a query away; cascades clean up on quack/user delete.
- **Cons:** the count is a `COUNT` per quack on every feed read. With the `quackId` index this is cheap at our scale.
- **Hard to change later:** little — a cached counter can be added on top without changing the API.

### 2. Counter column `likeCount` on `Quack` only — rejected

- **Pros:** cheapest read.
- **Why rejected:** it cannot tell _who_ liked, so it can enforce neither "only once" nor "take it back", and cannot show `likedByMe`. Concurrent increments need careful atomic updates. Not a valid model for the requirement on its own.

### 3. `Like` table **plus** a denormalised counter on `Quack` — rejected (for now)

- **Pros:** O(1) count reads at large scale.
- **Why rejected:** two sources of truth that must be updated in one transaction on every like/unlike/delete/cascade; any missed path (e.g. a user deletion cascade, which bypasses application code) makes the counter drift and needs a repair job. Premature for our data size. If feed reads become slow, we add it then — the API does not change.

## Consequences

- New Prisma model and migration (`like` table, unique `(userId, quackId)`, index on `quackId`); relations `Quack.likes` and `User.likes`.
- Feed queries (`QuackRepository`) include `_count.likes` and the viewer's own like for quacks and replies; the domain `Quack` and `QuackResponseDto` get `likeCount` and `likedByMe`.
- `QuackRepository.deleteQuack`: the tombstone branch also deletes the quack's likes (ADR 0001 — content of a deleted quack really disappears); the hard-delete branch relies on the cascade.
- A deleted user's likes disappear by cascade, and counts stay correct automatically because they are computed.
- Frontend: optimistic toggle with rollback and an error toast on failure (convention in `CLAUDE.md`).
