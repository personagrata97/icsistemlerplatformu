import { test, expect } from '@playwright/test';

test.describe('Denetim ve Bulgu Akışı E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Giriş yap
    await page.goto('http://localhost:3010/login');
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    await page.getByPlaceholder('Kullanıcı Adı').fill('admin');
    await page.getByPlaceholder('Şifre').fill('Admin123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:3010/', { timeout: 15000 });
  });

  test('Denetim Dashboarduna erişim ve veri kontrolü', async ({ page }) => {
    // Teftiş Kurulu kartındaki "Uygulamaya Git" linkine tıkla
    // app/page.tsx içindeki Link href="/audit"
    await page.click('a[href="/audit"]');
    await expect(page).toHaveURL(/.*audit/, { timeout: 10000 });
    
    // Dashboard başlığını kontrol et
    await expect(page.getByRole('heading')).toContainText('Denetim Özeti', { timeout: 15000 });
  });

  test('Bulgu Listesi ekranı kontrolü', async ({ page }) => {
    // Direkt bulgular sayfasına git (Erişim kontrolü için)
    await page.goto('http://localhost:3010/audit/findings');
    
    // URL kontrolü
    await expect(page).toHaveURL(/.*findings/, { timeout: 10000 });
    
    // Sayfa içeriği kontrolü
    await expect(page.getByRole('heading')).toContainText('Bulgu Listesi', { timeout: 15000 });
  });
});
