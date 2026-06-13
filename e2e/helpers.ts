import { Page } from '@playwright/test'

/** Generate a unique email for each test run to avoid collisions */
export function uniqueEmail(prefix = 'test') {
  return `${prefix}+${Date.now()}@e2e-test.de`
}

/** Wait for the API to be healthy before running tests */
export async function waitForApi(page: Page) {
  await page.waitForTimeout(500)
}

/** Login programmatically by setting localStorage token via API */
export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/')
}

/** Register a new user via UI and land on dashboard */
export async function registerViaUI(page: Page, name: string, email: string, password: string) {
  await page.goto('/register')
  await page.fill('input[type="text"]', name)
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/')
}
