const { test, expect } = require('@playwright/test');

test('Verify dual intelligence architecture with rich municipal catalog and interactive chat buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Open Chatbot
  await page.click('button[aria-label="Abrir assistente virtual"]');
  await expect(page.locator('h4:has-text("Assistente — Ouvidoria")')).toBeVisible();

  // Verify interactive choice button inside the chat bubble
  await expect(page.locator('button:has-text("Fazer denúncia")').first()).toBeVisible();

  // Ask about iluminação / lâmpada queimada
  await page.fill('input[placeholder*="mensagem"]', 'Tenho uma lâmpada queimada na minha rua');
  await page.click('form button[type="submit"]');

  // Should return rich catalog topic for Iluminação Pública with interactive buttons
  await expect(page.locator('text=Iluminação Pública & Manutenção de Postes')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('button:has-text("Abrir Chamado de Iluminação")')).toBeVisible();
});
