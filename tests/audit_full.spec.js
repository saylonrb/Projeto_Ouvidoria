const { test, expect } = require('@playwright/test');

test.describe('End-to-End Audit & Logic Testing', () => {
  const adminEmail = 'admin@ouvidoria.gov.br';
  const adminPassword = 'admin123';
  const testCitizenEmail = `audit_user_${Date.now()}@teste.com`;
  const testCitizenPassword = 'Password123';

  test('1. Test Public Routes & Navigation', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Home
    await page.goto('http://localhost:5173/');
    await expect(page.locator('h1')).toContainText('Ouvidoria Municipal');

    // FAQ
    await page.goto('http://localhost:5173/faq');
    await page.waitForTimeout(500);

    // Mapa
    await page.goto('http://localhost:5173/mapa');
    await page.waitForTimeout(500);

    // Privacidade
    await page.goto('http://localhost:5173/privacidade');
    await expect(page.locator('h1')).toContainText('Política de Privacidade');

    expect(errors).toEqual([]);
  });

  test('2. Test Citizen Registration, Demand Creation & Minha Área Flow', async ({ page }) => {
    page.on('console', msg => console.log('NEW REQUEST LOG:', msg.text()));
    page.on('pageerror', err => console.log('NEW REQUEST PAGE ERROR:', err.message));

    // Register
    await page.goto('http://localhost:5173/login?register=true');
    await page.fill('form input[name="name"]', 'Cidadão Audit Teste');
    await page.fill('form input[name="email"]', testCitizenEmail);
    await page.fill('form input[name="password"]', testCitizenPassword);
    await page.fill('form input[name="confirmPassword"]', testCitizenPassword);
    await page.click('form button[type="submit"]');

    // Should redirect to /nova-demanda
    await expect(page).toHaveURL(/.*nova-demanda/, { timeout: 10000 });

    // Step 1: Tipo de Manifestação (default is SOLICITACAO)
    await expect(page.locator('h3:has-text("1.")')).toBeVisible();
    await page.click('button:has-text("Próximo Passo")');

    // Step 2: Setor / Categoria (default is AI triaging)
    await expect(page.locator('h3:has-text("2.")')).toBeVisible();
    await page.click('button:has-text("Próximo Passo")');

    // Step 3: Relato (Title and Description)
    await expect(page.locator('h3:has-text("3.")')).toBeVisible();
    await page.fill('input[placeholder="Digite um título resumido"]', 'Vazamento de água potável na calçada');
    await page.fill('textarea[placeholder*="Descreva com detalhes"]', 'Água vazando há 3 dias na calçada em frente ao número 123.');
    await page.fill('input[placeholder="Ex: Av. Beira Rio, 450, Bairro Cidade Nova"]', 'Rua das Flores, 123, Bairro Cidade Nova');
    await page.click('button:has-text("Próximo Passo")');

    // Step 4: Revisão e Envio
    await expect(page.locator('h3:has-text("4.")')).toBeVisible();
    await page.click('button:has-text("Enviar para a Ouvidoria")');

    // Wait and log current url or error
    await page.waitForTimeout(3000);
    console.log('URL after clicking Enviar Demanda:', page.url());

    // Should redirect to /rastrear?protocol=OUV-...
    await expect(page).toHaveURL(/.*rastrear.*/, { timeout: 10000 });
    const currentUrl = page.url();
    const urlParams = new URL(currentUrl).searchParams;
    const createdProtocol = urlParams.get('protocol');
    console.log('Created protocol:', createdProtocol);
    expect(createdProtocol).toBeTruthy();
    expect(createdProtocol).not.toBe('undefined');

    // Navigate to Minha Área
    await page.goto('http://localhost:5173/minha-area');
    await page.waitForSelector('table tbody tr');
    const cellProtocol = await page.locator('table tbody tr td').first().textContent();
    console.log('Displayed protocol cell text in Minha Área:', cellProtocol.trim());
    expect(cellProtocol.trim()).not.toBe('undefined');
    expect(cellProtocol.trim()).toContain('OUV-');

    // Check "Detalhes" button link
    const detailsHref = await page.locator('table tbody tr a').first().getAttribute('href');
    console.log('Details link href in Minha Área:', detailsHref);
    expect(detailsHref).not.toContain('undefined');
  });

  test('3. Test "Esqueceu a Senha" Link & Password Recovery Page', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.click('text=Esqueceu a senha?');
    await expect(page).toHaveURL(/.*recuperar-senha/, { timeout: 5000 });
    await expect(page.locator('h2')).toContainText('Recuperação de Senha');
  });

  test('4. Test Admin Login, Dashboard, Master Tickets & Admin Modals', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto('http://localhost:5173/login');
    await page.fill('form input[name="email"]', adminEmail);
    await page.fill('form input[name="password"]', adminPassword);
    await page.click('form button[type="submit"]');

    await expect(page).toHaveURL(/.*admin.*/, { timeout: 10000 });

    // Check Dashboard metrics
    await expect(page.locator('h2').first()).toContainText('Dashboard');

    // Test Admin Page: Demandas
    await page.goto('http://localhost:5173/admin/demandas');
    await expect(page.locator('table')).toBeVisible();

    // Click "Analisar" on first submission
    await page.click('table tbody tr td a:has-text("Analisar")');
    await expect(page).toHaveURL(/.*admin\/demandas\/.*/, { timeout: 5000 });

    // Test "Atualizar Andamento" button opens modal
    await page.click('button:has-text("Atualizar Andamento")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button:has-text("Cancelar")');

    // Test Admin Page: Master Tickets (Tickets IA)
    await page.goto('http://localhost:5173/admin/tickets-ia');
    await expect(page.locator('table')).toBeVisible();

    // Test Admin Page: Usuários & Edit Modal
    await page.goto('http://localhost:5173/admin/usuarios');
    await expect(page.locator('table')).toBeVisible();
    await page.click('table tbody tr button:has-text("Editar")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.click('button:has-text("Cancelar")');

    // Check for page errors in Admin
    expect(pageErrors).toEqual([]);
  });
});
