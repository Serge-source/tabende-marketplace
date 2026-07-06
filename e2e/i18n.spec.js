const { test, expect } = require('@playwright/test');

test('papiamento is the default language', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Crea bo cuenta' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Crea Cuenta/ })).toBeVisible();
});

test('each language can be selected and applies immediately', async ({ page }) => {
  await page.goto('/login');
  const selector = page.getByLabel('Language');

  await selector.selectOption('en');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

  await selector.selectOption('nl');
  await expect(page.getByRole('heading', { name: 'Welkom terug' })).toBeVisible();

  await selector.selectOption('es');
  await expect(page.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible();

  await selector.selectOption('pap');
  await expect(page.getByRole('heading', { name: 'Bon bini bek' })).toBeVisible();
});

test('language choice persists across reloads', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Language').selectOption('nl');
  await expect(page.getByRole('heading', { name: 'Welkom terug' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Welkom terug' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('lang'))).toBe('nl');
});

test('major screens render in the selected language', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lang', 'pap'));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Haya Bon Oferta/ })).toBeVisible();
  await page.goto('/browse');
  await expect(page.getByRole('heading', { name: 'Tur Anuncio' })).toBeVisible();
  await expect(page.locator('select option', { hasText: 'Cualkier Condicion' })).toHaveCount(1);
});
