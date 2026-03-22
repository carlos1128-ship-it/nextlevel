/**
 * Espelha a regra do backend (`ProductsService.calculateFinancialHealth`).
 * Lucro = preço − custo − imposto − frete; margem = (lucro / preço) × 100.
 */
export type FinancialWarningLevel = "HEALTHY" | "WARNING" | "CRITICAL";

export function calculateFinancialHealth(
  cost: number,
  tax: number,
  shipping: number,
  price: number,
): { grossProfit: number; netMargin: number; warningLevel: FinancialWarningLevel } {
  const safeCost = Math.max(0, Number(cost) || 0);
  const safeTax = Math.max(0, Number(tax) || 0);
  const safeShip = Math.max(0, Number(shipping) || 0);
  const safePrice = Math.max(0, Number(price) || 0);
  const grossProfit = Number((safePrice - safeCost - safeTax - safeShip).toFixed(2));
  const netMargin =
    safePrice > 0 ? Number(((grossProfit / safePrice) * 100).toFixed(2)) : 0;
  const warningLevel: FinancialWarningLevel =
    netMargin <= 0 ? "CRITICAL" : netMargin < 10 ? "WARNING" : "HEALTHY";

  return { grossProfit, netMargin, warningLevel };
}
