import { test, expect } from '@playwright/test'

/**
 * E2E: Landing page → Demo → see all tabs with data
 */

test.describe('Landing page', () => {
  test('shows SALON brand and navigation', async ({ page }) => {
    await page.goto('/start')
    await expect(page.locator('header')).toContainText('SALON')
    await expect(page.getByRole('button', { name: /Demo ansehen/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Kostenlos testen/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Anmelden/i })).toBeVisible()
  })

  test('navigates to /demo when clicking "Demo ansehen"', async ({ page }) => {
    await page.goto('/start')
    await page.getByRole('button', { name: /Demo ansehen/i }).click()
    await expect(page).toHaveURL('/demo')
  })

  test('navigates to /register when clicking "Kostenlos testen"', async ({ page }) => {
    await page.goto('/start')
    await page.getByRole('button', { name: /Kostenlos testen/i }).click()
    await expect(page).toHaveURL('/register')
  })

  test('shows feature highlights on landing page', async ({ page }) => {
    await page.goto('/start')
    await expect(page.getByText(/Preiskalkulation/i)).toBeVisible()
    await expect(page.getByText(/Lohnfaktor/i)).toBeVisible()
    await expect(page.getByText(/Controlling/i)).toBeVisible()
  })
})

test.describe('Demo page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo')
    // Wait for demo data to load
    await page.waitForSelector('text=Demo-Ansicht', { timeout: 15000 })
  })

  test('shows demo banner with salon name', async ({ page }) => {
    await expect(page.getByText(/Demo-Ansicht/i)).toBeVisible()
    await expect(page.getByText(/Haarsalon Müller/i).first()).toBeVisible()
  })

  test('shows all 9 tabs', async ({ page }) => {
    const tabs = ['Übersicht', 'Mitarbeiter', 'Kosten', 'Lohnfaktor', 'Preise', 'Controlling', 'BWA', 'Liquidität', 'Simulator']
    for (const tab of tabs) {
      await expect(page.getByRole('button', { name: tab, exact: true })).toBeVisible()
    }
  })

  test('Übersicht tab shows key metrics', async ({ page }) => {
    // Default tab is Übersicht
    await expect(page.getByRole('button', { name: 'Übersicht', exact: true })).toBeVisible()
    // Some key metric should appear (Lohnfaktor, Mindestumsatz, etc.)
    await expect(page.locator('body')).toContainText(/Lohnfaktor|Mindestumsatz|Personalkosten/)
  })

  test('clicking Lohnfaktor tab shows lohnfaktor content', async ({ page }) => {
    await page.getByRole('button', { name: 'Lohnfaktor', exact: true }).click()
    await expect(page.locator('body')).toContainText(/Lohnfaktor|PK \/ Minute|Grundlohn/)
  })

  test('clicking Preise tab shows service price table', async ({ page }) => {
    await page.getByRole('button', { name: 'Preise', exact: true }).click()
    await expect(page.locator('body')).toContainText(/Haarschnitt|Damen|Herrenhaarschnitt/)
  })

  test('clicking Mitarbeiter tab shows employee list', async ({ page }) => {
    await page.getByRole('button', { name: 'Mitarbeiter', exact: true }).click()
    // Demo salon has Anja Müller, Sarah Klein, Lena Schmidt
    await expect(page.locator('body')).toContainText(/Anja|Sarah|Lena/)
  })

  test('clicking Controlling tab shows revenue data', async ({ page }) => {
    await page.getByRole('button', { name: 'Controlling', exact: true }).click()
    await expect(page.locator('body')).toContainText(/Soll|IST|Umsatz/)
  })

  test('"Jetzt kostenlos starten" button navigates to /register', async ({ page }) => {
    await page.getByRole('button', { name: /kostenlos starten/i }).click()
    await expect(page).toHaveURL('/register')
  })
})
