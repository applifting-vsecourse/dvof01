// cases.md, E1
import { expect, test } from "@playwright/test"

import { signIn } from "./signIn"

test("like a quack, keep it after reload, others see the count, unlike it", async ({ browser }) => {
  const text = `Likeable quack ${Date.now()}`

  const author = await browser.newPage()
  await signIn(author, "caffeinatedduck@example.com", "password1")
  await author.goto("/quacks")
  await author.getByLabel("New quack").fill(text)
  await author.getByRole("button", { name: "Quack", exact: true }).click()

  const mine = author.getByRole("article").filter({ hasText: text }).first()
  await expect(mine).toBeVisible()
  const likeButton = mine.getByRole("button", { name: /^like/i })
  await expect(likeButton).toHaveAttribute("aria-pressed", "false")
  await expect(likeButton).toHaveText(/0/)

  await likeButton.click()
  const unlikeButton = mine.getByRole("button", { name: /^unlike/i })
  await expect(unlikeButton).toHaveAttribute("aria-pressed", "true")
  await expect(unlikeButton).toHaveText(/1/)

  // stored on the server, not just in the cache
  await author.reload()
  await expect(unlikeButton).toHaveAttribute("aria-pressed", "true")
  await expect(unlikeButton).toHaveText(/1/)

  // someone else sees the count, but not as their own like
  const other = await browser.newPage()
  await signIn(other, "deepduckthoughts@example.com", "password2")
  await other.goto("/quacks")
  const theirs = other.getByRole("article").filter({ hasText: text }).first()
  const theirButton = theirs.getByRole("button", { name: /^like/i })
  await expect(theirButton).toHaveAttribute("aria-pressed", "false")
  await expect(theirButton).toHaveText(/1/)

  // take it back
  await unlikeButton.click()
  await expect(likeButton).toHaveAttribute("aria-pressed", "false")
  await expect(likeButton).toHaveText(/0/)

  await author.close()
  await other.close()
})
