import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { authKeys } from "@/lib/auth-keys"

import { updateProfile } from "@/features/settings/api/updateProfile"
import type { UpdateProfileInput } from "@/features/settings/api/profileSchemas"

// After a successful save the auth session is stale (name / username may have
// changed), so we invalidate it so every component reading useSession() picks
// up the fresh values immediately.
type SessionCache = {
  user: {
    id: string
    email: string
    name: string
    username: string
    bio?: string | null
    defaultMood?: string | null
    role?: string
  }
} | null

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: async (updatedUser) => {
      queryClient.setQueryData<SessionCache>(authKeys.session(), (old) => {
        if (!old?.user) return old
        return {
          ...old,
          user: {
            ...old.user,
            name: updatedUser.name,
            username: updatedUser.username,
            bio: updatedUser.bio ?? null,
            defaultMood: updatedUser.defaultMood ?? null,
          },
        }
      })
      await queryClient.invalidateQueries({ queryKey: authKeys.session() })
      toast.success("Profile saved")
    },
  })
}
