import { test, expect } from '@playwright/test'

test.describe('Smoke tests', () => {
  test('landing page renders Sign up / Log in', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText('Insan Kaynaklari', { exact: false })).toBeVisible()
    await expect(page.getByRole('link', { name: /Oturum Ac/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Ucretsiz Basla/i })).toBeVisible()
  })

  test('login page renders form fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel(/E-posta/i)).toBeVisible()
    await expect(page.getByLabel(/Sifre/i)).toBeVisible()
    // Optional: page may redirect to ?next=/ after middleware
    expect(page.url()).toMatch(/\/login/)
  })

  test('protected /employees redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/employees')
    await page.waitForURL(/\/login/, { timeout: 5000 })
    expect(page.url()).toContain('/login')
    const next = page.url().match(/next=([^&]+)/)?.[1]
    expect(decodeURIComponent(next ?? '/')).toContain('/employees')
  })

  test('navbar link from landing goes to signup', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /Ucretsiz Basla/i }).click()
    await page.waitForURL(/\/signup/, { timeout: 5000 })
    await expect(page.getByRole('heading', { name: /Yeni Sirket Kaydi/i })).toBeVisible()
  })
})

test.describe('Full signup → leave happy path (skip if Supabase unavailable)', () => {
  // Skipped by default; remove if local Supabase seeded with this email pattern.
  test.skip('full signup creates admin + company', async ({ page }) => {
    test.setTimeout(60_000)
    const stamp = Date.now()
    await page.goto('/signup')
    await page.getByLabel(/Sirket Adi/i).fill(`E2E Corp ${stamp}`)
    await page.getByLabel(/Subdomain/i).fill(`e2e-${stamp}`)
    await page.getByLabel(/Ad Soyad/i).fill('E2E Admin')
    await page.getByLabel(/E-posta/i).first().fill(`e2e+${stamp}@test.local`)
    await page.getByLabel(/Sifre/i).fill('password12345')
    await page.getByRole('button', { name: /Kayit Ol/i }).click()

    await page.waitForURL(/\/$|\/employees/, { timeout: 20_000 })
    expect(page.url()).toMatch(/\/$|\/employees/)
  })
})
