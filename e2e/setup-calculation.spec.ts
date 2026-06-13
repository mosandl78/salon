import { test, expect } from '@playwright/test'

/**
 * E2E: Full setup flow using Demo salon
 * Tests: add employee → add cost → see calculation in Übersicht
 *
 * We use the Demo salon for these tests since it already has full data.
 * This avoids complex auth + CRUD flows that are better tested in unit tests.
 */

test.describe('Demo: Übersicht tab calculations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo')
    await page.waitForSelector('text=Demo-Ansicht', { timeout: 15000 })
  })

  test('Übersicht shows Lohnfaktor value', async ({ page }) => {
    // Übersicht is the default tab
    await expect(page.locator('body')).toContainText(/Lohnfaktor/)
    // Should show a numeric value
    const lohnfaktorSection = page.locator('body')
    await expect(lohnfaktorSection).toContainText(/\d+[.,]\d+/)
  })

  test('Übersicht shows Personalkosten', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/Personalkosten/)
  })

  test('Übersicht shows Mindestumsatz', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/Mindestumsatz/)
  })

  test('Kosten tab lists cost items', async ({ page }) => {
    await page.getByRole('button', { name: 'Kosten', exact: true }).click()
    // Demo salon has Ladenmiete, Nebenkosten, etc.
    await expect(page.locator('body')).toContainText(/Ladenmiete|Nebenkosten|Strom|Miete/)
  })

  test('Mitarbeiter tab shows demo employees with roles', async ({ page }) => {
    await page.getByRole('button', { name: 'Mitarbeiter', exact: true }).click()
    // Demo has CHEF and FRISEUR roles
    await expect(page.locator('body')).toContainText(/CHEF|FRISEUR|Inhaber|Friseur/)
  })
})

test.describe('Demo: Preise tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo')
    await page.waitForSelector('text=Demo-Ansicht', { timeout: 15000 })
    await page.getByRole('button', { name: 'Preise', exact: true }).click()
  })

  test('shows service price table with columns', async ({ page }) => {
    // Should show Selbstkosten, Nettopreis, Bruttopreis columns
    await expect(page.locator('body')).toContainText(/Selbstkosten|Netto|Brutto/)
  })

  test('prices show EUR amounts', async ({ page }) => {
    // Prices should be shown as numbers with € sign
    await expect(page.locator('body')).toContainText(/€/)
  })

  test('service names from demo salon are visible', async ({ page }) => {
    // Demo salon has Damen — Waschen, Schneiden, Fönen and Herrenhaarschnitt
    await expect(page.locator('body')).toContainText(/Haarschnitt|Damen|Herrenhaarschnitt/)
  })
})

test.describe('Demo: Lohnfaktor tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo')
    await page.waitForSelector('text=Demo-Ansicht', { timeout: 15000 })
    await page.getByRole('button', { name: 'Lohnfaktor', exact: true }).click()
  })

  test('shows lohnfaktor hero card with numeric value', async ({ page }) => {
    // Hero card shows the main lohnfaktor
    await expect(page.locator('body')).toContainText(/Lohnfaktor/)
    await expect(page.locator('body')).toContainText(/\d+\.\d+/)
  })

  test('shows 4 Lohnfaktor-Varianten', async ({ page }) => {
    await expect(page.locator('body')).toContainText('Grundlohn')
    await expect(page.locator('body')).toContainText('Inkl. Sonderzahlungen')
    await expect(page.locator('body')).toContainText('Durchschnittslohn')
    await expect(page.locator('body')).toContainText('Höchstlohn')
  })

  test('shows PK/min and GK/min tiles', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/PK \/ Minute/)
    await expect(page.locator('body')).toContainText(/GK \/ Minute/)
  })

  test('shows Sollumsatz table with employee names', async ({ page }) => {
    // Table should contain demo employee names
    await expect(page.locator('body')).toContainText(/Anja|Sarah|Lena/)
  })
})
