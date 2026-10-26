import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all")

  const isMineTab = activeTab === "mine"
  const quacksQuery = useQuery(quacksQueryOptions(searchQuery, isMineTab))

  // Routes are allowed to import from features/ — read the session here and
  // pass the default mood down as a plain prop so QuackForm stays auth-agnostic.
  const sessionQuery = useQuery(authSessionQueryOptions())
  const defaultMood = sessionQuery.data?.user.defaultMood ?? null
  const currentUserId = sessionQuery.data?.user.id

  const rawQuacks = quacksQuery.data ?? []
  const displayedQuacks =
    isMineTab && currentUserId ? rawQuacks.filter((q) => q.userId === currentUserId) : rawQuacks

  const handleWriteFirst = () => {
    const textarea = document.querySelector<HTMLTextAreaElement>('textarea[name="text"]')
    textarea?.focus()
    textarea?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  let emptyMessage: string | undefined
  let emptyAction: React.ReactNode | undefined

  if (isMineTab) {
    if (searchQuery.trim()) {
      emptyMessage = "No quacks found matching your search."
    } else {
      emptyMessage = "You don't have any quacks yet."
      emptyAction = (
        <Button
          variant="outline"
          size="sm"
          onClick={handleWriteFirst}
        >
          Write the first one
        </Button>
      )
    }
  } else {
    emptyMessage = searchQuery.trim() ? "No quacks found matching your search." : undefined
  }

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

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "all" | "mine")}
          className="mb-4"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mine">Mine</TabsTrigger>
          </TabsList>
        </Tabs>

        <QuackList
          quacks={displayedQuacks}
          currentUserId={currentUserId}
          isLoading={quacksQuery.isLoading}
          error={quacksQuery.error ?? undefined}
          emptyMessage={emptyMessage}
          emptyAction={emptyAction}
          // Only the error state offers a retry — posting invalidates the list,
          // and refocusing the tab refetches it.
          onReload={() => void quacksQuery.refetch()}
        />
      </section>
    </>
  )
}
