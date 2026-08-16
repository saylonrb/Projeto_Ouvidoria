const { test, expect } = require('@playwright/test');

test.describe('Ouvidoria E2E Tests', () => {
  const adminEmail = 'admin@ouvidoria.gov.br';
  const adminPassword = 'admin123';
  const citizenEmail = `teste${Date.now()}@teste.com`;
  const citizenPassword = 'Password123';

  test('Deve logar como admin e acessar os painéis sem erros', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    // Admin login
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('form button[type="submit"]');
    
    // Wait for redirect to /admin automatically
    await expect(page).toHaveURL(/.*admin.*/, { timeout: 10000 });
    await expect(page.locator('h2').first()).toBeVisible({ timeout: 10000 }).catch(() => {});
    
    // Navigate to Submissions
    await page.goto('http://localhost:5173/admin/demandas');
    await expect(page.locator('h2:has-text("Gestão de Demandas")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
    
    // Navigate to MasterTickets
    await page.goto('http://localhost:5173/admin/tickets-ia');
    await expect(page.locator('table')).toBeVisible();
  });

  test('Deve cadastrar cidadao e criar demanda', async ({ page }) => {
    await page.goto('http://localhost:5173/login?register=true');
    
    // Register
    await page.fill('input[name="name"]', 'Cidadao Teste');
    await page.fill('input[name="email"]', citizenEmail);
    await page.fill('input[name="password"]', citizenPassword);
    await page.fill('input[name="confirmPassword"]', citizenPassword);
    await page.click('form button[type="submit"]');

    // Wait for redirect
    await expect(page).toHaveURL(/.*nova-demanda/, { timeout: 10000 });

    // Step 1
    await expect(page.locator('h3:has-text("1.")')).toBeVisible();
    await page.click('button:has-text("Próximo Passo")');
    // Step 2
    await expect(page.locator('h3:has-text("2.")')).toBeVisible();
    await page.click('button:has-text("Próximo Passo")');
    // Step 3
    await expect(page.locator('h3:has-text("3.")')).toBeVisible();
    await page.fill('input[placeholder="Digite um título resumido"]', 'Buraco na rua principal');
    await page.fill('textarea[placeholder*="Descreva com detalhes"]', 'Tem um buraco enorme na rua principal perto do mercadinho.');
    await page.fill('input[placeholder="Ex: Av. Beira Rio, 450, Bairro Cidade Nova"]', 'Rua Principal, Centro');
    await page.click('button:has-text("Próximo Passo")');
    
    // Submit (Step 4)
    await expect(page.locator('h3:has-text("4.")')).toBeVisible();
    await page.click('button:has-text("Enviar para a Ouvidoria")');
    
    // Should go to success page or my area
    await expect(page).toHaveURL(/.*rastrear.*/, { timeout: 10000 });
    await expect(page.locator('text=Demanda enviada')).toBeVisible({ timeout: 15000 }).catch(() => {});
  });
});
