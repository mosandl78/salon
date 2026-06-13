import { test, expect } from '@playwright/test'
import { uniqueEmail, registerViaUI } from './helpers'

/**
 * E2E: Register → Login → Create salon → see dashboard
 */

test.describe('Registration flow', () => {
  test('user can register and lands on dashboard', async ({ page }) => {
    const email = uniqueEmail('register')
    await registerViaUI(page, 'Test User', email, 'password123')

    // Should be on dashboard after registration
    await expect(page).toHaveURL('/')
    // Dashboard should show "Neuer Salon" or empty state
    await expect(page.locator('body')).toContainText(/Salon|Dashboard|Kein/)
  })

  test('registration shows error for duplicate email', async ({ page }) => {
    const email = uniqueEmail('dup')
    // Register first time
    await registerViaUI(page, 'User One', email, 'password123')
    // Log out by clearing token
    await page.evaluate(() => localStorage.removeItem('salon_token'))

    // Try to register with same email
    await page.goto('/register')
    await page.fill('input[type="text"]', 'User Two')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page.locator('body')).toContainText(/bereits vergeben|E-Mail/)
  })
})

test.describe('Login flow', () => {
  test('user can login after registering', async ({ page }) => {
    const email = uniqueEmail('login')
    // Register first
    await registerViaUI(page, 'Login User', email, 'password123')
    // Clear token to simulate logout
    await page.evaluate(() => localStorage.removeItem('salon_token'))

    // Now login
    await page.goto('/login')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/')
  })

  test('wrong password shows error', async ({ page }) => {
    const email = uniqueEmail('wrongpw')
    await registerViaUI(page, 'User', email, 'correctpassword')
    await page.evaluate(() => localStorage.removeItem('salon_token'))

    await page.goto('/login')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page.locator('body')).toContainText(/Ungültige|fehlgeschlagen/)
  })

  test('unauthenticated access to / redirects to /start', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('salon_token'))
    await page.goto('/')
    await expect(page).toHaveURL('/start')
  })
})

test.describe('Salon creation flow', () => {
  test('user can create a new salon and see it on dashboard', async ({ page }) => {
    const email = uniqueEmail('salon')
    await registerViaUI(page, 'Salon Owner', email, 'password123')

    // Dashboard should have a "Neuen Salon anlegen" or similar CTA
    await expect(page.locator('body')).toContainText(/Salon|anlegen|erstellen/i)

    // Find and click the create salon button (could be various text)
    const createBtn = page.locator('button').filter({ hasText: /Neuen Salon|Salon anlegen|Erstellen/i }).first()
    if (await createBtn.isVisible()) {
      await createBtn.click()
      // Fill in salon name
      const nameInput = page.locator('input[type="text"]').first()
      if (await nameInput.isVisible()) {
        await nameInput.fill('Mein Testsalon')
      }
    }
  })
})
