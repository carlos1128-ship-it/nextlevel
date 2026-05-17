import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Bell, CircleHelp, Search } from "lucide-react";
import type { NavItem } from "../types";
import {
  HomeIcon,
  BarChartIcon,
  MessageSquareIcon,
  SettingsIcon,
  UserIcon,
  PuzzleIcon,
  BuildingIcon,
  LightbulbIcon,
  DollarSignIcon,
  PlusIcon,
  CreditCardIcon,
  PackageIcon,
  UsersIcon,
  ReceiptIcon,
  RadarIcon,
  ShieldIcon,
  ActivityIcon,
} from "./icons";
import { useAuth } from "../App";
import { useToast } from "./Toast";
import { getCompanyPersonalization, updateUserProfile } from "../src/services/endpoints";
import { getErrorMessage } from "../src/services/error";
import type { CompanyModulePreference, UserNiche } from "../src/types/domain";
import NicheModal, { type CompanyStage } from "../src/components/onboarding/NicheModal";
import { DASHBOARD_ROUTE } from "../src/app/routes";

type SidebarNavItem = NavItem & { id: string };

interface NavItemDef {
  id: string;
  path: string;
  name: string;
  icon: React.FC<{ className?: string }>;
  isPrimary?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItemDef[];
}

const navGroups: NavGroup[] = [
  {
    title: "Principal",
    items: [
      { id: "home", path: DASHBOARD_ROUTE, name: "Início", icon: HomeIcon, isPrimary: true },
      { id: "reports", path: "/reports", name: "Relatórios", icon: BarChartIcon, isPrimary: true },
    ],
  },
  {
    title: "Inteligência",
    items: [
      { id: "chat", path: "/chat", name: "Chat IA", icon: MessageSquareIcon, isPrimary: true },
      { id: "attendant", path: "/attendant", name: "Atendente IA", icon: MessageSquareIcon, isPrimary: true },
      { id: "insights", path: "/insights", name: "Insights", icon: LightbulbIcon, isPrimary: true },
    ],
  },
  {
    title: "Dados",
    items: [
      { id: "add-data", path: "/add-data", name: "Adicionar dados", icon: PlusIcon },
      { id: "integrations", path: "/integrations", name: "Integrações", icon: PuzzleIcon },
    ],
  },
  {
    title: "Negócios",
    items: [
      { id: "market", path: "/market-intel", name: "Marketing", icon: RadarIcon },
      { id: "projects", path: "/command-center", name: "Projetos", icon: BarChartIcon },
      { id: "products", path: "/products", name: "Produtos e Serviços", icon: PackageIcon },
      { id: "orders", path: "/orders", name: "Pedidos", icon: ReceiptIcon },
      { id: "customers", path: "/customers", name: "Clientes", icon: UsersIcon },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { id: "costs", path: "/costs", name: "Custos", icon: ReceiptIcon },
      { id: "financial-flow", path: "/financial-flow", name: "Fluxo financeiro", icon: DollarSignIcon },
    ],
  },
  {
    title: "Sistema",
    items: [
      { id: "companies", path: "/companies", name: "Empresas", icon: BuildingIcon },
      { id: "usage", path: "/usage", name: "Uso do plano", icon: ActivityIcon },
      { id: "plans", path: "/plans", name: "Planos", icon: CreditCardIcon },
      { id: "settings", path: "/settings", name: "Configurações", icon: SettingsIcon },
      { id: "profile", path: "/profile", name: "Perfil", icon: UserIcon },
    ],
  },
];

const navItems: SidebarNavItem[] = navGroups.flatMap(g => g.items);

const adminNavItem: SidebarNavItem = {
  id: "admin-system-health",
  path: "/admin/system-health",
  name: "Saúde do sistema",
  icon: ShieldIcon,
};

const MODULE_KEY_BY_NAV_ID: Record<string, string> = {
  home: "dashboard",
  reports: "reports",
  chat: "chat",
  attendant: "attendant",
  insights: "insights",
  market: "market_intelligence",
  projects: "automations",
  "add-data": "data_imports",
  products: "products",
  orders: "orders",
  customers: "customers",
  costs: "costs",
  plans: "plans",
  usage: "usage",
  settings: "settings",
  profile: "profile",
  integrations: "integrations",
  companies: "companies",
  "financial-flow": "financial",
};

