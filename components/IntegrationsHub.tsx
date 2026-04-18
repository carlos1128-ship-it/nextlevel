import React, { useEffect, useState } from "react";
import { useAuth } from "../App";
import { useToast } from "./Toast";
import {
  createWhatsappInstance,
  disconnectMetaAPIConfig,
  getIntegrationStatuses,
  getMetaWhatsappStatus,
  getWhatsappHealth,
  getWhatsappQRCode,
  getWhatsappStatus,
  saveMetaAPIConfig,
  terminateWhatsappSession,
} from "../src/services/endpoints";
import type { IntegrationStatus } from "../src/types/domain";
import { MessageSquareIcon, PackageIcon, PuzzleIcon, RadarIcon } from "./icons";

type OfficialStatus = {
  connected: boolean;
  method?: "meta" | "wppconnect" | null;
  status?: string;
  phoneNumberId: string | null;
  phoneNumber?: string | null;
  updatedAt?: string | null;
};

type QuickStatus = {
  connected?: boolean;
  status?: string;
  method?: "meta" | "wppconnect" | null;
  qrCode?: string | null;
  updatedAt?: string | null;
};

const quickSteps = [
  "Escaneie o QR Code com o celular da empresa.",
  "Mantenha o aparelho ligado e com internet.",
  "Se o WhatsApp atualizar, talvez seja preciso reconectar.",
];

const officialSteps = [
  "Clique em Configuracoes > Usuarios do Sistema",
  "Clique em Adicionar > Nome: next-level-bot > Funcao: Admin",
  "Clique em Gerar novo token > marque whatsapp_business_messaging",
  "Copie o token gerado (comeca com EAA...)",
];

