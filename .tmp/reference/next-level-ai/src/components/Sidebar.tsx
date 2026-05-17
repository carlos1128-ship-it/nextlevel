import { Link, useLocation } from "wouter";

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Principal",
    items: [
      { icon: "home", label: "Início", href: "/" },
      { icon: "bar_chart", label: "Relatórios", href: "/relatorios" },
    ],
  },
  {
    title: "Inteligência",
    items: [
      { icon: "smart_toy", label: "Chat IA", href: "/chat-ia" },
      { icon: "support_agent", label: "Atendente IA", href: "/atendente-ia" },
      { icon: "lightbulb", label: "Insights", href: "/insights" },
    ],
  },
  {
    title: "Dados",
    items: [
      { icon: "add_circle", label: "Adicionar dados", href: "/adicionar-dados" },
      { icon: "sync_alt", label: "Integrações", href: "/integracoes" },
    ],
  },
  {
    title: "Negócios",
    items: [
      { icon: "campaign", label: "Marketing", href: "/marketing" },
      { icon: "architecture", label: "Projetos/Metragem", href: "/projetos" },
      { icon: "inventory_2", label: "Produtos e Serviços", href: "/produtos" },
      { icon: "group", label: "Clientes", href: "/clientes" },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { icon: "payments", label: "Custos/Metragem", href: "/custos" },
      { icon: "account_balance", label: "Fluxo financeiro", href: "/fluxo" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { icon: "business", label: "Empresas", href: "/empresas" },
      { icon: "data_usage", label: "Uso do plano", href: "/uso-plano" },
      { icon: "workspace_premium", label: "Planos", href: "/planos" },
      { icon: "settings", label: "Configurações", href: "/configuracoes" },
      { icon: "person", label: "Perfil", href: "/perfil" },
    ],
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col border-r z-50"
      style={{ width: "220px", background: "#191c1a", borderColor: "#424a33" }}
    >
      <div className="flex flex-col h-full py-6 px-4">
        {/* Brand */}
        <div className="mb-5 px-1">
          <div className="text-xl font-bold" style={{ color: "#B6FF00" }}>NEXT LEVEL</div>
          <div className="text-xs" style={{ color: "#c2caad" }}>Operational Control</div>
        </div>

        {/* CTA */}
        <Link href="/" asChild>
          <button
            data-testid="button-novo-projeto"
            className="w-full py-2.5 rounded-lg font-bold mb-6 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            style={{ background: "#B6FF00", color: "#050706", fontSize: "14px", border: "none" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
            Novo Projeto
          </button>
        </Link>

        {/* Nav Groups */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll flex flex-col gap-1 pr-1">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-3">
              <p
                className="px-3 mb-1"
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#c2caad",
                  lineHeight: 1,
                }}
              >
                {group.title}
              </p>
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} asChild>
                    <button
                      data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                      style={{
                        fontSize: "14px",
                        fontWeight: active ? 700 : 500,
                        color: active ? "#B6FF00" : "#c2caad",
                        background: active ? "rgba(50,54,50,0.5)" : "transparent",
                        borderLeft: active ? "3px solid #B6FF00" : "3px solid transparent",
                        border: "none",
                        textAlign: "left",
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: "20px",
                          fontVariationSettings: active ? '"FILL" 1' : '"FILL" 0',
                        }}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-4" style={{ borderTop: "1px solid #424a33" }}>
          <Link href="/suporte" asChild>
            <button
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer"
              style={{ color: "#c2caad", fontSize: "14px", fontWeight: 500, background: "transparent", border: "none", textAlign: "left" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>help</span>
              <span>Suporte</span>
            </button>
          </Link>
          <button
            data-testid="nav-sair"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer"
            style={{ color: "#c2caad", fontSize: "14px", fontWeight: 500, background: "transparent", border: "none", textAlign: "left" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>logout</span>
            <span>Sair</span>
          </button>

          {/* User */}
          <div className="flex items-center gap-3 px-3 py-3 mt-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: "#B6FF00", color: "#050706" }}
            >
              C
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#e1e3de" }}>Carlos Henrique</div>
              <div style={{ fontSize: "11px", color: "#c2caad" }}>Estratégico</div>
            </div>
          </div>

          <button
            data-testid="button-upgrade"
            className="w-full py-2 rounded-lg font-bold mt-1 transition-colors cursor-pointer"
            style={{ background: "transparent", border: "1px solid #B6FF00", color: "#B6FF00", fontSize: "13px" }}
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    </aside>
  );
}
