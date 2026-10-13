import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { type UpdateProfileInput } from "@/features/settings/api/profileSchemas"
import { ProfileSettingsForm } from "@/features/settings/components/ProfileSettingsForm"

export const Route = createFileRoute("/_ProtectedPages/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  // Routes/ is allowed to import from any feature. Read the session here and
  // derive the form's initial values, then pass them down as plain props so
  // ProfileSettingsForm stays auth-agnostic.
  const sessionQuery = useQuery(authSessionQueryOptions())
  const user = sessionQuery.data?.user

  const initialValues: UpdateProfileInput = {
    username: user?.username ?? "",
    displayName: user?.name ?? "",
    bio: user?.bio ?? null,
    defaultMood: (user?.defaultMood as UpdateProfileInput["defaultMood"]) ?? null,
  }

  return (
    <>
      <Seo title="Settings" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Settings</h1>
        <ProfileSettingsForm initialValues={initialValues} />
      </section>
    </>
  )
}