const IntegrationsHub = () => {
  const { selectedCompanyId } = useAuth();
  const { addToast } = useToast();
  const [quickOpen, setQuickOpen] = useState(false);
  const [officialOpen, setOfficialOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [quickLoading, setQuickLoading] = useState(false);
  const [officialLoading, setOfficialLoading] = useState(false);
  const [officialStatus, setOfficialStatus] = useState<OfficialStatus | null>(null);
  const [quickStatus, setQuickStatus] = useState<QuickStatus | null>(null);
  const [integrationStatuses, setIntegrationStatuses] = useState<IntegrationStatus[]>([]);
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [qrExpired, setQrExpired] = useState(false);

  const loadStatus = async () => {
    if (!selectedCompanyId) return;
    try {
      const [metaData, quickData, integrationsData] = await Promise.all([
        getMetaWhatsappStatus(selectedCompanyId),
        getWhatsappStatus(selectedCompanyId),
        getIntegrationStatuses(selectedCompanyId),
      ]);
      setOfficialStatus(metaData);
      setQuickStatus(quickData);
      setIntegrationStatuses(integrationsData);
      if (metaData?.phoneNumber) {
        setPhoneNumber(metaData.phoneNumber);
      }
    } catch {
      setOfficialStatus(null);
      setQuickStatus(null);
      setIntegrationStatuses([]);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!quickOpen || !selectedCompanyId || qrExpired) return;

    let cancelled = false;
    let timeoutRef: ReturnType<typeof setTimeout> | null = null;

    const syncQuickConnect = async () => {
      if (qrExpired) return;

      try {
        const health = await getWhatsappHealth(selectedCompanyId);
        if (cancelled) return;

        setQuickStatus((current) => ({
          ...current,
          connected: health.connected && health.method === "wppconnect",
          status: health.status,
          method: health.method === "wppconnect" ? "wppconnect" : null,
          qrCode: health.qrCode,
          updatedAt: health.dbLastConnected,
        }));

        if (health.qrCode) {
          setQrCode(health.qrCode);
        }

        if (health.connected && health.method === "wppconnect" && health.authenticated) {
          setQuickOpen(false);
          setQrExpired(false);
          setQrCode(null);
          await loadStatus();
          addToast("WhatsApp conectado com sucesso!", "success");
        }
      } catch {
        // Ignora falhas transitórias de polling para não derrubar a modal.
      }
    };

    void syncQuickConnect();
    const interval = setInterval(() => {
      void syncQuickConnect();
    }, 2000);
    timeoutRef = setTimeout(() => {
      if (cancelled) return;
      setQrExpired(true);
      setQrCode(null);
      addToast("QR Code expirado, clique para gerar novo.", "info");
    }, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (timeoutRef) clearTimeout(timeoutRef);
    };
  }, [addToast, qrExpired, quickOpen, selectedCompanyId]);

  const handleQuickConnect = async () => {
    if (!selectedCompanyId) {
      addToast("Escolha uma empresa antes de conectar.", "info");
      return;
    }

    setQuickLoading(true);
    setQrExpired(false);
    try {
      await createWhatsappInstance(selectedCompanyId);
      let status = await getWhatsappQRCode(selectedCompanyId);

      for (let attempt = 0; attempt < 6 && !status.qrcode && !status.qrCode; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        status = await getWhatsappQRCode(selectedCompanyId);
      }

      setQrCode(status.qrcode || status.qrCode || null);
      setQuickOpen(true);
      await loadStatus();
    } catch {
      addToast("Nao foi possivel abrir o QR Code agora.", "error");
    } finally {
      setQuickLoading(false);
    }
  };

  const handleQuickReconnect = async () => {
    if (!selectedCompanyId) return;

    setQuickLoading(true);
    try {
      await terminateWhatsappSession(selectedCompanyId);
      setQrCode(null);
      setQuickStatus(null);
      await loadStatus();
      await handleQuickConnect();
    } catch {
      addToast("Nao foi possivel reconectar agora.", "error");
    } finally {
      setQuickLoading(false);
    }
  };

  const handleOfficialConnect = async () => {
    if (!selectedCompanyId || !metaAccessToken.trim()) {
      addToast("Cole o token para continuar.", "error");
      return;
    }

    setOfficialLoading(true);
    try {
      await saveMetaAPIConfig(selectedCompanyId, {
        metaAccessToken: metaAccessToken.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
      });
      await loadStatus();
      setOfficialOpen(false);
      setMetaAccessToken("");
      addToast("WhatsApp conectado com sucesso!", "success");
    } catch {
      addToast("Nao foi possivel conectar com a Meta.", "error");
    } finally {
      setOfficialLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedCompanyId) return;
    setOfficialLoading(true);
    try {
      await disconnectMetaAPIConfig(selectedCompanyId);
      await loadStatus();
      addToast("WhatsApp desconectado.", "success");
    } catch {
      addToast("Nao foi possivel desconectar.", "error");
    } finally {
      setOfficialLoading(false);
    }
  };

  const showComingSoon = (channel: string) => {
    addToast(`${channel} fica visivel aqui e entra em configuracao guiada em breve.`, "info");
  };

  const formatLastSync = (value?: string | null) => {
    if (!value) return "Aguardando primeira sincronizacao";
    return new Date(value).toLocaleString("pt-BR");
  };

  const findStatus = (provider: IntegrationStatus["provider"]) =>
    integrationStatuses.find((item) => item.provider === provider) || null;

  const instagramStatus = findStatus("INSTAGRAM");
  const mercadoLivreStatus = findStatus("MERCADOLIVRE");
  const shopeeStatus = findStatus("SHOPEE");
  const whatsappConnected = Boolean(officialStatus?.connected || quickStatus?.connected);
  const quickConnected = Boolean(quickStatus?.connected && quickStatus?.method === "wppconnect");
  const officialConnected = Boolean(officialStatus?.connected && officialStatus?.method === "meta");
  const whatsappBadge = whatsappConnected
    ? "Conectado"
    : quickStatus?.status === "AWAITING_QR_SCAN"
      ? "Aguardando QR"
      : "Desconectado";

  const channels = [
    {
      key: "INSTAGRAM",
      title: "Instagram",
      description: "DMs e automacoes via Meta Graph API.",
      status: instagramStatus,
      icon: <RadarIcon className="h-6 w-6" />,
      actionLabel: instagramStatus?.connected ? "Conectado" : "Em breve",
      actionType: "soon" as const,
    },
    {
      key: "MERCADOLIVRE",
      title: "Mercado Livre",
      description: "Sincronize pedidos e acompanhe o canal no hub.",
      status: mercadoLivreStatus,
      icon: <PuzzleIcon className="h-6 w-6" />,
      actionLabel: mercadoLivreStatus?.connected ? "Conectado" : "Configurar",
      actionType: "config" as const,
    },
    {
      key: "SHOPEE",
      title: "Shopee",
      description: "Canal preservado na interface com status atual.",
      status: shopeeStatus,
      icon: <PackageIcon className="h-6 w-6" />,
      actionLabel: shopeeStatus?.connected ? "Conectado" : "Configurar",
      actionType: "config" as const,
    },
  ];

  return (
    <section className="rounded-[30px] border border-zinc-800 bg-[#09090b] p-6 shadow-2xl shadow-black/30">
      <div className="mb-6 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-lime-300">
          Hub de Integracoes
        </p>
        <h2 className="text-2xl font-black text-zinc-50 md:text-3xl">
          Todos os 4 canais no mesmo painel
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-zinc-400">
          Conecte, acompanhe status e mantenha a operacao visivel sem esconder canais em evolucao.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[28px] border border-lime-400/20 bg-zinc-950/80 p-6 xl:col-span-2">
          <div className="mb-5 flex items-start gap-4">
            <div className="rounded-2xl border border-lime-400/20 bg-lime-400/10 p-3 text-lime-300">
              <MessageSquareIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-black text-zinc-50">WhatsApp Business</h3>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${whatsappConnected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : quickStatus?.status === "AWAITING_QR_SCAN" ? "border-amber-400/30 bg-amber-400/10 text-amber-300" : "border-zinc-700 bg-zinc-900 text-zinc-400"}`}>
                  {whatsappBadge}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Use QR Code para ativacao rapida ou Meta API para operacao oficial.
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Ultima sincronizacao: {formatLastSync(officialStatus?.updatedAt || quickStatus?.updatedAt)}
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[24px] border border-amber-400/20 bg-zinc-900/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-black text-zinc-50">QR Code</h4>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Fluxo simples para escanear e iniciar.
                  </p>
                </div>
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
                  {quickConnected ? "Conectado" : quickStatus?.status === "AWAITING_QR_SCAN" ? "Aguardando QR" : "Rapido"}
                </span>
              </div>
              {quickConnected ? (
                <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <p className="text-sm font-bold text-emerald-300">WhatsApp conectado via QR Code</p>
                  <p className="mt-1 text-sm text-zinc-200">
                    {quickStatus?.status || "Sessao ativa"}
                  </p>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => void handleQuickConnect()}
                disabled={quickLoading || !selectedCompanyId}
                className="mt-5 w-full rounded-2xl bg-amber-400 px-4 py-3 text-sm font-black text-zinc-950 transition hover:brightness-105 disabled:opacity-50"
              >
                {quickLoading ? "Abrindo QR Code..." : quickConnected ? "Gerar novo QR Code" : "Conectar via QR Code"}
              </button>
              {quickConnected ? (
                <button
                  type="button"
                  onClick={() => void handleQuickReconnect()}
                  disabled={quickLoading || !selectedCompanyId}
                  className="mt-3 w-full rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-black text-amber-200 transition hover:bg-amber-400/20 disabled:opacity-50"
                >
                  Reconectar com outro numero
                </button>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-lime-400/20 bg-zinc-900/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-black text-zinc-50">Meta API</h4>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Opcao oficial com mais estabilidade no longo prazo.
                  </p>
                </div>
                <span className="rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-lime-300">
                  Recomendado
                </span>
              </div>

              {officialConnected ? (
                <div className="mt-4 rounded-2xl border border-lime-400/30 bg-lime-400/10 p-4">
                  <p className="text-sm font-bold text-lime-300">WhatsApp conectado</p>
                  <p className="mt-1 text-sm text-zinc-200">
                    {officialStatus.phoneNumber || "Numero conectado"}
                  </p>
                </div>
              ) : null}

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setOfficialOpen(true)}
                  disabled={!selectedCompanyId}
                  className="flex-1 rounded-2xl bg-[#B6FF00] px-4 py-3 text-sm font-black text-zinc-950 transition hover:brightness-105 disabled:opacity-50"
                >
                  Conectar via Meta API
                </button>
                {officialConnected ? (
                  <button
                    type="button"
                    onClick={() => void handleDisconnect()}
                    disabled={officialLoading}
                    className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300 transition hover:bg-red-500/20"
                  >
                    Desconectar
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </article>

        {channels.map((card) => (
          <article key={card.key} className="rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-3 text-zinc-200">
                {card.icon}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-black text-zinc-50">{card.title}</h3>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${card.status?.connected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : card.actionType === "soon" ? "border-amber-400/30 bg-amber-400/10 text-amber-300" : "border-zinc-700 bg-zinc-900 text-zinc-400"}`}>
                    {card.status?.connected ? "Conectado" : card.actionType === "soon" ? "Em breve" : "Nao conectado"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{card.description}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  Ultima sincronizacao: {formatLastSync(card.status?.updatedAt || null)}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              {card.actionType === "soon" ? (
                <span className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-black text-amber-300">
                  Em breve
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => showComingSoon(card.title)}
                  className="rounded-2xl border border-zinc-700 px-4 py-3 text-sm font-black text-zinc-100 transition hover:border-lime-400/40"
                >
                  {card.actionLabel}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {quickOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={() => setQuickOpen(false)}>
          <div className="w-full max-w-lg rounded-[28px] border border-zinc-800 bg-zinc-950 p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">Conexao Rapida</p>
                <h3 className="mt-2 text-2xl font-black text-zinc-50">Escaneie o QR Code</h3>
              </div>
              <button type="button" onClick={() => setQuickOpen(false)} className="rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-400">
                Fechar
              </button>
            </div>

            <div className="mt-6 rounded-[24px] border border-amber-400/20 bg-zinc-900/70 p-6 text-center">
              <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-3xl border border-dashed border-amber-300/40 bg-white p-3 text-center text-xs font-bold text-zinc-700">
                {qrExpired ? (
                  <div className="space-y-3">
                    <p>QR Code expirado.</p>
                    <button
                      type="button"
                      onClick={() => void handleQuickConnect()}
                      disabled={quickLoading}
                      className="rounded-2xl bg-amber-400 px-4 py-2 text-xs font-black text-zinc-950 disabled:opacity-50"
                    >
                      {quickLoading ? "Gerando..." : "Gerar novo"}
                    </button>
                  </div>
                ) : qrCode ? (
                  <img
                    src={qrCode}
                    alt="QR Code WhatsApp"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <div className="space-y-2">
                    <p>Gerando QR Code...</p>
                    <p className="text-[11px] font-medium text-zinc-500">
                      Isso pode levar alguns segundos no primeiro pareamento.
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2 text-sm text-zinc-400">
                {quickSteps.map((step) => (
                  <p key={step}>{step}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {officialOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={() => setOfficialOpen(false)}>
          <div className="w-full max-w-3xl rounded-[28px] border border-zinc-800 bg-zinc-950 p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">Conexao Oficial Meta</p>
                <h3 className="mt-2 text-2xl font-black text-zinc-50">Conecte em 3 passos</h3>
              </div>
              <button type="button" onClick={() => setOfficialOpen(false)} className="rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-400">
                Fechar
              </button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-[24px] border border-zinc-800 bg-zinc-900/60 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-300">Passo 1</p>
                <h4 className="mt-2 text-lg font-black text-zinc-50">Acesse o painel da Meta</h4>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Entre com o Facebook vinculado ao seu WhatsApp Business.
                </p>
                <a
                  href="https://business.facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-2xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-100 transition hover:border-lime-400/40"
                >
                  Abrir Meta Business Suite
                </a>
              </div>

              <div className="rounded-[24px] border border-zinc-800 bg-zinc-900/60 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-300">Passo 2</p>
                <h4 className="mt-2 text-lg font-black text-zinc-50">Gere seu token</h4>
                <ol className="mt-3 space-y-2 text-sm text-zinc-300">
                  {officialSteps.map((step, index) => (
                    <li key={step}>
                      {index + 1}. {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-[24px] border border-lime-400/20 bg-lime-400/5 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-300">Passo 3</p>
                <h4 className="mt-2 text-lg font-black text-zinc-50">Cole o token</h4>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  O Next Level salva a configuracao e atualiza o status.
                </p>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="+55 11 99999-9999"
                  className="mt-4 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-lime-400/40"
                />
                <input
                  type="password"
                  value={metaAccessToken}
                  onChange={(event) => setMetaAccessToken(event.target.value)}
                  placeholder="EAAxxxxxxxxxxxxxxx..."
                  className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-lime-400/40"
                />
                <button
                  type="button"
                  onClick={() => void handleOfficialConnect()}
                  disabled={officialLoading}
                  className="mt-4 w-full rounded-2xl bg-[#B6FF00] px-4 py-3 text-sm font-black text-zinc-950 transition hover:brightness-105 disabled:opacity-50"
                >
                  {officialLoading ? "Conectando..." : "Conectar"}
                </button>
                <p className="mt-3 text-xs text-zinc-400">Seu token fica protegido no backend.</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default IntegrationsHub;
