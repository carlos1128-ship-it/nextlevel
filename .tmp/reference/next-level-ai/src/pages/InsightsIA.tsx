import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

const insights = [
  {
    tag: "INSIGHT DIAGNÓSTICO",
    tagColor: "#7B8FF0",
    title: "Anomalia de Fluxo de Caixa",
    body: 'Diagnóstico: Para "hoje", as vendas e lucros estão perto de zero. Seu caixa, contudo, está em 9.655.556 (dado real), após 344.444 (dado real) em despesas de um capital de 10.000.000. Isso aponta para uma operação de alta inércia ou falha na integração de dados de PDV.',
    action: null,
  },
  {
    tag: "OPORTUNIDADE DE CRESCIMENTO",
    tagColor: "#B6FF00",
    title: "Ativação de Capital Retido",
    body: "Por que importa: Um caixa volumoso sem vendas ativas não gera margem, apenas corrói valor pela inflação e custos operacionais. Precisamos transformar esse capital estático em receita recorrente.",
    action: "Simular Cenários de Investimento →",
  },
  {
    tag: "AÇÃO RECOMENDADA TÁTICA",
    tagColor: "#C084FC",
    title: "Revisão Imediata de Captação",
    body: "Ação Recomendada: Valide a captação de dados de vendas nas últimas 24h. Priorize a auditoria das integrações de API focando em conciliação. Revise os custos fixos projetados para otimização imediata.",
    action: "Iniciar Auditoria de API 🔧",
  },
  {
    tag: "MÉTRICAS CHAVE",
    tagColor: "#424a33",
    title: "Snapshot Financeiro",
    body: null,
    metrics: [
      { label: "VENDAS HOJE", value: "0.00", neon: false },
      { label: "CAIXA ATUAL", value: "9.6M", neon: true },
      { label: "CUSTOS IDENTIFICADOS", value: "344k", neon: false },
      { label: "MARGEM PROJETADA", value: "--", neon: false },
    ],
  },
];

export default function InsightsIA() {
  return (
    <div className="flex min-h-screen" style={{ background: "#050706" }}>
      <Sidebar />
      <div className="flex-1" style={{ marginLeft: "220px" }}>
        <TopBar />
        <main className="pt-20 px-6 pb-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mt-4 mb-8">
            <div>
              <h2 style={{ fontSize: "36px", fontWeight: 700, color: "#e1e3de", margin: 0 }}>Insights IA</h2>
              <p style={{ color: "#c2caad", fontSize: "14px", marginTop: "6px" }}>
                Análises práticas geradas a partir dos dados reais da empresa.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                data-testid="badge-ia-ativa"
                className="flex items-center gap-2 px-4 py-2 rounded-full font-bold"
                style={{ background: "#1d201e", border: "1px solid #424a33", color: "#e1e3de", fontSize: "13px" }}
              >
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#B6FF00" }} />
                IA ATIVA
              </button>
              <button
                data-testid="button-gerar-insights"
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors"
                style={{ background: "#B6FF00", color: "#050706", fontSize: "14px", border: "none" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>auto_awesome</span>
                GERAR INSIGHTS
              </button>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, i) => (
              <div
                key={i}
                data-testid={`card-insight-${i}`}
                className="card-base p-6 relative flex flex-col justify-between"
                style={{ minHeight: "220px" }}
              >
                {/* Menu dots */}
                <button
                  data-testid={`button-more-${i}`}
                  className="absolute top-4 right-4"
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#c2caad" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>more_horiz</span>
                </button>

                {/* Tag */}
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: insight.tagColor,
                    marginBottom: "12px",
                  }}
                >
                  {insight.tag}
                </p>

                {/* Title */}
                <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#e1e3de", margin: "0 0 12px 0" }}>
                  {insight.title}
                </h3>

                {/* Body */}
                {insight.body && (
                  <p style={{ fontSize: "14px", color: "#c2caad", lineHeight: 1.6, flex: 1 }}>
                    {insight.body}
                  </p>
                )}

                {/* Metrics grid (for snapshot card) */}
                {insight.metrics && (
                  <div className="grid grid-cols-2 gap-3">
                    {insight.metrics.map((m) => (
                      <div key={m.label}>
                        <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c2caad", marginBottom: "4px" }}>
                          {m.label}
                        </p>
                        <p style={{ fontSize: "24px", fontWeight: 700, color: m.neon ? "#B6FF00" : "#e1e3de" }}>
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Button */}
                {insight.action && (
                  <button
                    data-testid={`button-action-${i}`}
                    className="mt-4 w-full py-2.5 rounded-lg transition-colors"
                    style={{
                      border: "1px solid #424a33",
                      color: "#e1e3de",
                      fontSize: "14px",
                      background: "transparent",
                    }}
                  >
                    {insight.action}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* More Tools Button */}
          <div className="mt-6">
            <button
              data-testid="button-mais-ferramentas"
              className="px-5 py-2.5 rounded-lg transition-colors"
              style={{ border: "1px solid #424a33", color: "#e1e3de", fontSize: "14px", background: "transparent" }}
            >
              MAIS FERRAMENTAS
            </button>
          </div>
        </main>

        {/* FAB */}
        <button
          data-testid="button-fab"
          className="fixed flex items-center justify-center rounded-full"
          style={{
            bottom: "32px",
            right: "32px",
            width: "52px",
            height: "52px",
            background: "#B6FF00",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(182,255,0,0.3)",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "#050706" }}>add</span>
        </button>
      </div>
    </div>
  );
}
