import { useState } from "react";
import Sidebar from "@/components/Sidebar";

interface IntegrationStatus {
  label: string;
  value: string;
  icon?: string;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  iconBg: string;
  iconLogo: string;
  buttonLabel: string;
  buttonColor?: string;
  statuses: IntegrationStatus[];
  connected: boolean;
}

const integrations: Integration[] = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    description:
      "Conecte o atendimento da sua empresa ao WhatsApp para centralizar comunicações e automatizar respostas com IA.",
    iconBg: "#25D366",
    iconLogo: "/logo-whatsapp.png",
    buttonLabel: "Conectar WhatsApp",
    connected: false,
    statuses: [
      { label: "STATUS", value: "Desconectado", icon: "circle" },
      { label: "SAÚDE", value: "Sincronizando", icon: "sync" },
      { label: "ATENDIMENTO IA", value: "Aguardando conexão", icon: "smart_toy" },
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    description:
      "Organize mensagens e oportunidades vindas do Direct do Instagram diretamente no seu pipeline.",
    iconBg: "#E1306C",
    iconLogo: "/logo-instagram.png",
    buttonLabel: "Conectar Instagram",
    connected: false,
    statuses: [
      { label: "STATUS", value: "Desconectado", icon: "circle" },
      { label: "CONTA", value: "Aguardando conexão", icon: "person" },
      { label: "OPORTUNIDADES", value: "Conecte para ativar", icon: "trending_up" },
    ],
  },
  {
    id: "mercadolivre",
    name: "Mercado Livre",
    description:
      "Conecte sua conta vendedora para importar produtos, pedidos, vendas e dados operacionais automaticamente.",
    iconBg: "#FFE600",
    iconLogo: "/logo-mercadolivre.png",
    buttonLabel: "Conectar Mercado Livre",
    connected: false,
    statuses: [
      { label: "STATUS", value: "Desconectado", icon: "circle" },
      { label: "CONTA", value: "Aguardando OAuth", icon: "lock" },
      { label: "RECEITA ML", value: "R$ 0,00", icon: "attach_money" },
      { label: "PRODUTOS", value: "0", icon: "inventory_2" },
      { label: "PEDIDOS", value: "0", icon: "receipt_long" },
      { label: "PERGUNTAS", value: "0 pendentes", icon: "help_outline" },
      { label: "ÚLTIMA SYNC", value: "Ainda não sincronizado", icon: "sync" },
    ],
  },
];

