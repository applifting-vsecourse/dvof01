import { expect, test } from "@playwright/test"

import { signIn } from "./signIn"

const API = "http://localhost:4050/api"

test("user can reply to a quack and see replies under it", async ({ page }) => {
  const rootText = `Root quack ${Date.now()}`
  const replyText = `Reply text ${Date.now()}`

  await signIn(page, "caffeinatedduck@example.com", "password1")
  await page.goto("/quacks")

  // Post root quack
  await page.getByLabel("New quack").fill(rootText)
  await page.getByRole("button", { name: "Quack", exact: true }).click()

  const rootQuack = page.getByRole("article").filter({ hasText: rootText }).first()
  await expect(rootQuack).toBeVisible()

  // Click Reply
  await rootQuack.getByRole("button", { name: /reply/i }).click()

  // Fill in reply
  await rootQuack.getByPlaceholder("Write your reply...").fill(replyText)
  await rootQuack.getByRole("button", { name: "Reply", exact: true }).click()

  // The reply should now appear nested under the root quack
  await expect(rootQuack.getByText(replyText)).toBeVisible()
})

test("deleting a quack with replies preserves replies and scrubs text everywhere (ADR)", async ({
  page,
}) => {
  const parentText = `Quack to be deleted ${Date.now()}`
  const childText = `Child reply preserved ${Date.now()}`

  await signIn(page, "caffeinatedduck@example.com", "password1")
  await page.goto("/quacks")

  // Post parent quack
  await page.getByLabel("New quack").fill(parentText)
  await page.getByRole("button", { name: "Quack", exact: true }).click()

  const parentQuack = page.getByRole("article").filter({ hasText: parentText }).first()
  await expect(parentQuack).toBeVisible()

  // Reply to it
  await parentQuack.getByRole("button", { name: /reply/i }).click()
  await parentQuack.getByPlaceholder("Write your reply...").fill(childText)
  await parentQuack.getByRole("button", { name: "Reply", exact: true }).click()
  await expect(parentQuack.getByText(childText)).toBeVisible()

  // Delete parent quack
  await parentQuack.getByRole("button", { name: "Delete quack" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: "Delete" }).click()
  await expect(dialog).toHaveCount(0)

  // 1. In feed: tombstone is displayed, but original parentText is NOT in the feed
  await expect(page.getByText("[This quack has been deleted]")).toBeVisible()
  await expect(page.getByText(parentText)).toHaveCount(0)

  // 2. In replies: child reply is still visible and intact
  await expect(page.getByText(childText)).toBeVisible()

  // 3. In search: searching for parentText returns 0 results
  await page.getByPlaceholder("Search quacks...").fill(parentText)
  await expect(page.getByText(parentText)).toHaveCount(0)
  await expect(page.getByText("No quacks found matching your search.")).toBeVisible()
})
