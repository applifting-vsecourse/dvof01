# Likes: cases that must hold

Status: **No open questions.** Data model: [ADR 0002](docs/adr/0002-likes.md).

## Request from the product owner

> "People want to show they like a quack without having to reply. I want a like button and a like count on every quack. Everyone can like a quack only once, and take the like back."

## Decisions on questions the product owner didn't mention

| Question                                   | Decision                                                                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Can I like my own quack?                   | **Yes.** A like means "I like this", not a vote on someone else's content; forbidding it would be an extra rule for no gain.                                  |
| Can replies be liked?                      | **Yes.** A reply is a quack too (course bonus). Same rules, same API.                                                                                         |
| What if I like twice?                      | The second like changes nothing — the count stays, the response is a success (idempotent `PUT`). Same for removing a like I don't have (idempotent `DELETE`). |
| A deleted quack (tombstone, see ADR 0001)? | Cannot be liked or unliked (404). Deleting a quack also removes its likes — the content of a deleted quack really disappears, and likes belong to it.         |
| Signed-out visitor?                        | 401, like the rest of the API. Only signed-in users see the feed anyway.                                                                                      |
| Can I see that I liked it?                 | **Yes.** The button is pressed (`aria-pressed="true"`, label "Unlike"), otherwise "Like". Everyone sees the count.                                            |
| Who liked it?                              | Out of scope for this task (second bonus) — count only for now.                                                                                               |
| What if the server rejects the like?       | The optimistic UI change is rolled back and the user gets an error toast (convention from `CLAUDE.md`).                                                       |
| Concurrent clicks?                         | One like per user and quack is guarded by the **database** (unique index), not just by code. Two concurrent likes by the same user = still 1 like, no 500.    |

## API

- `PUT /api/quacks/:id/like` → `200 { quackId, likeCount, likedByMe: true }`
- `DELETE /api/quacks/:id/like` → `200 { quackId, likeCount, likedByMe: false }`
- `GET /api/quacks` → every quack and every reply carries `likeCount: number` and `likedByMe: boolean`

---

## Rules (unit tests)

### Backend — `LikesService`

**L1 · A like belongs to the signed-in user**

- Given an existing quack `q1`
- When user `u1` (from the session) calls `like(u1, q1)`
- Then the repository stores a like for `(q1, u1)` and the service returns the summary `{ quackId: q1, likeCount, likedByMe: true }`

**L2 · Removing a like belongs to the signed-in user**

- Given an existing quack `q1`
- When `u1` calls `unlike(u1, q1)`
- Then the repository removes the like for `(q1, u1)` and the service returns the summary with `likedByMe: false`

**L3 · Quack does not exist**

- Given quack `missing` does not exist
- When anyone calls `like` or `unlike`
- Then the service throws `NotFoundException` ("Quack not found") and writes nothing to the like repository

**L4 · Deleted quack (tombstone)**

- Given quack `q1` has `deletedAt`
- When anyone calls `like` or `unlike`
- Then the service throws `NotFoundException` and writes nothing to the like repository

### Frontend

**F1 · The button shows the count and my state**

- Given a quack with `likeCount: 3`, `likedByMe: false`
- Then there is a "Like" button with `aria-pressed="false"` and the count `3`
- Given `likedByMe: true` → an "Unlike" button with `aria-pressed="true"`

**F2 · Clicking toggles the like**

- When I click "Like" → `onToggle(true)` is called; "Unlike" → `onToggle(false)`

**F3 · Optimistic cache update**

- Given a feed in the cache containing a quack and a reply
- When I like the quack (or the reply)
- Then `likedByMe` flips and `likeCount` changes by ±1 on exactly that quack (even when nested as a reply); other quacks are unchanged
- Given the state already matches (liking an already liked quack) → the cache does not change

**F4 · A failure is rolled back and reported**

- Given the server rejects the like
- Then the cache is back in its original state and the user sees an error toast

**F5 · A tombstone has no button**

- Given a deleted quack (tombstone) in the feed
- Then it has no Like button; a regular quack has one

---

## API behaviour (integration tests)

**A1 · Signed out** — `PUT` and `DELETE /api/quacks/:id/like` without a session → `401`

**A2 · Like** — Given a quack with 0 likes; When `PUT …/like`; Then `200`, `likeCount: 1`, `likedByMe: true`

**A3 · Like twice** — Given I already liked it; When `PUT …/like` again; Then `200`, `likeCount` stays `1`

**A4 · Concurrent** — When the same user sends two `PUT …/like` at once; Then both `200` and there is exactly 1 like in the database

**A5 · Unlike** — Given I liked it; When `DELETE …/like`; Then `200`, `likeCount: 0`, `likedByMe: false`

**A6 · Unlike without a like** — Given I haven't liked it; When `DELETE …/like`; Then `200`, `likeCount: 0`

**A7 · Several people** — Given A and B like a quack; Then `likeCount: 2`; When A unlikes; Then `1` and B's like stays

**A8 · Feed** — `GET /api/quacks` shows `likeCount` and `likedByMe` on every quack from the requester's point of view (A liked: A sees `true`, B sees `false`, both see `1`); a quack without likes has `0` / `false`

**A9 · Own quack** — the author may like their own quack → `200`, `likeCount: 1`

**A10 · Reply** — liking a reply → `200`; in the feed the reply has `likeCount: 1` and the parent `0`

**A11 · Unknown quack** — `PUT`/`DELETE …/like` on an unknown id → `404`

**A12 · Tombstone** — Given a quack with a reply that its author deleted; When `PUT …/like` → `404`; and the likes it had before deletion are gone (the tombstone has `likeCount: 0` in the feed)

---

## End-to-end (Playwright)

**E1 · Like, reload, second user, unlike**

- Given signed-in Caffeinated Duck posts a new quack
- When they click "Like"
- Then the button is "Unlike" (pressed) and the count is `1`; it stays that way after reloading the page
- And Deep Duck Thoughts sees the count `1` on that quack and a "Like" button (not pressed)
- When Caffeinated Duck clicks "Unlike"
- Then the count is `0` and the button is "Like" again
