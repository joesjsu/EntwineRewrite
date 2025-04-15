// e2e/homepage.spec.ts
import { test, expect } from '@playwright/test';

test('unauthenticated user is redirected to login', async ({ page }) => {
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`Browser Console ERROR: ${msg.text()}`);
    }
  });

  // Listen for uncaught exceptions
  page.on('pageerror', exception => {
    console.log(`Uncaught exception in page: "${exception}"`);
  });


  // Navigate to the base URL (homepage)
  await page.goto('/');

  // Wait for the URL to change to /login
  await page.waitForURL('**/login');

  // Optional: Assert the final URL
  await expect(page).toHaveURL('/login');
});