export const DASHBOARD_ROUTE = "/dashboard";
export const DASHBOARD_ROUTE_ALIASES = ["/", "/inicio", "/home", "/painel"] as const;

export function normalizeDashboardRoute(path: string | null | undefined) {
  const value = (path || "").trim();
  if (!value) return DASHBOARD_ROUTE;
  if ((DASHBOARD_ROUTE_ALIASES as readonly string[]).includes(value)) {
    return DASHBOARD_ROUTE;
  }
  return value;
}
