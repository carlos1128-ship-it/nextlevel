import React from "react";

type Metadata = {
  title: string;
  description: string;
  keywords: string[];
  openGraph: {
    title: string;
    description: string;
    images: string[];
    type: string;
    locale: string;
  };
};

export const metadata: Metadata = {
  title: "Next Level Platform | SaaS de Automacao de Vendas com Inteligencia Artificial",
  description:
    "SaaS de Automacao de Vendas com Inteligencia Artificial para WhatsApp, Instagram, margem, lucro e operacao comercial em tempo real.",
  keywords: [
    "SaaS",
    "Automacao de Vendas",
    "Inteligencia Artificial",
    "WhatsApp",
    "CRM",
    "ROI",
  ],
  openGraph: {
    title: "Next Level Platform | SaaS de Automacao de Vendas com Inteligencia Artificial",
    description:
      "Automatize atendimento, calcule lucro e use Inteligencia Artificial para vender mais com menos atrito.",
    images: ["/og-sales-ai.svg"],
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
