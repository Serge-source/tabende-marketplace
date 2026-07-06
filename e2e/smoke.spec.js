const { test, expect } = require('@playwright/test');

const stamp = Date.now();
const seller = { name: 'E2E Seller', email: `e2e-seller-${stamp}@example.com`, password: 'E2ePassword123!' };
const listingTitle = `E2E Test Widget ${stamp}`;

test.describe.configure({ mode: 'serial' });

// The platform defaults to Papiamento; this suite asserts English strings
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lang', 'en'));
});

test('home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Find Great Deals/i })).toBeVisible();
});

test('register a seller account', async ({ page }) => {
  await page.goto('/register');
  await page.getByPlaceholder('John Doe').fill(seller.name);
  await page.getByPlaceholder('you@example.com').fill(seller.email);
  await page.getByPlaceholder('Min. 6 characters').fill(seller.password);
  await page.getByRole('button', { name: /Sell Items/i }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByText('Welcome back')).toBeVisible();
});

test('create a listing and find it on browse', async ({ page }) => {
  // fresh context per test — log in first
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(seller.email);
  await page.getByPlaceholder('••••••••').fill(seller.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(/\/(dashboard|admin)/);

  // 3-step wizard, photos skipped
  await page.goto('/listings/new');
  await page.getByRole('button', { name: /Continue to Details/i }).click();
  await page.getByPlaceholder('What are you selling?').fill(listingTitle);
  await page.locator('main textarea').fill('An automated end-to-end test listing. Safe to ignore.');
  await page.getByPlaceholder('0.00').fill('42');
  await page.locator('main select').nth(0).selectOption('Electronics');
  await page.locator('main select').nth(1).selectOption('Good');
  await page.getByRole('button', { name: /Preview Listing/i }).click();
  await page.getByRole('button', { name: 'Publish Listing' }).click();
  await page.waitForURL(/\/listings\/(?!new)/, { timeout: 15000 });

  // detail page shows the listing
  await expect(page.getByRole('heading', { name: listingTitle })).toBeVisible();
  await expect(page.getByText('Afl. 42')).toBeVisible();

  // search finds it on browse
  await page.goto(`/browse?search=${encodeURIComponent(listingTitle)}`);
  await expect(page.getByText(listingTitle).first()).toBeVisible();
});

test('login rejects wrong password', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(seller.email);
  await page.getByPlaceholder('••••••••').fill('definitely-wrong');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText(/Invalid credentials/i)).toBeVisible();
});

test('protected route redirects to login', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForURL(/\/login/);
  await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
});
