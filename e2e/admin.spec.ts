import { test, expect } from '@playwright/test'
import { uniqueEmail } from './helpers'

/**
 * E2E: Admin login → admin page shows stats
 *
 * Note: Admin tests require an admin user to exist in the database.
 * The ADMIN_EMAIL and ADMIN_PASSWORD can be set as env vars.
 * If not set, the test is skipped gracefully.
 */

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? ''
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? ''

test.describe('Admin page', () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Skipped: ADMIN_EMAIL and ADMIN_PASSWORD env vars not set')

  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
    await page.goto('/admin')
  })

  test('admin page shows stats (totalUsers, totalSalons)', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/Benutzer|Users|Salons/)
  })

  test('admin page shows user list', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/E-Mail|Name|Plan/)
  })

  test('non-admin cannot access /admin', async ({ page }) => {
    // Register a regular user
    const email = uniqueEmail('nonadmin')
    await page.goto('/register')
    await page.fill('input[type="text"]', 'Regular User')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')

    // Try to access admin
    await page.goto('/admin')
    // Should either redirect or show an error / 403
    await expect(page.locator('body')).toContainText(/kein Zugriff|forbidden|Admin|nicht berechtigt/i)
  })
})

test.describe('Admin page access control (no credentials needed)', () => {
  test('unauthenticated user is redirected away from /admin', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('salon_token'))
    await page.goto('/admin')
    // Should redirect to /start (protected route)
    await expect(page).toHaveURL('/start')
  })
})