function StatusBadge({ label, value, icon }: IntegrationStatus) {
  const isDisconnected = value === "Desconectado";
  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-1"
      style={{ background: "#1d201e", border: "1px solid #424a33", minWidth: 0 }}
    >
      <p
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#c2caad",
          margin: 0,
        }}
      >
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        {icon === "circle" && (
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: isDisconnected ? "#ffb4ab" : "#B6FF00",
              flexShrink: 0,
            }}
          />
        )}
        {icon && icon !== "circle" && (
          <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#c2caad" }}>
            {icon}
          </span>
        )}
        <span
          style={{
            fontSize: "13px",
            color: isDisconnected ? "#ffb4ab" : "#e1e3de",
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

export default function Integracoes() {
  const [items, setItems] = useState(integrations);

  const handleConnect = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, connected: !item.connected } : item
      )
    );
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#050706" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col" style={{ marginLeft: "220px" }}>
        {/* Top Nav */}
        <header
          className="fixed top-0 right-0 z-40 flex items-center justify-between px-6 h-14"
          style={{
            left: "220px",
            background: "rgba(17,20,18,0.8)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #424a33",
          }}
        >
          <div className="flex items-center gap-6">
            <button
              data-testid="tab-dashboard"
              className="transition-colors"
              style={{ fontSize: "14px", color: "#c2caad", background: "transparent", border: "none", cursor: "pointer", fontWeight: 500 }}
            >
              Dashboard
            </button>
            <button
              data-testid="tab-system-status"
              className="transition-colors"
              style={{ fontSize: "14px", color: "#c2caad", background: "transparent", border: "none", cursor: "pointer", fontWeight: 500 }}
            >
              System Status
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              data-testid="button-create-new"
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors"
              style={{ background: "#B6FF00", color: "#050706", fontSize: "14px", border: "none", cursor: "pointer" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
              Create New
            </button>
            <button
              data-testid="button-settings-top"
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#c2caad" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>settings</span>
            </button>
            <button
              data-testid="button-help"
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#c2caad" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>help_outline</span>
            </button>
            <button
              data-testid="button-notifications"
              className="relative w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "#c2caad" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>notifications</span>
              <span
                className="absolute rounded-full"
                style={{ top: "4px", right: "4px", width: "7px", height: "7px", background: "#ffb4ab", border: "1.5px solid #050706" }}
              />
            </button>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "#B6FF00", color: "#050706" }}
            >
              C
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="pt-14 px-6 pb-10">
          {/* Page header */}
          <div className="mt-8 mb-6">
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#c2caad",
                marginBottom: "6px",
              }}
            >
              INTEGRAÇÕES
            </p>
            <h1
              style={{
                fontSize: "40px",
                fontWeight: 700,
                color: "#B6FF00",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Canais conectados ao lucro
            </h1>
          </div>

          {/* Integration Cards */}
          <div className="flex flex-col gap-4">
            {items.map((integration) => {
              const isML = integration.id === "mercadolivre";
              const regularStatuses = isML ? integration.statuses.slice(0, 4) : integration.statuses;
              const extraStatuses = isML ? integration.statuses.slice(4) : [];

              return (
                <div
                  key={integration.id}
                  data-testid={`card-integration-${integration.id}`}
                  className="rounded-2xl p-5"
                  style={{ background: "#111613", border: "1px solid #424a33" }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{ background: `${integration.iconBg}22`, border: `1px solid ${integration.iconBg}44` }}
                      >
                        <img
                          src={integration.iconLogo}
                          alt={integration.name}
                          className="w-full h-full object-contain"
                          style={{ padding: "6px" }}
                        />
                      </div>
                      {/* Name + desc */}
                      <div>
                        <h3
                          style={{
                            fontSize: "20px",
                            fontWeight: 700,
                            color: "#e1e3de",
                            margin: "0 0 4px 0",
                          }}
                        >
                          {integration.name}
                        </h3>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#c2caad",
                            margin: 0,
                            maxWidth: "460px",
                            lineHeight: 1.5,
                          }}
                        >
                          {integration.description}
                        </p>
                      </div>
                    </div>

                    {/* Connect button */}
                    <button
                      data-testid={`button-connect-${integration.id}`}
                      onClick={() => handleConnect(integration.id)}
                      className="px-5 py-2.5 rounded-lg font-bold transition-all flex-shrink-0"
                      style={{
                        background: integration.connected ? "transparent" : "#B6FF00",
                        color: integration.connected ? "#B6FF00" : "#050706",
                        border: integration.connected ? "1px solid #B6FF00" : "none",
                        fontSize: "14px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {integration.connected ? "Desconectar" : integration.buttonLabel}
                    </button>
                  </div>

                  {/* Status grid */}
                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: `repeat(${regularStatuses.length}, 1fr)`,
                    }}
                  >
                    {regularStatuses.map((s) => (
                      <StatusBadge key={s.label} {...s} />
                    ))}
                  </div>

                  {/* Extra row for Mercado Livre */}
                  {extraStatuses.length > 0 && (
                    <div
                      className="grid gap-3 mt-3"
                      style={{
                        gridTemplateColumns: `repeat(${extraStatuses.length}, 1fr)`,
                      }}
                    >
                      {extraStatuses.map((s) => (
                        <StatusBadge key={s.label} {...s} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
