import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

const kpis = [
  {
    icon: "account_balance_wallet",
    label: "Faturamento",
    value: "R$ 1.2M",
    change: "+12.5%",
    positive: true,
    highlighted: false,
  },
  {
    icon: "trending_down",
    label: "Perdas",
    value: "R$ 45K",
    change: "-2.4%",
    positive: false,
    highlighted: false,
  },
  {
    icon: "insights",
    label: "Lucro líquido",
    value: "R$ 480K",
    change: "+18.2%",
    positive: true,
    highlighted: true,
  },
  {
    icon: "swap_horiz",
    label: "Fluxo de caixa",
    value: "R$ 850K",
    change: "+5.1%",
    positive: true,
    highlighted: false,
  },
];

const metrics = [
  { label: "Margem", value: "32.4%", neon: false },
  { label: "CAC", value: "R$ 150", neon: false },
  { label: "ROAS", value: "4.2x", neon: false },
  { label: "MRR", value: "R$ 45K", neon: true },
];

const periods = ["Hoje", "Ontem", "7 dias", "Mês", "Ano"];

export default function Dashboard() {
  const [activePeriod, setActivePeriod] = useState("7 dias");
  const [chartView, setChartView] = useState<"Mensal" | "Semanal">("Semanal");

  return (
    <div className="flex min-h-screen" style={{ background: "#050706" }}>
      <Sidebar />
      <div className="flex-1" style={{ marginLeft: "220px" }}>
        <TopBar />
        <main className="pt-20 px-6 pb-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 mt-4">
            <div>
              <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#e1e3de", margin: 0, lineHeight: 1.2 }}>
                Visão Geral
              </h2>
              <p style={{ color: "#c2caad", fontSize: "14px", marginTop: "4px" }}>
                Panorama estratégico da empresa no período selecionado.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                data-testid="button-personalizar"
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{ border: "1px solid #424a33", color: "#e1e3de", fontSize: "14px", background: "transparent" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>tune</span>
                Personalizar
              </button>
              <button
                data-testid="button-exportar"
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{ border: "1px solid #424a33", color: "#e1e3de", fontSize: "14px", background: "transparent" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>download</span>
                Exportar relatório
              </button>
              <button
                data-testid="button-atualizar"
                className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold transition-colors"
                style={{ background: "#B6FF00", color: "#050706", fontSize: "14px", border: "none" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>refresh</span>
                Atualizar
              </button>
            </div>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-2 mb-6 pb-3" style={{ borderBottom: "1px solid #424a33" }}>
            {periods.map((p) => (
              <button
                key={p}
                data-testid={`filter-period-${p.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setActivePeriod(p)}
                className="px-4 py-1.5 rounded-full font-medium transition-colors"
                style={{
                  fontSize: "13px",
                  color: activePeriod === p ? "#B6FF00" : "#c2caad",
                  background: activePeriod === p ? "#171D1A" : "transparent",
                  border: activePeriod === p ? "1px solid #B6FF00" : "1px solid transparent",
                }}
              >
                {p}
              </button>
            ))}
            <span style={{ marginLeft: "auto", fontSize: "13px", color: "#c2caad" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", verticalAlign: "middle", marginRight: "4px" }}>
                calendar_today
              </span>
              14 Out - 21 Out, 2025
            </span>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                data-testid={`card-kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="card-base p-5 flex flex-col justify-between cursor-default transition-shadow"
                style={{
                  minHeight: "120px",
                  borderLeft: kpi.highlighted ? "4px solid #B6FF00" : undefined,
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: kpi.highlighted ? "rgba(182,255,0,0.1)" : "#272b28" }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "20px", color: kpi.highlighted ? "#B6FF00" : "#c2caad" }}
                    >
                      {kpi.icon}
                    </span>
                  </div>
                  <span
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold"
                    style={{
                      color: kpi.positive ? "#B6FF00" : "#ffb4ab",
                      background: kpi.positive ? "rgba(182,255,0,0.1)" : "rgba(255,180,171,0.1)",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                      {kpi.positive ? "trending_up" : "trending_down"}
                    </span>
                    {kpi.change}
                  </span>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#c2caad",
                      marginBottom: "4px",
                    }}
                  >
                    {kpi.label}
                  </p>
                  <h3
                    data-testid={`value-kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}
                    style={{ fontSize: "28px", fontWeight: 700, color: "#e1e3de", margin: 0, lineHeight: 1.1 }}
                  >
                    {kpi.value}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Left: Chart + Metrics */}
            <div className="xl:col-span-2 flex flex-col gap-4">
              {/* Chart */}
              <div className="card-base p-5">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#e1e3de", margin: 0 }}>
                      Fluxo por faixa
                    </h3>
                    <p style={{ fontSize: "13px", color: "#c2caad", marginTop: "2px" }}>
                      Análise de vendas e fluxo financeiro
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {(["Mensal", "Semanal"] as const).map((v) => (
                      <button
                        key={v}
                        data-testid={`button-chart-${v.toLowerCase()}`}
                        onClick={() => setChartView(v)}
                        className="px-3 py-1 rounded text-xs transition-colors"
                        style={{
                          border: chartView === v ? "1px solid #B6FF00" : "1px solid #424a33",
                          color: chartView === v ? "#B6FF00" : "#e1e3de",
                          background: chartView === v ? "rgba(182,255,0,0.08)" : "transparent",
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Chart */}
                <div
                  className="relative"
                  style={{ height: "220px", borderBottom: "1px solid rgba(66,74,51,0.5)", borderLeft: "1px solid rgba(66,74,51,0.5)" }}
                >
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ opacity: 0.2 }}>
                    {[0,1,2,3,4].map((i) => (
                      <div key={i} style={{ borderTop: "1px solid #424a33", width: "100%" }} />
                    ))}
                  </div>
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="neon-gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#B6FF00" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,80 Q10,70 20,85 T40,60 T60,40 T80,30 T100,10"
                      fill="none"
                      stroke="#B6FF00"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d="M0,80 Q10,70 20,85 T40,60 T60,40 T80,30 T100,10 L100,100 L0,100 Z"
                      fill="url(#neon-gradient)"
                      opacity="0.1"
                    />
                    <circle cx="60" cy="40" r="1.5" fill="#111613" stroke="#B6FF00" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                    <circle cx="80" cy="30" r="1.5" fill="#111613" stroke="#B6FF00" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                  </svg>
                  {/* X Axis */}
                  <div
                    className="absolute flex justify-between"
                    style={{ bottom: "-22px", left: "4px", right: "0", fontSize: "12px", color: "#c2caad" }}
                  >
                    {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {metrics.map((m) => (
                  <div
                    key={m.label}
                    data-testid={`card-metric-${m.label.toLowerCase()}`}
                    className="card-base p-4"
                  >
                    <p style={{ fontSize: "12px", color: "#c2caad", marginBottom: "4px" }}>{m.label}</p>
                    <p
                      style={{ fontSize: "18px", fontWeight: 700, color: m.neon ? "#B6FF00" : "#e1e3de" }}
                    >
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: AI Panel */}
            <div className="xl:col-span-1 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center animate-pulse-glow"
                  style={{ background: "rgba(182,255,0,0.2)" }}
                >
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#B6FF00" }} />
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#e1e3de" }}>
                  NEXT LEVEL entende o negócio inteiro
                </h3>
              </div>

              {/* Insight Card */}
              <div
                className="card-base p-5"
                style={{ border: "1px solid rgba(182,255,0,0.3)", background: "linear-gradient(135deg, #111613, #171d1a)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#B6FF00" }}>lightbulb</span>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#e1e3de" }}>Insight de hoje</h4>
                </div>
                <p style={{ fontSize: "13px", color: "#c2caad", lineHeight: 1.6 }}>
                  Notamos um aumento de 15% na conversão de leads vindos do Instagram na última semana. Sugerimos realocar 10% da verba de Ads para esta plataforma.
                </p>
                <button
                  data-testid="button-aplicar-recomendacao"
                  className="mt-3 flex items-center gap-1 font-bold"
                  style={{ fontSize: "12px", color: "#B6FF00", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Aplicar recomendação
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>arrow_forward</span>
                </button>
              </div>

              {/* Risk Card */}
              <div className="card-base p-5" style={{ border: "1px solid rgba(255,180,171,0.2)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#ffb4ab" }}>warning</span>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#e1e3de" }}>Risco principal</h4>
                </div>
                <p style={{ fontSize: "13px", color: "#c2caad", lineHeight: 1.6 }}>
                  A taxa de churn subiu 0.5% no produto "Premium". Há 12 clientes em risco iminente de cancelamento.
                </p>
                <div className="mt-3">
                  <span
                    className="px-2 py-1 rounded text-xs font-bold uppercase"
                    style={{ background: "rgba(255,180,171,0.1)", color: "#ffb4ab" }}
                  >
                    Ação necessária
                  </span>
                </div>
              </div>

              {/* Opportunity Card */}
              <div className="card-base p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#B6FF00" }}>radar</span>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#e1e3de" }}>Oportunidade</h4>
                </div>
                <p style={{ fontSize: "13px", color: "#c2caad", lineHeight: 1.6 }}>
                  45 clientes antigos não compram há mais de 6 meses. Uma campanha de reativação pode gerar ~R$ 22K.
                </p>
              </div>

              {/* WhatsApp Card */}
              <div className="card-base p-5" style={{ borderLeft: "3px solid #25D366" }}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#25D366" }}>chat</span>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#e1e3de" }}>WhatsApp / Atendimento</h4>
                  </div>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#25D366" }} />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span style={{ fontSize: "13px", color: "#c2caad" }}>Tickets abertos</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#e1e3de" }}>24</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ fontSize: "13px", color: "#c2caad" }}>Tempo de resposta (IA)</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#B6FF00" }}>&lt; 1 min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
