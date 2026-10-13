import { z } from "zod"

export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  bio: z.string().nullable().optional(),
  defaultMood: z.string().nullable().optional(),
})

export type UserProfile = z.infer<typeof userProfileSchema>

export const updateProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9._]+$/, "Only letters, numbers, dots and underscores"),
  displayName: z.string().trim().min(1, "Display name is required").max(100),
  bio: z.string().trim().max(160, "Bio must be at most 160 characters").nullable().optional(),
  defaultMood: z.enum(["happy", "sad", "angry", "silly"]).nullable().optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
