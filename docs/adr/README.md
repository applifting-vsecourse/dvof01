# Architecture Decision Records (ADRs)

Index of all architectural decisions made in Quacker. Check this index before changing the data model or app structure.

- [0001 · Content deletion with replies](0001-content-deletion.md) — Accepted — When a quack has replies, delete scrubs its content and marks it as a tombstone to preserve replies; otherwise it is permanently hard-deleted.
- [0002 · Likes](0002-likes.md) — Accepted — One `Like` row per (user, quack) with a composite unique index; like count and `likedByMe` are computed on read, no denormalised counter.
