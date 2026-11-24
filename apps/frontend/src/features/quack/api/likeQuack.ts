 
import type { LikeSummary } from "@/features/quack/api/quackSchemas"

// Stub — PUT /api/quacks/:id/like (see cases.md).
export function likeQuack(_quackId: string): Promise<LikeSummary> {
  return Promise.reject(new Error("not implemented"))
}

// Stub — DELETE /api/quacks/:id/like (see cases.md).
export function unlikeQuack(_quackId: string): Promise<LikeSummary> {
  return Promise.reject(new Error("not implemented"))
}
