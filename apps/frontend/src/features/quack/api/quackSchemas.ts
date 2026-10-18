import { z } from "zod"

// Per the Applifting frontend playbook: validate every server payload with zod
// and infer types from the schema rather than auto-generating them.
export const quackUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
})

export const pollOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  voteCount: z.number(),
})

export const pollSchema = z.object({
  id: z.string(),
  options: z.array(pollOptionSchema),
  totalVotes: z.number(),
  userVotedOptionId: z.string().nullable().optional(),
})

export const quackSchema = z.object({
  id: z.string(),
  text: z.string(),
  mood: z.string().nullable().optional(),
  userId: z.string(),
  createdAt: z.coerce.date(),
  user: quackUserSchema,
  poll: pollSchema.nullable().optional(),
})

export const quacksSchema = z.array(quackSchema)

export type PollOption = z.infer<typeof pollOptionSchema>
export type Poll = z.infer<typeof pollSchema>
export type Quack = z.infer<typeof quackSchema>
