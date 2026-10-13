import { api } from "@/lib/api-client"

import { userProfileSchema, updateProfileSchema, type UpdateProfileInput, type UserProfile } from "./profileSchemas"

export async function getProfile(): Promise<UserProfile> {
  const raw = await api.get("users/me").json()
  return userProfileSchema.parse(raw)
}

export async function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
  const raw = await api.patch("users/me", { json: input }).json()
  return userProfileSchema.parse(raw)
}

export { updateProfileSchema }