const COMPANY_STAGE_STORAGE_KEY = "nextlevel:onboarding-company-stage";
const NICHE_MODAL_DONE_PREFIX = "nextlevel:niche-modal-done:";
const SIDEBAR_PREF_CACHE_PREFIX = "nextlevel:sidebar-module-preferences:";
const DEFAULT_COMPANY_STAGE: CompanyStage = "ESCALANDO";
const DEFAULT_VISIBLE_NAV_IDS = new Set([
  "home",
  "reports",
  "chat",
  "attendant",
  "insights",
  "add-data",
  "integrations",
  "usage",
  "settings",
  "profile",
  "plans",
]);

function readStoredCompanyStage(): CompanyStage {
  const raw = localStorage.getItem(COMPANY_STAGE_STORAGE_KEY);
  if (raw === "INICIANTE" || raw === "ESCALANDO" || raw === "ENTERPRISE") {
    return raw;
  }
  return DEFAULT_COMPANY_STAGE;
}

function moveItemsToFront(items: SidebarNavItem[], ids: string[]) {
  const front = ids
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is SidebarNavItem => Boolean(item));
  const remaining = items.filter((item) => !ids.includes(item.id));
  return [...front, ...remaining];
}

function resolveNavItems(isAdmin: boolean, niche: UserNiche | null): SidebarNavItem[] {
  let items = navItems.map((item) =>
    item.id === "projects" && niche === "SERVICOS"
        ? { ...item, name: "Projetos/Metragem" }
        : item.id === "costs" && niche === "SERVICOS"
          ? { ...item, name: "Custos/Metragem" }
      : item,
  );

  if (niche === "SERVICOS") {
    items = moveItemsToFront(items, ["costs", "projects"]);
  }

  if (niche === "ECOMMERCE") {
    items = moveItemsToFront(items, ["products", "orders", "market", "financial-flow"]);
  }

  return isAdmin ? [...items, adminNavItem] : items;
}

function splitNavItemsByModulePreferences(
  items: SidebarNavItem[],
  modulePreferences: CompanyModulePreference[] | null,
) {
  if (!modulePreferences?.length) {
    return {
      primaryItems: items.filter((item) => DEFAULT_VISIBLE_NAV_IDS.has(item.id) || item.isPrimary),
      moreItems: items.filter((item) => !(DEFAULT_VISIBLE_NAV_IDS.has(item.id) || item.isPrimary)),
    };
  }

  const preferenceByModule = new Map(modulePreferences.map((item) => [item.moduleKey, item]));
  const withPreference = items.map((item, index) => {
    const moduleKey = MODULE_KEY_BY_NAV_ID[item.id] || item.id;
    const preference = preferenceByModule.get(moduleKey);
    const alwaysVisible = DEFAULT_VISIBLE_NAV_IDS.has(item.id);
    return {
      item,
      enabled: alwaysVisible || (preference?.enabled ?? false),
      order: preference?.order ?? index,
      alwaysVisible,
    };
  });

  return {
    primaryItems: withPreference
      .filter((entry) => entry.enabled)
      .sort((a, b) => Number(b.alwaysVisible) - Number(a.alwaysVisible) || a.order - b.order)
      .map((entry) => entry.item),
    moreItems: withPreference
      .filter((entry) => !entry.enabled)
      .sort((a, b) => a.order - b.order)
      .map((entry) => entry.item),
  };
}

