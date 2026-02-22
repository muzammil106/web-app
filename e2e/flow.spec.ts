import { test, expect } from '@playwright/test';

test.describe('Registration flow', () => {
  test('Step 1: cannot continue without all fields', async ({ page }) => {
    await page.goto('/');
    await page.selectOption('[name="educationLevel"]', 'bachelor');
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Please select Yes or No for internet access.')).toBeVisible();
  });

  test('Step 1: can continue when all fields selected', async ({ page }) => {
    await page.goto('/');
    await page.selectOption('[name="educationLevel"]', 'high_school');
    await page.locator('#internet-yes').check();
    await page.locator('#certs-no').check();
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page).toHaveURL('/step2');
  });

  test('Step 2: shows back link and form', async ({ page }) => {
    await page.goto('/');
    await page.selectOption('[name="educationLevel"]', 'associate');
    await page.locator('#internet-yes').check();
    await page.locator('#certs-yes').check();
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page).toHaveURL('/step2');
    await expect(page.getByRole('link', { name: /back to step 1/i })).toBeVisible();
    await expect(page.locator('#firstName')).toBeVisible();
  });
});
