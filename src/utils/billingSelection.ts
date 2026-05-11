import type { BillingCycle, BillingPlanKey } from "../services/endpoints";

export type PendingPlanSelection = {
  planKey: BillingPlanKey;
  billingCycle: BillingCycle;
};

export const PENDING_SELECTED_PLAN_KEY = "pendingSelectedPlan";
const LEGACY_SELECTED_PLAN_KEY = "selectedPlan";

const PLAN_LABELS: Record<BillingPlanKey, string> = {
  COMMON: "Essencial",
  PREMIUM: "Premium",
  PRO_BUSINESS: "Business",
};

const CYCLE_LABELS: Record<BillingCycle, string> = {
  MONTHLY: "Mensal",
  ANNUAL: "Anual",
};

export function normalizePlanSelection(input: {
  plan?: string | null;
  planKey?: string | null;
  cycle?: string | null;
  billingCycle?: string | null;
}): PendingPlanSelection | null {
  const planKey = String(input.planKey || input.plan || "").trim().toUpperCase();
  const billingCycle = String(input.billingCycle || input.cycle || "").trim().toUpperCase();
  const validPlan = ["COMMON", "PREMIUM", "PRO_BUSINESS"].includes(planKey);
  const validCycle = ["MONTHLY", "ANNUAL"].includes(billingCycle);
  if (!validPlan || !validCycle) return null;
  return {
    planKey: planKey as BillingPlanKey,
    billingCycle: billingCycle as BillingCycle,
  };
}

export function readPlanSelectionFromSearch(searchParams: URLSearchParams) {
  return normalizePlanSelection({
    plan: searchParams.get("plan"),
    cycle: searchParams.get("cycle"),
  });
}

export function readPendingSelectedPlan(): PendingPlanSelection | null {
  const keys = [PENDING_SELECTED_PLAN_KEY, LEGACY_SELECTED_PLAN_KEY];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as {
        planKey?: string;
        billingCycle?: string;
        plan?: string;
        cycle?: string;
      };
      const selection = normalizePlanSelection(parsed);
      if (selection) return selection;
    } catch {
      // dado local antigo invalido; ignora e segue o fluxo normal
    }
  }
  return null;
}

export function savePendingSelectedPlan(selection: PendingPlanSelection) {
  const payload = JSON.stringify(selection);
  localStorage.setItem(PENDING_SELECTED_PLAN_KEY, payload);
  localStorage.setItem(LEGACY_SELECTED_PLAN_KEY, payload);
}

export function clearPendingSelectedPlan() {
  localStorage.removeItem(PENDING_SELECTED_PLAN_KEY);
  localStorage.removeItem(LEGACY_SELECTED_PLAN_KEY);
}

export function buildPlanosSubscribeUrl(selection: PendingPlanSelection) {
  return `/planos?plan=${selection.planKey}&cycle=${selection.billingCycle}&intent=subscribe`;
}

export function planSelectionLabel(selection: PendingPlanSelection) {
  return `${PLAN_LABELS[selection.planKey]} ${CYCLE_LABELS[selection.billingCycle]}`;
}

export function planLabel(planKey: string | null | undefined) {
  const normalized = normalizePlanSelection({ planKey, billingCycle: "MONTHLY" });
  return normalized ? PLAN_LABELS[normalized.planKey] : planKey || "ativo";
}
