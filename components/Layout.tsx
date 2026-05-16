import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
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

const navItems: SidebarNavItem[] = [
  { id: "home", path: DASHBOARD_ROUTE, name: "Início", icon: HomeIcon, isPrimary: true },
  { id: "reports", path: "/reports", name: "Relatórios", icon: BarChartIcon, isPrimary: true },
  { id: "chat", path: "/chat", name: "Chat IA", icon: MessageSquareIcon, isPrimary: true },
  { id: "attendant", path: "/attendant", name: "Atendente IA", icon: MessageSquareIcon, isPrimary: true },
  { id: "insights", path: "/insights", name: "Insights", icon: LightbulbIcon, isPrimary: true },
  { id: "market", path: "/market-intel", name: "Marketing", icon: RadarIcon },
  { id: "projects", path: "/command-center", name: "Projetos", icon: BarChartIcon },
  { id: "add-data", path: "/add-data", name: "Adicionar dados", icon: PlusIcon },
  { id: "products", path: "/products", name: "Produtos e Serviços", icon: PackageIcon },
  { id: "orders", path: "/orders", name: "Pedidos", icon: ReceiptIcon },
  { id: "customers", path: "/customers", name: "Clientes", icon: UsersIcon },
  { id: "costs", path: "/costs", name: "Custos", icon: ReceiptIcon },
  { id: "plans", path: "/plans", name: "Planos", icon: CreditCardIcon },
  { id: "usage", path: "/usage", name: "Uso do plano", icon: ActivityIcon },
  { id: "settings", path: "/settings", name: "Configurações", icon: SettingsIcon },
  { id: "profile", path: "/profile", name: "Perfil", icon: UserIcon },
  { id: "integrations", path: "/integrations", name: "Integrações", icon: PuzzleIcon },
  { id: "companies", path: "/companies", name: "Empresas", icon: BuildingIcon },
  { id: "financial-flow", path: "/financial-flow", name: "Fluxo financeiro", icon: DollarSignIcon },
];

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
  const { username } = useAuth();
  return (
    <aside className="nl-sidebar fixed left-0 top-0 z-50 hidden h-screen flex-col p-4 lg:flex">
      <div className="shrink-0">
        <Link to={DASHBOARD_ROUTE} className="mb-7 flex items-center gap-2 rounded-2xl px-2 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#B6FF00]" />
          <span className="nl-sidebar-logo text-lg">NEXT LEVEL</span>
        </Link>
        <p className="mb-5 px-2 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-600">
          Operação segura
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
        <nav aria-label="Menu principal">
          <ul className="space-y-1">
            {(Array.isArray(primaryItems) ? primaryItems : []).map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nl-nav-item group ${isActive ? "is-active" : ""}`}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="min-w-0 truncate">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          {moreItems.length > 0 ? (
            <details className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-2">
              <summary className="cursor-pointer px-2 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">
                Mais ferramentas
              </summary>
              <ul className="mt-2 space-y-1">
                {moreItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => `nl-nav-item group ${isActive ? "is-active" : ""}`}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      <span className="min-w-0 truncate">{item.name}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </nav>
      </div>

      <Link to="/profile" className="group mt-5 flex shrink-0 items-center gap-3 border-t border-white/[0.07] pt-5" aria-label="Acessar perfil">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#B6FF00]/20 bg-[#B6FF00] text-sm font-black text-[#080D0B] transition-all group-hover:border-[#B6FF00]">
          {username?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-zinc-100">{username || "Usuário"}</p>
          <p className="text-[10px] uppercase tracking-widest text-zinc-600">Ver perfil</p>
        </div>
      </Link>
    </aside>
  );
};

const Header = () => {
  const { username, isAdmin } = useAuth();

  return (
    <header className="nl-topbar sticky top-0 z-40 flex items-center justify-between px-5 lg:justify-end lg:px-8">
      <Link to={DASHBOARD_ROUTE} className="flex items-center gap-2 text-lg font-black text-[#B6FF00] lg:hidden">
        <span className="h-2.5 w-2.5 rounded-full bg-[#B6FF00]" />
        NEXT LEVEL
      </Link>
      <div className="flex items-center gap-4">
        {isAdmin ? (
          <Link to="/admin/system-health" className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-[#B6FF00]" aria-label="Painel admin">
            <ShieldIcon className="h-5 w-5" />
          </Link>
        ) : null}
        <Link to="/settings" className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-[#B6FF00]" aria-label="Configurações">
          <SettingsIcon className="h-5 w-5" />
        </Link>
        <Link to="/profile" className="group flex items-center gap-2.5" aria-label="Menu do usuário">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold text-zinc-100 transition-colors group-hover:text-[#B6FF00]">{username || "Usuário"}</p>
            <p className="text-[9px] uppercase tracking-[0.16em] text-zinc-600">Estratégico</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#B6FF00]/20 bg-[#B6FF00] text-xs font-black text-[#080D0B] transition-all group-hover:border-[#B6FF00]">
            {username?.charAt(0).toUpperCase() || "U"}
          </div>
        </Link>
      </div>
    </header>
  );
};

const BottomNav = ({ items }: { items: SidebarNavItem[] }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-white/[0.08] bg-[#080D0B]/95 p-2 backdrop-blur lg:hidden" aria-label="Menu Mobile">
    {(Array.isArray(items) ? items : []).filter((item) => item.isPrimary).map((item) => (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) =>
          `relative flex flex-1 flex-col items-center rounded-xl p-2 text-[10px] font-bold uppercase tracking-tight transition-all ${
            isActive ? "bg-[#B6FF00]/12 text-[#B6FF00]" : "text-zinc-500"
          }`
        }
      >
        <item.icon className="h-5 w-5" />
        <span className="mt-1">{item.name}</span>
      </NavLink>
    ))}
  </nav>
);

const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { name: "Nova empresa", icon: BuildingIcon, path: "/companies" },
    { name: "Novo relatório", icon: BarChartIcon, path: "/reports" },
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
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-[#171D1A] text-zinc-100 transition-all hover:scale-105 hover:border-[#B6FF00]/45"
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
        className={`flex h-14 w-14 items-center justify-center rounded-full text-zinc-900 shadow-2xl transition-all duration-300 ${
          isOpen ? "bg-red-500 text-white" : "bg-[#B6FF00]"
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
    <div className="nl-app-shell">
      <div
        id="dashboard-main"
        aria-hidden={showNicheModal || undefined}
        className={`transition duration-500 ${showNicheModal ? "pointer-events-none blur-[15px] saturate-[0.8] brightness-[0.76]" : ""}`}
      >
        <Sidebar primaryItems={primaryItems} moreItems={moreItems} />
        <main className="min-h-screen min-h-0 flex-col lg:pl-[220px]">
          <Header />
          <div className="nl-page-shell">
            <div className="nl-page-content">{children}</div>
          </div>
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
