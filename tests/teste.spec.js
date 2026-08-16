const { test, expect } = require('@playwright/test');

test('abrir Google', async ({ page }) => {
    await page.goto('https://www.google.com');
    await expect(page).toHaveTitle(/Google/);
});
