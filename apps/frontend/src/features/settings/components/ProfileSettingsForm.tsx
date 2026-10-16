import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { HTTPError } from "ky"
import { Loader2 } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/features/settings/api/profileSchemas"
import { useUpdateProfile } from "@/features/settings/hooks/useUpdateProfile"

type ProfileSettingsFormProps = {
  initialValues: UpdateProfileInput
}

export function ProfileSettingsForm({ initialValues }: ProfileSettingsFormProps) {
  const updateProfile = useUpdateProfile()

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: initialValues,
  })

  const currentUsername = useWatch({ control: form.control, name: "username" })

  // Re-sync when the parent refreshes the session and passes new initialValues
  // (e.g. after a successful save the route re-renders with the updated data).
  useEffect(() => {
    form.reset(initialValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialValues.username,
    initialValues.displayName,
    initialValues.bio,
    initialValues.defaultMood,
  ])

  const handleSubmit = (values: UpdateProfileInput) => {
    updateProfile.mutate(values)
  }

  // Surface conflict (409) as a field-level error so the typed value stays
  const isConflict = Boolean(
    updateProfile.error instanceof HTTPError &&
    updateProfile.error.response.status === 409 &&
    updateProfile.variables?.username &&
    currentUsername === updateProfile.variables.username,
  )

  const serverError =
    updateProfile.error instanceof HTTPError && updateProfile.error.response.status === 409
      ? null // handled as field error next to the username input
      : (updateProfile.error?.message ?? null)

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        {serverError ? (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}

        {/* ── Username ── */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  autoComplete="username"
                  placeholder="your_handle"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e)
                    if (updateProfile.error) {
                      updateProfile.reset()
                    }
                  }}
                  disabled={updateProfile.isPending}
                />
              </FormControl>
              {/* Show server-side "taken" error next to the field */}
              {isConflict ? (
                <p className="text-sm font-medium text-destructive">
                  That username is already taken
                </p>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Display name ── */}
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input
                  autoComplete="name"
                  placeholder="Your Name"
                  {...field}
                  disabled={updateProfile.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Bio ── */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Bio <span className="font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  maxLength={160}
                  placeholder="A short sentence about you…"
                  disabled={updateProfile.isPending}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
              <p className="text-right text-xs text-muted-foreground">
                {(field.value ?? "").length}/160
              </p>
            </FormItem>
          )}
        />

        {/* ── Default mood ── */}
        <FormField
          control={form.control}
          name="defaultMood"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default mood for new posts</FormLabel>
              <Select
                onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                value={field.value ?? "none"}
                disabled={updateProfile.isPending}
              >
                <FormControl>
                  <SelectTrigger
                    tabIndex={0}
                    aria-label="Default mood"
                  >
                    <SelectValue placeholder="No mood" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No mood</SelectItem>
                  <SelectItem value="happy">😊 Happy</SelectItem>
                  <SelectItem value="sad">😢 Sad</SelectItem>
                  <SelectItem value="angry">😡 Angry</SelectItem>
                  <SelectItem value="silly">🤪 Silly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Actions ── */}
        <div className="flex gap-3">
          <Button
            type="submit"
            tabIndex={0}
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Save changes
          </Button>
          <Button
            type="button"
            variant="outline"
            tabIndex={0}
            disabled={updateProfile.isPending}
            onClick={() => {
              form.reset(initialValues)
              updateProfile.reset()
            }}
          >
            Discard
          </Button>
        </div>
      </form>
    </Form>
  )
}