function readCachedModulePreferences(companyId: string | null): CompanyModulePreference[] | null {
  if (!companyId) return null;
  const raw = sessionStorage.getItem(`${SIDEBAR_PREF_CACHE_PREFIX}${companyId}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CompanyModulePreference[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedModulePreferences(companyId: string | null, preferences: CompanyModulePreference[]) {
  if (!companyId) return;
  sessionStorage.setItem(`${SIDEBAR_PREF_CACHE_PREFIX}${companyId}`, JSON.stringify(preferences));
}

function readNicheModalDone(key: string) {
  return localStorage.getItem(`${NICHE_MODAL_DONE_PREFIX}${key}`) === "1";
}

function writeNicheModalDone(key: string) {
  localStorage.setItem(`${NICHE_MODAL_DONE_PREFIX}${key}`, "1");
}

const Sidebar = ({ primaryItems, moreItems }: { primaryItems: SidebarNavItem[]; moreItems: SidebarNavItem[] }) => {
  const { username, logout } = useAuth();
  const location = useLocation();

  const isItemActive = (path: string) => {
    if (path === DASHBOARD_ROUTE) return location.pathname === DASHBOARD_ROUTE;
    return location.pathname.startsWith(path);
  };

  const groupedPrimary = useMemo(() => {
    return navGroups.map(group => ({
      title: group.title,
      items: group.items.filter(item => primaryItems.some(p => p.id === item.id))
    })).filter(g => g.items.length > 0);
  }, [primaryItems]);

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[280px] flex-col border-r border-[#424a33]/55 bg-[#111412] px-4 py-6 text-zinc-100 shadow-[18px_0_50px_rgba(0,0,0,0.24)] lg:flex">
      <div className="mb-5 px-1">
        <Link to={DASHBOARD_ROUTE} className="group inline-flex items-center gap-3" aria-label="Ir para o início">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#B6FF00]/20 bg-[#B6FF00]/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <span className="h-4 w-4 rounded-[5px] border border-[#B6FF00]/70 bg-[radial-gradient(circle,#B6FF00_1px,transparent_1.7px)] bg-[length:5px_5px]" />
          </span>
          <span className="inline-flex flex-col">
            <span className="text-[22px] font-extrabold uppercase leading-none tracking-[-0.03em] text-zinc-100">NEXT LEVEL</span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8c9479]">ERP + IA</span>
          </span>
        </Link>
      </div>

      <label className="mb-5 flex h-[42px] items-center gap-3 rounded-lg border border-white/[0.08] bg-[#0c0f0c] px-3 text-[#7D8782] focus-within:border-[#B6FF00]/35 focus-within:text-[#B6FF00]">
        <Search className="h-4 w-4 shrink-0" strokeWidth={2} />
        <input
          type="search"
          placeholder="Buscar módulos..."
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-zinc-100 outline-none placeholder:text-[#7D8782]"
        />
      </label>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
        <nav className="flex flex-col gap-4" aria-label="Menu principal">
          {groupedPrimary.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#7D8782]">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isItemActive(item.path);
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={`group flex min-h-[48px] items-center gap-3 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                          active
                            ? "bg-[#1f251f] text-[#B6FF00] shadow-[inset_4px_0_0_#B6FF00]"
                            : "text-[#c2caad] hover:bg-white/[0.035] hover:text-zinc-100"
                        }`}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-[#B6FF00]" : "text-[#8c9479] group-hover:text-zinc-300"}`} />
                        <span className="truncate">{item.name}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {moreItems.length > 0 && (
            <div>
              <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#7D8782]">
                Outros
              </p>
              <ul className="space-y-0.5">
                {moreItems.map((item) => {
                  const active = isItemActive(item.path);
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={`group flex min-h-[48px] items-center gap-3 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                          active
                            ? "bg-[#1f251f] text-[#B6FF00] shadow-[inset_4px_0_0_#B6FF00]"
                            : "text-[#c2caad] hover:bg-white/[0.035] hover:text-zinc-100"
                        }`}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-[#B6FF00]" : "text-[#8c9479] group-hover:text-zinc-300"}`} />
                        <span className="truncate">{item.name}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </nav>
      </div>

      <div className="mt-4 border-t border-white/[0.06] pt-4">
        <Link to="/settings" className="mb-3 flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-[#c2caad] transition-colors hover:bg-white/[0.035] hover:text-zinc-100">
          <SettingsIcon className="h-4 w-4 text-[#8c9479]" />
          <span>Configurações</span>
        </Link>
        <Link to="/profile" className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#191c1a] p-3 transition-colors hover:bg-[#1d201e]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-300/10 text-sm font-black text-[#B6FF00]">
            {username?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-zinc-100">{username || "Administrador"}</p>
            <p className="text-[10px] uppercase tracking-widest text-[#7D8782]">Conta NEXT LEVEL</p>
          </div>
        </Link>
        <button
          onClick={logout}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <PlusIcon className="h-4 w-4 rotate-45" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

const Header = () => {
  const { username, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex min-h-[80px] items-center justify-between border-b border-white/[0.06] bg-[#111412]/88 px-4 backdrop-blur-xl md:px-6 lg:px-10">
      <div className="lg:hidden">
        <p className="text-lg font-black text-[#B6FF00]">NEXT LEVEL</p>
        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-500">Empowerment</p>
      </div>
      <div className="hidden min-w-0 lg:block">
        <label className="flex h-[42px] w-[256px] items-center gap-3 rounded-lg border border-white/[0.1] bg-[#0c0f0c] px-3 text-[#B7C0BA] focus-within:border-[#B6FF00]/35">
          <Search className="h-4 w-4" strokeWidth={2} />
          <input
            type="search"
            placeholder="Search for..."
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-zinc-100 outline-none placeholder:text-[#B7C0BA]"
          />
        </label>
      </div>
      <div className="flex items-center gap-3 md:gap-5">
        {isAdmin && (
          <Link to="/admin/system-health" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-all hover:border-lime-300/35 hover:text-[#B6FF00]" title="Painel admin">
            <ShieldIcon className="h-4 w-4" />
          </Link>
        )}
        <Link to="/settings" className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition-all hover:bg-white/[0.04] hover:text-[#B6FF00]" title="Notificações">
          <Bell className="h-4 w-4" strokeWidth={2} />
        </Link>
        <Link to="/settings" className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition-all hover:bg-white/[0.04] hover:text-[#B6FF00]" title="Ajuda">
          <CircleHelp className="h-4 w-4" strokeWidth={2} />
        </Link>
        <div className="h-6 w-px bg-white/[0.06]" />
        <Link to="/profile" className="group flex items-center gap-3 rounded-xl border border-transparent p-1 transition-all hover:bg-white/[0.03]" aria-label="Menu do usuário">
          <div className="hidden text-right md:block">
            <p className="text-xs font-bold text-zinc-100 transition-colors group-hover:text-[#B6FF00]">{username || "Usuário"}</p>
            <p className="text-[9px] uppercase tracking-[0.16em] text-zinc-500">Account settings</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime-300/10 text-xs font-black text-[#B6FF00]">
            {username?.charAt(0).toUpperCase() || "U"}
          </div>
        </Link>
      </div>
    </header>
  );
};

const BottomNav = ({ items }: { items: SidebarNavItem[] }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around overflow-x-auto border-t border-white/[0.08] bg-[#080D0B]/95 p-2 backdrop-blur-xl lg:hidden" aria-label="Menu Mobile">
    {(Array.isArray(items) ? items : []).filter((item) => item.isPrimary).map((item) => (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) =>
          `relative flex min-w-[72px] flex-1 flex-col items-center rounded-xl border p-2 text-[10px] font-bold uppercase tracking-tight transition-all ${
            isActive ? "border-lime-300/30 bg-lime-300/10 text-[#B6FF00]" : "border-transparent text-zinc-500"
          }`
        }
      >
        <item.icon className="h-5 w-5" />
        <span className="mt-1 max-w-[68px] truncate">{item.name}</span>
      </NavLink>
    ))}
  </nav>
);

const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { name: "Nova empresa", icon: BuildingIcon, path: "/companies" },
    { name: "Novo Relatório", icon: BarChartIcon, path: "/reports" },
    { name: "Nova conversa", icon: MessageSquareIcon, path: "/chat" },
  ];

  return (
    <div className="fixed bottom-24 right-5 z-50 lg:bottom-10 lg:right-10">
      {isOpen ? (
        <div className="mb-4 flex flex-col items-center space-y-4" role="menu">
          {actions.map((action) => (
            <Link
              key={action.name}
              to={action.path}
              onClick={() => setIsOpen(false)}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.1] bg-[#111613] text-zinc-100 transition-all hover:scale-105 hover:border-lime-300/45 hover:text-[#B6FF00]"
              role="menuitem"
            >
              <action.icon className="h-5 w-5" />
            </Link>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl transition-all duration-300 ${
          isOpen ? "bg-red-500 text-white" : "bg-[#B6FF00] text-[#050706] shadow-[0_16px_38px_rgba(182,255,0,0.18)]"
        }`}
        aria-label={isOpen ? "Fechar menu de ações" : "Abrir menu de ações"}
        aria-expanded={isOpen}
      >
        <PlusIcon className="h-7 w-7" />
      </button>
    </div>
  );
};

const Layout = ({ children }: { children: ReactNode }) => {
  const { isAdmin, niche, selectedCompanyId, email, setNiche } = useAuth();
  const { addToast } = useToast();
  const nicheModalKey = selectedCompanyId || email?.trim().toLowerCase() || "global";
  const [selectedNiche, setSelectedNiche] = useState<UserNiche | null>(niche);
  const [selectedStage, setSelectedStage] = useState<CompanyStage>(() => readStoredCompanyStage());
  const [savingNiche, setSavingNiche] = useState(false);
  const [nicheModalDismissed, setNicheModalDismissed] = useState(() => readNicheModalDone(nicheModalKey));
  const [modulePreferences, setModulePreferences] = useState<CompanyModulePreference[] | null>(() =>
    readCachedModulePreferences(selectedCompanyId),
  );
  const items = useMemo(() => resolveNavItems(isAdmin, niche), [isAdmin, niche]);
  const { primaryItems, moreItems } = useMemo(
    () => splitNavItemsByModulePreferences(items, modulePreferences),
    [items, modulePreferences],
  );
  const showNicheModal = !isAdmin && niche === null && !nicheModalDismissed;

  useEffect(() => {
    setSelectedNiche(niche);
    if (niche) {
      writeNicheModalDone(nicheModalKey);
      setNicheModalDismissed(true);
    }
  }, [niche, nicheModalKey]);

  useEffect(() => {
    setNicheModalDismissed(readNicheModalDone(nicheModalKey));
  }, [nicheModalKey]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedCompanyId) {
      setModulePreferences(null);
      return () => {
        cancelled = true;
      };
    }

    const cachedPreferences = readCachedModulePreferences(selectedCompanyId);
    if (cachedPreferences) {
      setModulePreferences(cachedPreferences);
    } else {
      setModulePreferences(null);
    }

    getCompanyPersonalization({ companyId: selectedCompanyId })
      .then((data) => {
        if (!cancelled) {
          const preferences = data.modulePreferences || [];
          writeCachedModulePreferences(selectedCompanyId, preferences);
          setModulePreferences(preferences);
        }
      })
      .catch(() => undefined);

    const onPersonalizationUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ companyId?: string }>).detail;
      if (detail?.companyId && detail.companyId !== selectedCompanyId) return;
      getCompanyPersonalization({ companyId: selectedCompanyId })
        .then((data) => {
          const preferences = data.modulePreferences || [];
          writeCachedModulePreferences(selectedCompanyId, preferences);
          setModulePreferences(preferences);
        })
        .catch(() => undefined);
    };

    window.addEventListener("company:personalization-updated", onPersonalizationUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("company:personalization-updated", onPersonalizationUpdated);
    };
  }, [selectedCompanyId]);

  const handleConfirmNiche = async () => {
    if (!selectedNiche) return;

    try {
      setSavingNiche(true);
      const updatedProfile = await updateUserProfile({ niche: selectedNiche });
      localStorage.setItem(COMPANY_STAGE_STORAGE_KEY, selectedStage);
      writeNicheModalDone(nicheModalKey);
      setNicheModalDismissed(true);
      setNiche(updatedProfile.niche || selectedNiche);
      addToast("Painel personalizado com sucesso.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível salvar o nicho agora."), "error");
    } finally {
      setSavingNiche(false);
    }
  };

  return (
    <div className="nextlevel-internal-shell min-h-screen overflow-x-hidden bg-[#050706] text-zinc-100">
      <div
        id="dashboard-main"
        aria-hidden={showNicheModal || undefined}
        className={`transition duration-500 ${showNicheModal ? "pointer-events-none blur-[15px] saturate-[0.8] brightness-[0.76]" : ""}`}
      >
        <Sidebar primaryItems={primaryItems} moreItems={moreItems} />
        <main className="min-h-screen min-h-0 flex-col lg:pl-[280px]">
          <Header />
          <div className="mx-auto min-h-0 w-full max-w-[1440px] flex-1 overflow-x-hidden p-4 pb-28 md:p-6 lg:p-10 lg:pb-10">{children}</div>
        </main>
        <BottomNav items={primaryItems} />
        <FloatingActionButton />
      </div>

      {showNicheModal ? (
        <>
          <div className="fixed inset-0 z-[60] bg-[radial-gradient(circle_at_center,rgba(36,76,52,0.12)_0%,rgba(4,9,10,0.72)_52%,rgba(2,4,8,0.92)_100%)]" />
          <NicheModal
            selectedNiche={selectedNiche}
            selectedStage={selectedStage}
            onSelectNiche={setSelectedNiche}
            onSelectStage={setSelectedStage}
            onConfirm={handleConfirmNiche}
            loading={savingNiche}
          />
        </>
      ) : null}
    </div>
  );
};

export default Layout;
