import { expect, test } from "@playwright/test"

import { signIn } from "./signIn"

const API = "http://localhost:4050/api"

test("admin can delete someone else's quack", async ({ browser }) => {
  const text = `Spam ${Date.now()}`
  const author = await browser.newPage()
  await signIn(author, "caffeinatedduck@example.com", "password1")
  const posted = await author.request.post(`${API}/quacks`, { data: { text } })
  expect(posted.status()).toBe(201)

  const admin = await browser.newPage()
  await signIn(admin, "admin@example.com", "adminpassword")
  await admin.goto("/quacks")
  const quack = admin.getByRole("article").filter({ hasText: text })
  await expect(quack).toBeVisible()

  await quack.getByRole("button", { name: "Delete quack" }).click()
  const dialog = admin.getByRole("dialog")
  await dialog.getByRole("button", { name: "Delete" }).click()
  await expect(dialog).toHaveCount(0)
  await expect(quack).toHaveCount(0)

  // Gone on the server, for the author too.
  const quacks: { id: string; text: string }[] = await (
    await author.request.get(`${API}/quacks`)
  ).json()
  expect(quacks.some((q) => q.text === text)).toBe(false)

  await author.close()
  await admin.close()
})

test("admin sees Delete on every quack", async ({ page }) => {
  await signIn(page, "admin@example.com", "adminpassword")
  await page.goto("/quacks")

  const articles = page.getByRole("article")
  await expect(articles.filter({ hasNotText: "@superadmin" }).first()).toBeVisible()
  await expect(articles.getByRole("button", { name: "Delete quack" })).toHaveCount(
    await articles.count(),
  )
})

test("a name with Admin in it is not the admin role: 403", async ({ page }) => {
  // "Pond Admin" from the seed is a regular user. Only the role counts.
  await signIn(page, "pondadmin@example.com", "password5")
  const quacks: { id: string; user: { username: string } }[] = await (
    await page.request.get(`${API}/quacks`)
  ).json()
  const notMine = quacks.find((q) => q.user.username !== "PondAdmin")!

  const response = await page.request.delete(`${API}/quacks/${notMine.id}`)
  expect(response.status()).toBe(403)
})
