import type { BillingCycle, BillingPlanKey } from "../services/endpoints";

export const PLAN_DISPLAY: Record<
  BillingPlanKey,
  {
    publicName: string;
    summary: string;
    aiTier: string;
    aiLimitItems: string[];
    aiLimit: string;
    aiDescription: string;
    features: string[];
    cta: string;
    recommended: boolean;
    microcopy: string;
    displayPricesInCents: Record<BillingCycle, number>;
  }
> = {
  COMMON: {
    publicName: "Essencial",
    summary: "Para organizar vendas, custos e margem antes de escalar a operação.",
    aiTier: "Limites de IA do Essencial",
    aiLimitItems: [
      "Chat IA: 400 mensagens/mês",
      "Análises de dados: 30 por mês",
      "Atendente IA: não incluso",
    ],
    aiLimit: "Chat IA: 400 mensagens/mês • Análises de dados: 30 por mês • Atendente IA: não incluso",
    aiDescription: "Ideal para começar a organizar dados e enxergar os primeiros sinais de margem.",
    features: [
      "Painel para acompanhar a operação",
      "Cadastro manual de vendas, custos e produtos",
      "Visão inicial de lucro, vendas e finanças",
      "Relatórios simples para decisão",
      "Chat IA: 400 mensagens/mês",
      "Análises de dados com IA: 30 por mês",
      "Atendente IA: não incluso",
      "1 importação inteligente por dia",
      "Integrações automáticas não inclusas",
      "Suporte via e-mail",
    ],
    cta: "Assinar agora",
    recommended: false,
    microcopy: "Pagamento seguro.",
    displayPricesInCents: { MONTHLY: 5700, ANNUAL: 57000 },
  },
  PREMIUM: {
    publicName: "Premium",
    summary: "Para usar IA na rotina, recuperar oportunidades e acompanhar margem de perto.",
    aiTier: "Limites de IA do Premium",
    aiLimitItems: [
      "Chat IA: 1.000 mensagens/mês",
      "Análises de dados: 240 por mês",
      "WhatsApp: 3.000 mensagens/mês",
      "Instagram: 3.000 mensagens/mês",
    ],
    aiLimit: "Chat IA: 1.000 mensagens/mês • Análises de dados: 240 por mês • WhatsApp: 3.000 mensagens/mês • Instagram: 3.000 mensagens/mês",
    aiDescription: "Mais uso de IA para atendimento, relatórios e decisões do dia a dia.",
    features: [
      "Tudo do Essencial",
      "Mais volume para análises, relatórios e recomendações",
      "Chat IA: 1.000 mensagens/mês",
      "Análises de dados com IA: 240 por mês",
      "WhatsApp: 3.000 mensagens/mês",
      "Instagram: 3.000 mensagens/mês",
      "Até 10 empresas vinculadas",
      "WhatsApp + Instagram integrados",
      "Atendente IA para WhatsApp e Instagram",
      "Mercado Livre integrado",
      "Alertas de margem e pontos de atenção",
      "Relatórios automáticos semanais",
      "Recomendações práticas da IA",
      "Suporte prioritário",
      "Automações avançadas de escala em preparação",
    ],
    cta: "Ativar Premium",
    recommended: true,
    microcopy: "Pensado para crescer com margem e controle.",
    displayPricesInCents: { MONTHLY: 9700, ANNUAL: 97000 },
  },
  PRO_BUSINESS: {
    publicName: "Pro Business",
    summary: "Para operações com mais canais, volume e necessidade de previsibilidade.",
    aiTier: "Limites de IA do Pro Business",
    aiLimitItems: [
      "Chat IA: 5.000 mensagens/mês",
      "Análises de dados: ilimitadas",
      "WhatsApp: 10.000 mensagens/mês",
      "Instagram: 10.000 mensagens/mês",
    ],
    aiLimit: "Chat IA: 5.000 mensagens/mês • Análises de dados: ilimitadas • WhatsApp: 10.000 mensagens/mês • Instagram: 10.000 mensagens/mês",
    aiDescription: "Criado para operações com mais dados, canais e volume de atendimento.",
    features: [
      "Tudo do Premium",
      "Maior volume de IA para dados, canais e atendimento",
      "Chat IA: 5.000 mensagens/mês",
      "Análises de dados com IA: ilimitadas",
      "WhatsApp: 10.000 mensagens/mês",
      "Instagram: 10.000 mensagens/mês",
      "Empresas ilimitadas",
      "Mercado Livre e integrações em maior escala",
      "IA estratégica para decisões avançadas",
      "Automações inteligentes",
      "Inteligência de mercado",
      "Previsões e alertas avançados",
      "Importações inteligentes ilimitadas",
      "Prioridade em novas funcionalidades",
    ],
    cta: "Assinar Pro Business",
    recommended: false,
    microcopy: "Pensado para operações com mais canais, dados e escala.",
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

export const formatCurrencyInCents = (amountInCents: number) =>
  (amountInCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export const getDisplayPlanPrice = (planKey: BillingPlanKey, billingCycle: BillingCycle) =>
  formatCurrencyInCents(PLAN_DISPLAY[planKey].displayPricesInCents[billingCycle]);
