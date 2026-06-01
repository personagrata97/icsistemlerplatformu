import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully with admin credentials', async ({ page }) => {
    // Go to login page
    await page.goto('http://localhost:3010/login');

    // Check if we are on the login page
    await expect(page).toHaveTitle(/Login/i);

    // Fill in credentials
    await page.getByPlaceholder('Kullanıcı Adı').fill('admin');
    await page.getByPlaceholder('Şifre').fill('Admin123!');

    // Click login button
    await page.click('button[type="submit"]');

    // Should be redirected to home page
    await expect(page).toHaveURL('http://localhost:3010/');
    
    // Check if welcome message is visible
    await expect(page.getByText(/Hoş Geldiniz/i)).toBeVisible();
  });

  test('should show error on wrong credentials', async ({ page }) => {
    await page.goto('http://localhost:3010/login');
    await page.getByPlaceholder('Kullanıcı Adı').fill('wrong_user');
    await page.getByPlaceholder('Şifre').fill('wrong_pass');
    await page.click('button[type="submit"]');

    // Check for error message (based on SweetAlert2 usually used in this project)
    // The previous analysis showed SweetAlert2 is in package.json
    await expect(page.locator('.swal2-title')).toBeVisible();
  });
});
