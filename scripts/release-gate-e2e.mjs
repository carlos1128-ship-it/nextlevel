import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const appUrl = process.env.E2E_APP_URL || 'http://localhost:5173';
const apiUrl = process.env.E2E_API_URL || 'http://localhost:3333/api';
const evidenceDir = path.join(process.cwd(), 'test-results', 'release-gate');

const users = {
  essential: {
    email: process.env.E2E_ESSENTIAL_EMAIL,
    password: process.env.E2E_ESSENTIAL_PASSWORD,
    label: 'Essential',
  },
  premium: {
    email: process.env.E2E_PREMIUM_EMAIL,
    password: process.env.E2E_PREMIUM_PASSWORD,
    label: 'Premium',
  },
};

function assertGate(condition, id, message) {
  if (!condition) throw new Error(`${id}: ${message}`);
}

async function submitLogin(page, email, password) {
  await page.goto(`${appUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-password').press('Enter');
}

async function loginUser(browser, user, results) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  const started = Date.now();
  await submitLogin(page, user.email, user.password);
  await page.waitForURL(/\/(dashboard|planos|companies|onboarding\/personalization)/, {
    timeout: 30000,
  });
  if (!page.url().includes('/dashboard')) {
    await page.goto(`${appUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => undefined);
  await page.screenshot({
    path: path.join(evidenceDir, `${user.label.toLowerCase()}-dashboard.png`),
    fullPage: false,
  });

  const storage = await page.evaluate(() => ({
    access: localStorage.getItem('access_token'),
    refresh: localStorage.getItem('refresh_token'),
    sessionAccess: sessionStorage.getItem('access_token'),
    sessionRefresh: sessionStorage.getItem('refresh_token'),
  }));
  assertGate(
    !storage.access && !storage.refresh && !storage.sessionAccess && !storage.sessionRefresh,
    'AUTH-07',
    `${user.label} ainda possui token em storage`,
  );

  const cookies = await context.cookies(new URL(apiUrl).origin);
  assertGate(
    cookies.find((cookie) => cookie.name === 'access_token')?.httpOnly,
    'AUTH-07',
    `${user.label} access_token nao esta HttpOnly`,
  );
  assertGate(
    cookies.find((cookie) => cookie.name === 'refresh_token')?.httpOnly,
    'AUTH-07',
    `${user.label} refresh_token nao esta HttpOnly`,
  );

  const companies = await page.evaluate(async (api) => {
    const response = await fetch(`${api}/company`, { credentials: 'include' });
    return { status: response.status, body: await response.json() };
  }, apiUrl);
  assertGate(companies.status === 200, 'TEN-05', `${user.label} nao listou empresas`);
  const companyList = Array.isArray(companies.body)
    ? companies.body
    : companies.body.companies || [companies.body.company].filter(Boolean);
  const companyId = companyList[0]?.id || companyList[0]?._id;
  assertGate(companyId, 'TEN-01', `${user.label} sem companyId`);

  results.push({
    id: `AUTH-01-${user.label}`,
    status: 'PASS',
    evidence: `${Date.now() - started}ms; cookies HttpOnly; consoleErrors=${consoleErrors.length}`,
  });
  return { context, page, companyId };
}

async function main() {
  if (!users.essential.email || !users.essential.password || !users.premium.email || !users.premium.password) {
    throw new Error('Credenciais E2E ausentes no ambiente local');
  }
  await fs.mkdir(evidenceDir, { recursive: true });

  const results = [];
  const browser = await chromium.launch({ headless: true });
  try {
    const invalidContext = await browser.newContext();
    const invalidPage = await invalidContext.newPage();
    const invalidStarted = Date.now();
    await submitLogin(invalidPage, users.essential.email, 'SenhaInvalida-ReleaseGate-000');
    await invalidPage.getByText(/Credenciais|invalidas|inválidas|inesperada/i).waitFor({
      timeout: 10000,
    });
    results.push({ id: 'AUTH-02', status: 'PASS', evidence: `${Date.now() - invalidStarted}ms` });
    await invalidContext.close();

    const premiumSession = await loginUser(browser, users.premium, results);
    const premiumCompanyId = premiumSession.companyId;

    const financeCreate = await premiumSession.page.evaluate(async ({ api, companyId }) => {
      const payload = {
        companyId,
        type: 'expense',
        amount: 88.12,
        description: `E2E custo browser ${Date.now()}`,
        category: 'QA',
        date: new Date().toISOString(),
      };
      const response = await fetch(`${api}/financial/transactions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return { status: response.status };
    }, { api: apiUrl, companyId: premiumCompanyId });
    assertGate(financeCreate.status >= 200 && financeCreate.status < 300, 'FIN-01', `status ${financeCreate.status}`);

    const dashboard = await premiumSession.page.evaluate(async ({ api, companyId }) => {
      const response = await fetch(`${api}/dashboard/metrics?companyId=${encodeURIComponent(companyId)}&period=30d`, {
        credentials: 'include',
      });
      return { status: response.status };
    }, { api: apiUrl, companyId: premiumCompanyId });
    assertGate(dashboard.status === 200, 'DASH-01', `status ${dashboard.status}`);

    const csv = await premiumSession.page.evaluate(async ({ api, companyId }) => {
      const response = await fetch(`${api}/export/financial?companyId=${encodeURIComponent(companyId)}`, {
        credentials: 'include',
      });
      return { status: response.status, contentType: response.headers.get('content-type') };
    }, { api: apiUrl, companyId: premiumCompanyId });
    assertGate(csv.status === 200 && /text\/csv/.test(csv.contentType || ''), 'REP-05', `status ${csv.status}`);
    results.push({ id: 'FIN-01/DASH-01/REP-05', status: 'PASS', evidence: 'finance=201; dashboard=200; csv=200' });

    const helpStatus = await premiumSession.page.evaluate(async () => Promise.all(
      ['/help', '/alerts'].map(async (route) => ({
        route,
        status: (await fetch(route, { credentials: 'include' })).status,
      })),
    ));
    assertGate(helpStatus.every((item) => item.status === 200), 'UI-01/UI-02', JSON.stringify(helpStatus));
    results.push({ id: 'UI-01/UI-02', status: 'PASS', evidence: JSON.stringify(helpStatus) });

    const essentialSession = await loginUser(browser, users.essential, results);
    const idorFinance = await essentialSession.page.evaluate(async ({ api, targetCompanyId }) => ({
      status: (await fetch(`${api}/financial/report?companyId=${encodeURIComponent(targetCompanyId)}`, {
        credentials: 'include',
      })).status,
    }), { api: apiUrl, targetCompanyId: premiumCompanyId });
    const idorExport = await essentialSession.page.evaluate(async ({ api, targetCompanyId }) => ({
      status: (await fetch(`${api}/export/financial?companyId=${encodeURIComponent(targetCompanyId)}`, {
        credentials: 'include',
      })).status,
    }), { api: apiUrl, targetCompanyId: premiumCompanyId });
    assertGate([401, 403].includes(idorFinance.status), 'TEN-04', `status ${idorFinance.status}`);
    assertGate([401, 403].includes(idorExport.status), 'TEN-06', `status ${idorExport.status}`);
    results.push({
      id: 'TEN-04/TEN-06',
      status: 'PASS',
      evidence: `finance=${idorFinance.status}; export=${idorExport.status}; target=${premiumCompanyId}`,
    });

    await premiumSession.context.close();
    await essentialSession.context.close();
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify({ status: 'PASS', results }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
