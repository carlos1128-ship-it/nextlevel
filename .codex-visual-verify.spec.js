import { test, expect } from "playwright/test";

const companyId = "company-demo";
const metric = (formatted, value = 0) => ({
  status: "ok",
  value,
  formatted,
  comparison: { changePercent: 12.4, direction: "up" },
  sourceLabel: "Dados reais",
});
const layout = [
  ["revenue", "Faturamento"],
  ["losses", "Perdas"],
  ["net_profit", "Lucro líquido"],
  ["cash_flow", "Fluxo de caixa"],
  ["ai_roi", "ROI da IA"],
  ["cash_flow_summary", "Fluxo por faixa"],
  ["category_mix", "Mix do período"],
  ["revenue_forecast", "Previsão"],
  ["alerts_insights", "Insights"],
  ["average_ticket", "Ticket médio"],
  ["margin", "Margem"],
].map(([metricKey, label], order) => ({ metricKey, label, description: label, enabled: true, order }));

async function mockApi(page) {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api/, "");
    const fulfill = (data, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });

    if (path === "/profile") return fulfill({ name: "Carlos Henrique", email: "carlos@nextlevel.ai", admin: false, niche: "ECOMMERCE", detailLevel: "medium", theme: "dark" });
    if (path === "/company") return fulfill([{ id: companyId, _id: companyId, name: "Carlos Henrique", sector: "Varejo" }]);
    if (path === "/billing/me") return fulfill({ hasActiveSubscription: true, activePlan: "PRO_BUSINESS", subscription: { planKey: "PRO_BUSINESS", billingCycle: "MONTHLY" } });
    if (path === "/company/personalization/status") return fulfill({ ready: true, isReady: true, shouldRedirect: false, redirectToOnboarding: false });
    if (path === "/company/personalization") return fulfill({ modulePreferences: [] });
    if (path === "/dashboard/preferences") return fulfill({ resolvedLayout: layout, preferences: layout });
    if (path === "/dashboard/metrics") return fulfill({
      metrics: {
        revenue: metric("R$ 148.920,00", 148920),
        losses: metric("R$ 4.280,00", 4280),
        net_profit: metric("R$ 47.320,00", 47320),
        cash_flow: metric("R$ 52.100,00", 52100),
        ai_roi: metric("R$ 8.300,00", 8300),
        average_ticket: metric("R$ 82,40", 82.4),
        margin: metric("34%", 34),
        cash_flow_summary: metric("R$ 52.100,00", 52100),
        category_mix: metric("Ativo", 1),
        revenue_forecast: metric("R$ 164.200,00", 164200),
        alerts_insights: metric("Ativo", 1),
      },
      charts: {
        revenueByDay: [{ name: "Seg", Receitas: 12000, Saidas: 4000 }, { name: "Ter", Receitas: 18000, Saidas: 5200 }],
        costsByCategory: [{ name: "Operação", value: 4300 }, { name: "Marketing", value: 2800 }],
        salesByProduct: [{ name: "Produto A", revenue: 22000 }, { name: "Produto B", revenue: 18000 }],
      },
    });
    if (path === "/ai/dashboard-insights") return fulfill({
      mainInsight: { priority: "medium", title: "Margem saudável", summary: "A operação mantém lucro real positivo.", recommendation: "Priorize produtos com maior margem." },
      mainRisk: { priority: "high", title: "Custo em alta", summary: "Custos operacionais cresceram.", recommendation: "Revise despesas recorrentes." },
      growthOpportunity: { priority: "low", title: "Campanha pronta", summary: "Há espaço para ampliar canais.", recommendation: "Ative integração de vendas." },
      whatsappSignal: { priority: "medium", title: "Atendimento ativo", summary: "Conversas estão centralizadas.", recommendation: "Acompanhe leads quentes." },
      nextBestActions: [],
      missingData: [],
    });
    if (path.startsWith("/analytics/forecast/")) return fulfill({ status: "ok", historicalData: [{ date: "2026-05-14", value: 12000 }], predictedData: [{ date: "2026-05-16", value: 21000 }], qualityLabel: "média", accuracyScore: 0.82, generatedAt: "2026-05-16" });
    if (path === "/attendant/roi") return fulfill({ iaSalesCount: 12, iaRevenue: 8300 });
    if (path === "/agent-config") return fulfill({ agentName: "Atendente Next Level", toneOfVoice: "profissional", companyDescription: "Empresa demo", welcomeMessage: "Olá! Como posso ajudar?", systemPrompt: "Atendimento claro.", modelName: "gpt-4o-mini", debounceSeconds: 3, maxContextMessages: 24, isEnabled: true, internetSearchEnabled: false, speechToTextEnabled: false, imageUnderstandingEnabled: true, splitRepliesEnabled: false, messageBufferEnabled: true, pauseForHuman: true });
    if (path === "/attendant/conversations") return fulfill([]);
    if (path === "/whatsapp/connection/status") return fulfill({ status: "connected", webhookStatus: "configured", automationStatus: "configured" });
    if (path === "/instagram/status") return fulfill({ connected: true, status: "connected" });
    if (path === "/integrations/mercadolivre/status") return fulfill({ connected: true, nickname: "Loja Demo", mlUserId: "123", lastSyncAt: "2026-05-16T12:00:00.000Z", webhook: { status: "OK", lastEventAt: "2026-05-16T12:00:00.000Z" } });
    if (path === "/integrations/mercadolivre/dashboard") return fulfill({ revenue: 47320, products: 24, orders: 184, pendingQuestions: 2 });
    if (path === "/market-intel/overview") return fulfill({ comparison: [], trends: [], refreshedAt: "2026-05-16T12:00:00.000Z" });
    return fulfill({});
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("access_token", "visual-test-token");
    localStorage.setItem("refresh_token", "visual-refresh-token");
    localStorage.setItem("selectedCompanyId", "company-demo");
    localStorage.setItem("theme", "dark");
  });
  await mockApi(page);
});

for (const routePath of ["/dashboard", "/chat", "/attendant", "/integrations", "/market-intel"]) {
  test(`visual smoke ${routePath}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://127.0.0.1:5177${routePath}`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toBeVisible();
    const metrics = await page.evaluate(() => ({
      title: document.querySelector("h1")?.textContent?.trim() || "",
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      sidebar: Boolean(document.querySelector("aside")),
    }));
    expect(metrics.title.length).toBeGreaterThan(0);
    expect(metrics.sidebar).toBeTruthy();
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    await page.screenshot({ path: `C:/NEXT LEVEL/internal-${routePath.slice(1)}-check.png`, fullPage: false });
  });
}
