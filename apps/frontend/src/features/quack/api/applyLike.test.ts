// cases.md, F3
import { describe, expect, it } from "vitest"

import { applyLike } from "@/features/quack/api/applyLike"
import type { Quack } from "@/features/quack/api/quackSchemas"

const quack = (overrides: Partial<Quack> = {}): Quack => ({
  id: "q1",
  text: "quack quack",
  userId: "u1",
  createdAt: new Date("2026-01-01T12:00:00Z"),
  user: { id: "u1", name: "Caffeinated Duck", username: "CaffeinatedDuck" },
  likeCount: 0,
  likedByMe: false,
  ...overrides,
})

const feed = (): Quack[] => [
  quack({
    id: "root",
    likeCount: 2,
    likedByMe: false,
    replies: [quack({ id: "reply", replyToId: "root", likeCount: 0, likedByMe: false })],
  }),
  quack({ id: "other", likeCount: 5, likedByMe: true }),
]

describe("applyLike", () => {
  it("F3: liking a quack marks it as mine and adds one", () => {
    const result = applyLike(feed(), "root", true)

    expect(result[0]).toMatchObject({ id: "root", likeCount: 3, likedByMe: true })
  })

  it("F3: unliking a quack takes one away", () => {
    const result = applyLike(feed(), "other", false)

    expect(result[1]).toMatchObject({ id: "other", likeCount: 4, likedByMe: false })
  })

  it("F3: finds a reply nested under its parent", () => {
    const result = applyLike(feed(), "reply", true)

    expect(result[0]?.replies?.[0]).toMatchObject({ id: "reply", likeCount: 1, likedByMe: true })
    expect(result[0]).toMatchObject({ id: "root", likeCount: 2, likedByMe: false })
  })

  it("F3: leaves other quacks untouched", () => {
    const before = feed()
    const result = applyLike(before, "root", true)

    expect(result[1]).toEqual(before[1])
    expect(result[0]?.replies).toEqual(before[0]?.replies)
  })

  it("F3: does nothing when the state already matches", () => {
    const before = feed()

    expect(applyLike(before, "other", true)).toEqual(before)
    expect(applyLike(before, "root", false)).toEqual(before)
  })
})
