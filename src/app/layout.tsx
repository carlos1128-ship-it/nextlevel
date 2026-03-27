import React from "react";

type Metadata = {
  title: string;
  description: string;
  canonicalUrl: string;
  keywords: string[];
  openGraph: {
    title: string;
    description: string;
    image: string;
    url: string;
    type: string;
    locale: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
};

const defaultSiteUrl =
  (import.meta.env.VITE_PUBLIC_APP_URL || "https://next-level-front.vercel.app")
    .toString()
    .trim()
    .replace(/\/+$/, "");

export const metadata: Metadata = {
  title: "Next Level | Lucro Real ou Colapso",
  description:
    "A linha que separa sua empresa do lucro real ou do colapso. Automatize vendas, conecte canais e enxergue margem verdadeira antes de perder dinheiro.",
  canonicalUrl: defaultSiteUrl,
  keywords: [
    "Lucro Real",
    "Margem Verdadeira",
    "Automacao de Vendas",
    "WhatsApp",
    "Mercado Livre",
    "Shopee",
    "Operacao Tatica",
    "Next Level",
  ],
  openGraph: {
    title: "Next Level | Lucro Real ou Colapso",
    description:
      "O cerebro tatico do seu negocio para enxergar a margem que sua operacao queima sem saber.",
    image: `${defaultSiteUrl}/og-sales-ai.svg`,
    url: defaultSiteUrl,
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Next Level | Lucro Real ou Colapso",
    description:
      "Automatize vendas, conecte canais e enxergue margem verdadeira antes de perder dinheiro.",
    image: `${defaultSiteUrl}/og-sales-ai.svg`,
  },
};

export function resolveMetadata(pathname: string): Metadata {
  const normalizedPath = pathname.trim() || "/";
  const pageTitleMap: Record<string, string> = {
    "/": "Next Level | Lucro Real ou Colapso",
    "/login": "Next Level | Lucro Real ou Colapso",
    "/dashboard": "Dashboard | Next Level",
    "/reports": "Relatorios | Next Level",
    "/chat": "Chat IA | Next Level",
    "/settings": "Configuracoes | Next Level",
    "/profile": "Perfil | Next Level",
    "/integrations": "Integracoes | Next Level",
    "/companies": "Empresas | Next Level",
    "/insights": "Insights | Next Level",
    "/market-intel": "Mercado | Next Level",
    "/financial-flow": "Fluxo Financeiro | Next Level",
    "/finance": "Fluxo Financeiro | Next Level",
    "/products": "Produtos | Next Level",
    "/customers": "Clientes | Next Level",
    "/costs": "Custos | Next Level",
    "/attendant": "Atendente IA | Next Level",
    "/command-center": "Projetos | Next Level",
    "/plans": "Planos | Next Level",
    "/admin/system-health": "System Health | Next Level",
  };

  const isKnownRoute = normalizedPath in pageTitleMap;
  const isNotFoundRoute =
    normalizedPath === "/404" || normalizedPath === "/not-found" || !isKnownRoute;

  const title =
    pageTitleMap[normalizedPath] ||
    (isNotFoundRoute ? "404 | Next Level" : "Next Level | Lucro Real ou Colapso");

  const description =
    isNotFoundRoute
      ? "A rota procurada nao foi encontrada. Volte rapido para a operacao principal."
      : metadata.description;

  const canonicalUrl = `${defaultSiteUrl}${normalizedPath === "/" ? "" : normalizedPath}`;

  return {
    ...metadata,
    title,
    description,
    canonicalUrl,
    openGraph: {
      ...metadata.openGraph,
      title,
      description,
      url: canonicalUrl,
    },
    twitter: {
      ...metadata.twitter,
      title,
      description,
    },
  };
}

function upsertMeta(selector: string, attributes: Record<string, string>) {
  if (typeof document === "undefined") return;

  let element = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
  if (!element) {
    if (selector.startsWith("link")) {
      element = document.createElement("link");
    } else {
      element = document.createElement("meta");
    }
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
}

export function applyMetadata(nextMetadata: Metadata) {
  if (typeof document === "undefined") return;

  document.title = nextMetadata.title;

  upsertMeta('meta[name="description"]', {
    name: "description",
    content: nextMetadata.description,
  });
  upsertMeta('meta[name="keywords"]', {
    name: "keywords",
    content: nextMetadata.keywords.join(", "),
  });
  upsertMeta('link[rel="canonical"]', {
    rel: "canonical",
    href: nextMetadata.canonicalUrl,
  });
  upsertMeta('meta[property="og:title"]', {
    property: "og:title",
    content: nextMetadata.openGraph.title,
  });
  upsertMeta('meta[property="og:description"]', {
    property: "og:description",
    content: nextMetadata.openGraph.description,
  });
  upsertMeta('meta[property="og:image"]', {
    property: "og:image",
    content: nextMetadata.openGraph.image,
  });
  upsertMeta('meta[property="og:url"]', {
    property: "og:url",
    content: nextMetadata.openGraph.url,
  });
  upsertMeta('meta[property="og:type"]', {
    property: "og:type",
    content: nextMetadata.openGraph.type,
  });
  upsertMeta('meta[property="og:locale"]', {
    property: "og:locale",
    content: nextMetadata.openGraph.locale,
  });
  upsertMeta('meta[name="twitter:card"]', {
    name: "twitter:card",
    content: nextMetadata.twitter.card,
  });
  upsertMeta('meta[name="twitter:title"]', {
    name: "twitter:title",
    content: nextMetadata.twitter.title,
  });
  upsertMeta('meta[name="twitter:description"]', {
    name: "twitter:description",
    content: nextMetadata.twitter.description,
  });
  upsertMeta('meta[name="twitter:image"]', {
    name: "twitter:image",
    content: nextMetadata.twitter.image,
  });
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
