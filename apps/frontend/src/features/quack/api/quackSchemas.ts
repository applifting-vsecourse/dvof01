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

export type PollOption = z.infer<typeof pollOptionSchema>
export type Poll = z.infer<typeof pollSchema>

export type Quack = {
  id: string
  text: string
  mood?: string | null
  userId: string
  replyToId?: string | null
  deletedAt?: Date | null
  createdAt: Date
  user: z.infer<typeof quackUserSchema>
  poll?: Poll | null
  replies?: Quack[]
  likeCount?: number
  likedByMe?: boolean
}

export type LikeSummary = {
  quackId: string
  likeCount: number
  likedByMe: boolean
}

export const quackSchema: z.ZodType<Quack> = z.lazy(() =>
  z.object({
    id: z.string(),
    text: z.string(),
    mood: z.string().nullable().optional(),
    userId: z.string(),
    replyToId: z.string().nullable().optional(),
    deletedAt: z.coerce.date().nullable().optional(),
    createdAt: z.coerce.date(),
    user: quackUserSchema,
    poll: pollSchema.nullable().optional(),
    replies: z.array(quackSchema).optional(),
    likeCount: z.number().optional(),
    likedByMe: z.boolean().optional(),
  }),
)

export const quacksSchema = z.array(quackSchema)
