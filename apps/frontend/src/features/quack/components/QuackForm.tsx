import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, X } from "lucide-react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

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
import { cn } from "@/lib/utils"

import { useAddQuack } from "@/features/quack/hooks/useAddQuack"

// Mirrors the server-side DTO (MaxLength(280)) so the user is told before
// the request is made — the server still validates independently.
const MAX_LENGTH = 280
const MOODS = ["happy", "sad", "angry", "silly"] as const

const schema = z
  .object({
    text: z
      .string()
      .trim()
      .min(1, "Write something first")
      .max(MAX_LENGTH, `Keep it under ${MAX_LENGTH} characters`),
    mood: z.enum(MOODS).nullable().optional(),
    hasPoll: z.boolean(),
    pollOptions: z.array(z.object({ value: z.string() })),
  })
  .superRefine((data, ctx) => {
    if (data.hasPoll) {
      if (data.pollOptions.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A poll must have at least 2 options",
          path: ["pollOptions"],
        })
      }
      if (data.pollOptions.length > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A poll can have at most 10 options",
          path: ["pollOptions"],
        })
      }
      data.pollOptions.forEach((opt, index) => {
        if (!opt.value.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Option cannot be empty",
            path: ["pollOptions", index, "value"],
          })
        } else if (opt.value.trim().length > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Keep under 100 characters",
            path: ["pollOptions", index, "value"],
          })
        }
      })
    }
  })

type FormValues = z.infer<typeof schema>

type QuackFormProps = {
  className?: string
  /** Pre-selected mood from the user's profile default. Passed in by the page. */
  defaultMood?: string | null
}

export function QuackForm({ className, defaultMood }: QuackFormProps) {
  const addQuack = useAddQuack()

  // Validate that the passed-in defaultMood is one of the allowed values.
  const initialMood = MOODS.includes(defaultMood as (typeof MOODS)[number])
    ? (defaultMood as (typeof MOODS)[number])
    : null

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      text: "",
      mood: initialMood,
      hasPoll: false,
      pollOptions: [{ value: "" }, { value: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "pollOptions",
  })

  const hasPoll = useWatch({ control: form.control, name: "hasPoll" })

  // Synchronize mood with initialMood when session arrives or updates,
  // unless the user has manually changed the mood field.
  useEffect(() => {
    if (!form.formState.dirtyFields.mood) {
      form.setValue("mood", initialMood)
    }
  }, [initialMood, form])

  const text = useWatch({ control: form.control, name: "text" })
  const length = text?.length ?? 0

  const togglePoll = () => {
    const shouldHavePoll = !hasPoll
    form.setValue("hasPoll", shouldHavePoll)
    if (shouldHavePoll && fields.length < 2) {
      form.setValue("pollOptions", [{ value: "" }, { value: "" }])
    }
  }

  const handleSubmit = (values: FormValues) => {
    addQuack.mutate(
      {
        text: values.text,
        mood: values.mood ?? null,
        poll: values.hasPoll
          ? {
              options: values.pollOptions.map((o) => o.value.trim()),
            }
          : null,
      },
      {
        onSuccess: () => {
          form.reset({
            text: "",
            mood: initialMood,
            hasPoll: false,
            pollOptions: [{ value: "" }, { value: "" }],
          })
        },
      },
    )
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("space-y-3", className)}
      >
        {addQuack.error ? (
          <Alert variant="destructive">
            <AlertDescription>{addQuack.error.message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col items-start gap-3 sm:flex-row">
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem className="w-full flex-1">
                <FormLabel>New quack</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Quack something..."
                    disabled={addQuack.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mood"
            render={({ field }) => (
              <FormItem className="w-full sm:w-auto">
                <FormLabel>Mood</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                  value={field.value ?? "none"}
                  disabled={addQuack.isPending}
                >
                  <FormControl>
                    <SelectTrigger
                      tabIndex={0}
                      aria-label="Mood"
                      className="w-full sm:w-[130px]"
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
        </div>

        {hasPoll ? (
          <div className="space-y-3 rounded-md border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Poll options</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={togglePoll}
                disabled={addQuack.isPending}
              >
                Remove poll
              </Button>
            </div>

            <div className="space-y-2">
              {fields.map((fieldItem, index) => (
                <FormField
                  key={fieldItem.id}
                  control={form.control}
                  name={`pollOptions.${index}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Option {index + 1}</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input
                            placeholder={`e.g. Choice ${index + 1}`}
                            disabled={addQuack.isPending}
                            {...field}
                          />
                        </FormControl>
                        {fields.length > 2 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove option ${index + 1}`}
                            onClick={() => remove(index)}
                            disabled={addQuack.isPending}
                          >
                            <X className="size-4" />
                          </Button>
                        ) : null}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            {fields.length < 10 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ value: "" })}
                disabled={addQuack.isPending}
                className="mt-1"
              >
                <Plus className="mr-1 size-4" />
                Add option
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          {!hasPoll ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              tabIndex={0}
              onClick={togglePoll}
              disabled={addQuack.isPending}
            >
              Add poll
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-sm",
                length > MAX_LENGTH ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {length}/{MAX_LENGTH}
            </span>
            <Button
              type="submit"
              size="sm"
              tabIndex={0}
              disabled={addQuack.isPending}
            >
              {addQuack.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Quack
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
