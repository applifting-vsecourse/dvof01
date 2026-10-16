import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { quacksQueryOptions } from "@/features/quack/api/quacksQueryOptions"
import { QuackForm } from "@/features/quack/components/QuackForm"
import { QuackList } from "@/features/quack/components/QuackList"
import { QuackSearch } from "@/features/quack/components/QuackSearch"

export const Route = createFileRoute("/_ProtectedPages/quacks")({
  component: QuacksPage,
})

function QuacksPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const quacksQuery = useQuery(quacksQueryOptions(searchQuery))
  // Routes are allowed to import from features/ — read the session here and
  // pass the default mood down as a plain prop so QuackForm stays auth-agnostic.
  const sessionQuery = useQuery(authSessionQueryOptions())
  const defaultMood = sessionQuery.data?.user.defaultMood ?? null

  return (
    <>
      <Seo title="Quacks" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">Quacks</h1>

        <QuackForm
          className="mb-4"
          defaultMood={defaultMood}
        />

        <QuackSearch
          value={searchQuery}
          onChange={setSearchQuery}
          className="mb-4"
        />

        <QuackList
          quacks={quacksQuery.data ?? []}
          isLoading={quacksQuery.isLoading}
          error={quacksQuery.error ?? undefined}
          emptyMessage={searchQuery.trim() ? "No quacks found matching your search." : undefined}
          // Only the error state offers a retry — posting invalidates the list,
          // and refocusing the tab refetches it.
          onReload={() => void quacksQuery.refetch()}
        />
      </section>
    </>
  )
}
