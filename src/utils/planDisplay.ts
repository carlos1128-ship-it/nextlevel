import type { BillingCycle, BillingPlanKey } from "../services/endpoints";

export const PLAN_DISPLAY: Record<
  BillingPlanKey,
  {
    publicName: string;
    aiTier: string;
    aiLimit: string;
    aiDescription: string;
    displayPricesInCents: Record<BillingCycle, number>;
  }
> = {
  COMMON: {
    publicName: "Essencial",
    aiTier: "IA com limite inicial",
    aiLimit: "Até 400 mensagens/análises de IA por mês",
    aiDescription: "Ideal para começar a organizar dados e receber análises básicas.",
    displayPricesInCents: { MONTHLY: 5700, ANNUAL: 57000 },
  },
  PREMIUM: {
    publicName: "Premium",
    aiTier: "IA com limite intermediário",
    aiLimit: "Mais volume para análises, relatórios e recomendações da operação",
    aiDescription: "Mais uso de IA para empresas com atendimento, relatórios e rotina ativa.",
    displayPricesInCents: { MONTHLY: 9700, ANNUAL: 97000 },
  },
  PRO_BUSINESS: {
    publicName: "Business",
    aiTier: "IA com limite avançado",
    aiLimit: "Maior volume de IA para dados, canais e atendimento em escala",
    aiDescription: "Criado para operações com mais integrações, histórico e demanda de análise.",
    displayPricesInCents: { MONTHLY: 19700, ANNUAL: 197000 },
  },
};

export const getPublicPlanName = (planKey: BillingPlanKey, fallback: string) =>
  PLAN_DISPLAY[planKey]?.publicName || fallback;

export const getDisplayPlanAmountInCents = (
  planKey: BillingPlanKey,
  billingCycle: BillingCycle,
  fallbackAmountInCents: number,
) => PLAN_DISPLAY[planKey]?.displayPricesInCents[billingCycle] || fallbackAmountInCents;
