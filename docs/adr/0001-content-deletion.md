# 0001 · Content deletion with replies (Tombstone pattern)

Status: Accepted · 2026-11-17

## Context

Quacker users can delete their quacks (introduced in week 5 and extended with moderation in week 6). Previously, deleting a quack was a simple physical `DELETE` in PostgreSQL (`prisma.quack.delete`), which cascaded to all associated child records (such as polls and votes).

With the introduction of replies, users can reply to any quack. The product owner's requirement states:

1. Replies belong to the users who wrote them: if an author deletes a quack that already has replies, the replies must not disappear with it.
2. When someone deletes their quack, its content has to really disappear from the app.

This creates a conflict between data retention (preserving the discussion thread and replies authored by others) and data deletion (honoring the author's right to remove their content).

## Decision

We use the **Tombstone with Content Redaction** pattern:

- When a quack with **no replies** is deleted: it is physically deleted from the database (`prisma.quack.delete`) as before.
- When a quack with **existing replies** is deleted:
  - It is marked with `deletedAt = now()`.
  - Its content is scrubbed from the database: `text` is cleared (`''`), `mood` is set to `null`, and any attached poll/votes are deleted.
  - In the feed and fulltext search, deleted quacks are filtered out so the original author's content never appears anywhere.
  - Under the discussion thread where replies exist, a neutral placeholder (`[This quack has been deleted]`) is rendered above the replies, preserving the tree hierarchy and conversational context for the other authors.

## Options considered

### 1. Cascade Hard Delete (`ON DELETE CASCADE`)

- **How it works**: Deleting a quack deletes the row from PostgreSQL, automatically deleting all replies underneath it.
- **Why rejected**: Violates the core product requirement ("replies belong to the people who wrote them: if an author deletes a quack that already has replies, the replies must not disappear with it"). Deleting a controversial or popular quack would destroy other users' legitimate contributions.

### 2. Orphaned Replies (`ON DELETE SET NULL` with Hard Delete)

- **How it works**: Deleting a quack deletes the row and sets `replyToId = NULL` on all its direct replies.
- **Why rejected**: All replies would suddenly become root-level quacks in the main feed without any context, confusing users and polluting the global feed.

### 3. Simple Soft Delete without Content Scrubbing

- **How it works**: Setting `deletedAt = now()` while keeping the original `text` in the database, hiding it only via application filters.
- **Why rejected**: Fails privacy and right-to-be-forgotten standards ("its content has to really disappear from the app"). Retaining deleted user text in the database creates legal and privacy risks, and bugs in future queries could accidentally leak the text.

## Consequences

- **App-wide Delete Behavior**: `QuacksService.deleteQuack` now checks whether replies exist. All content deletion flows (both author delete and admin moderation delete) follow this single unified rule.
- **Feed and Search**: Queries in `QuackRepository` must filter by `deletedAt IS NULL` and scrubbed text will never be indexed or matched.
- **Frontend Display**: `QuackItem` handles the `deletedAt` state by rendering a placeholder instead of the original text, author actions, and mood badge.
