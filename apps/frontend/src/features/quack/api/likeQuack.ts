import { z } from "zod"

import { api } from "@/lib/api-client"

import type { LikeSummary } from "@/features/quack/api/quackSchemas"

const likeSummarySchema: z.ZodType<LikeSummary> = z.object({
  quackId: z.string(),
  likeCount: z.number(),
  likedByMe: z.boolean(),
})

// PUT /api/quacks/:id/like — idempotent (cases.md).
export async function likeQuack(quackId: string): Promise<LikeSummary> {
  const json = await api.put(`quacks/${quackId}/like`).json()
  return likeSummarySchema.parse(json)
}

// DELETE /api/quacks/:id/like — idempotent (cases.md).
export async function unlikeQuack(quackId: string): Promise<LikeSummary> {
  const json = await api.delete(`quacks/${quackId}/like`).json()
  return likeSummarySchema.parse(json)
}
