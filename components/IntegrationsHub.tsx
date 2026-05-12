import React, { useEffect, useState } from "react";
import { useAuth } from "../App";
import { useToast } from "./Toast";
import {
  disconnectMetaAPIConfig,
  disconnectInstagram,
  evolutionConnect,
  evolutionDisconnect,
  evolutionGetQRCode,
  evolutionGetStatus,
  getIntegrationStatuses,
  getInstagramConnectUrl,
  getInstagramStatus,
  getMetaWhatsappStatus,
  saveMetaAPIConfig,
  type InstagramConnectionStatus,
} from "../src/services/endpoints";
import { getErrorMessage } from "../src/services/error";
import type { IntegrationStatus } from "../src/types/domain";
import { MessageSquareIcon, PackageIcon, PuzzleIcon, RadarIcon } from "./icons";

type OfficialStatus = {
  connected: boolean;
  method?: "meta" | null;
  status?: string;
  phoneNumberId: string | null;
  phoneNumber?: string | null;
  updatedAté: string | null;
};

type EvolutionStatus = {
  connected: boolean;
  state?: string;
  status?: string;
  qrCode?: string | null;
  qrcode?: string | null;
  qrRequired?: boolean;
  pairingCode?: string | null;
  webhookStatus?: "configured" | "pending" | "error";
  automationStatus?: "configured" | "pending" | "error";
  retryAfterSeconds?: number | null;
  failureReason?: string | null;
};

type QrStatus = "idle" | "generating" | "ready" | "warming" | "rate_limited" | "timeout";

function isInstagramTokenExpired(status?: InstagramConnectionStatus | null) {
  return Boolean(
    status?.tokenExpired ||
      status?.status === "token_expired" ||
      status?.status === "reconnect_required",
  );
}

const IntegrationsHub = () => {
  const { selectedCompanyId } = useAuth();
  const { addToast } = useToast();
  const [evolutionOpen, setEvolutionOpen] = useState(false);
  const [officialOpen, setOfficialOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [evolutionLoading, setEvolutionLoading] = useState(false);
  const [officialLoading, setOfficialLoading] = useState(false);
  const [instagramLoading, setInstagramLoading] = useState(false);
  const [officialStatus, setOfficialStatus] = useState<OfficialStatus | null>(null);
  const [evolutionStatus, setEvolutionStatus] = useState<EvolutionStatus | null>(null);
  const [instagramConnectionStatus, setInstagramConnectionStatus] =
    useState<InstagramConnectionStatus | null>(null);
  const [integrationStatuses, setIntegrationStatuses] = useState<IntegrationStatus[]>([]);
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [qrStatus, setQrStatus] = useState<QrStatus>("idle");

  const loadStatus = async () => {
    if (!selectedCompanyId) return;

    try {
      const [metaData, evolutionData, integrationsData, instagramData] = await Promise.all([
        getMetaWhatsappStatus(selectedCompanyId),
        evolutionGetStatus(selectedCompanyId),
        getIntegrationStatuses(selectedCompanyId),
        getInstagramStatus(selectedCompanyId),
      ]);

      setOfficialStatus(metaData);
      setEvolutionStatus(evolutionData);
      setIntegrationStatuses(integrationsData);
      setInstagramConnectionStatus(instagramData);

      if (metaData?.phoneNumber) {
        setPhoneNumber(metaData.phoneNumber);
      }
    } catch {
      setOfficialStatus(null);
      setEvolutionStatus(null);
      setInstagramConnectionStatus(null);
      setIntegrationStatuses([]);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!evolutionOpen || !selectedCompanyId) return;

    let cancelled = false;
    let attempts = 0;
    let lastStartRetryAt = 0;
    let interval: ReturnType<typeof setInterval> | null = null;

    const syncEvolution = async () => {
      try {
        const [qrData, statusData] = await Promise.all([
          evolutionGetQRCode(selectedCompanyId),
          evolutionGetStatus(selectedCompanyId),
        ]);

        if (cancelled) return;

        setEvolutionStatus({
          ...statusData,
          pairingCode: qrData.pairingCode || statusData.pairingCode || null,
        });

        if (statusData.connected) {
          cancelled = true;
          if (interval) clearInterval(interval);
          setEvolutionOpen(false);
          setQrCode(null);
          setQrStatus("idle");
          await loadStatus();
          addToast("WhatsApp conectado com sucesso!", "success");
          return;
        }

        const nextQrCode = qrData.qrcode || qrData.qrCode || null;
        if (nextQrCode) {
          setQrCode(nextQrCode);
          setQrStatus("ready");
          return;
        }

        const recoverableStatus =
          statusData.status === "rate_limited" ||
          statusData.status === "provider_warming_up" ||
          statusData.status === "qr_not_ready";
        if (recoverableStatus && Number(statusData.retryAfterSeconds || 0) <= 0) {
          const now = Date.now();
          if (now - lastStartRetryAt > 10000) {
            lastStartRetryAt = now;
            await evolutionConnect(selectedCompanyId).catch(() => undefined);
          }
        }

        if (statusData.status === "rate_limited") {
          setQrStatus("rate_limited");
          return;
        }

        if (statusData.status === "provider_warming_up" || statusData.status === "qr_not_ready") {
          setQrStatus("warming");
          return;
        }

        attempts += 1;
        if (attempts >= 150) {
          cancelled = true;
          if (interval) clearInterval(interval);
          setQrCode(null);
          setQrStatus("timeout");
        }
      } catch {
        // Mantem o modal aberto durante falhas temporarias.
      }
    };

    setQrStatus((current) => (current === "ready" ? current : "generating"));
    void syncEvolution();

    interval = setInterval(() => {
      void syncEvolution();
    }, 2000);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [addToast, evolutionOpen, selectedCompanyId]);

  const handleEvolutionConnect = async () => {
    if (!selectedCompanyId) {
      addToast("Escolha uma empresa antes de conectar.", "info");
      return;
    }

    setEvolutionLoading(true);
    setQrCode(null);
    setQrStatus("generating");
    setEvolutionOpen(true);

    try {
      await evolutionConnect(selectedCompanyId);
      await loadStatus();
    } catch (error) {
      setEvolutionOpen(true);
      setQrStatus("warming");
      addToast(getErrorMessage(error, "Preparando a conexão. Tente novamente em alguns segundos."), "info");
    } finally {
      setEvolutionLoading(false);
    }
  };

  const handleEvolutionDisconnect = async () => {
    if (!selectedCompanyId) return;

    setEvolutionLoading(true);
    try {
      await evolutionDisconnect(selectedCompanyId);
      setQrCode(null);
      setQrStatus("idle");
      await loadStatus();
      addToast("WhatsApp desconectado.", "success");
    } catch {
      addToast("Não foi possível desconectar.", "error");
    } finally {
      setEvolutionLoading(false);
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
      addToast("Não foi possível conectar com a Meta.", "error");
    } finally {
      setOfficialLoading(false);
    }
  };

  const handleOfficialDisconnect = async () => {
    if (!selectedCompanyId) return;

    setOfficialLoading(true);
    try {
      await disconnectMetaAPIConfig(selectedCompanyId);
      await loadStatus();
      addToast("WhatsApp desconectado.", "success");
    } catch {
      addToast("Não foi possível desconectar.", "error");
    } finally {
      setOfficialLoading(false);
    }
  };

  const handleInstagramConnect = async () => {
    if (!selectedCompanyId) {
      addToast("Escolha uma empresa antes de conectar.", "info");
      return;
    }

    setInstagramLoading(true);
    try {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      const { authUrl } = await getInstagramConnectUrl(selectedCompanyId, currentPath);
      window.location.assign(authUrl);
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível iniciar o OAuth do Instagram."), "error");
      setInstagramLoading(false);
    }
  };

  const handleInstagramDisconnect = async () => {
    if (!selectedCompanyId) return;

    setInstagramLoading(true);
    try {
      await disconnectInstagram(selectedCompanyId);
      await loadStatus();
      addToast("Instagram desconectado.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível desconectar o Instagram."), "error");
    } finally {
      setInstagramLoading(false);
    }
  };

  const showComingSoon = (channel: string) => {
    addToast(`${channel} fica visível aqui e entra em configuração guiada em breve.`, "info");
  };

  const formatLastSync = (value?: string | null) => {
    if (!value) return "Aguardando primeira sincronização";
    return new Date(value).toLocaleString("pt-BR");
  };

  const findStatus = (provider: IntegrationStatus["provider"]) =>
    integrationStatuses.find((item) => item.provider === provider) || null;

  const instagramStatus = findStatus("INSTAGRAM");
  const mercadoLivreStatus = findStatus("MERCADOLIVRE");
  const shopeeStatus = findStatus("SHOPEE");
  const evolutionConnected = Boolean(evolutionStatus?.connected);
  const officialConnected = Boolean(officialStatus?.connected && officialStatus?.method === "meta");
  const whatsappConnected = evolutionConnected || officialConnected;
  const evolutionRecovering =
    qrStatus === "warming" ||
    qrStatus === "rate_limited" ||
    evolutionStatus?.status === "provider_warming_up" ||
    evolutionStatus?.status === "rate_limited";
  const evolutionStatusLabel = evolutionConnected
    ? "Ativo"
    : qrStatus === "ready"
      ? "QR Code"
      : evolutionRecovering
        ? "Preparando"
        : qrStatus === "generating"
          ? "QR Code"
          : "Offline";
  const evolutionHelperMessage =
    evolutionStatus?.failureReason ||
    (qrStatus === "rate_limited"
      ? "Muitas tentativas agora. Aguarde alguns segundos antes de tentar novamente."
      : qrStatus === "warming"
        ? "A conexão está sendo preparada. Vamos tentar buscar o QR automaticamente."
        : null);
  const instagramNeedsReconnect = isInstagramTokenExpired(instagramConnectionStatus);

  const channels = [
    {
      key: "INSTAGRAM",
      title: "Instagram",
      description: "Organize mensagens e oportunidades vindas do Instagram.",
      status: instagramStatus,
      icon: <RadarIcon className="h-6 w-6" />,
      actionLabel: instagramNeedsReconnect
        ? "Reconectar Instagram"
        : instagramConnectionStatus?.connected
          ? "Desconectar"
          : "Conectar Instagram",
      actionType: "instagram" as const,
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
          Hub de Integrações
        </p>
        <h2 className="text-2xl font-black text-zinc-50 md:text-3xl">
          Canais conectados no mesmo painel
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-zinc-400">
          Conecte, acompanhe status e mantenha a operação visível sem esconder canais em evolução.
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
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                    whatsappConnected
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400"
                  }`}
                >
                  {whatsappConnected ? "Conectado" : "Desconectado"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Conecte o atendimento da sua empresa ao WhatsApp.
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Última sincronização: {formatLastSync(officialStatus?.updatedAt || null)}
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[24px] border border-lime-400/20 bg-zinc-900/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-black text-zinc-50">WhatsApp</h4>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Conexão simples por QR Code, com status claro para sua equipe.
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                    evolutionConnected
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : qrStatus === "ready" || qrStatus === "generating" || evolutionRecovering
                        ? "border-lime-400/30 bg-lime-400/10 text-lime-300"
                        : "border-zinc-700 bg-zinc-900 text-zinc-400"
                  }`}
                >
                  {evolutionStatusLabel}
                </span>
              </div>

              {evolutionConnected ? (
                <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <p className="text-sm font-bold text-emerald-300">✓ WhatsApp Conectado</p>
                  <p className="mt-1 text-sm text-zinc-200">
                    Sua conexão está pronta para o atendimento automático.
                  </p>
                  <p className="mt-2 text-xs text-emerald-200">
                    Saúde: {evolutionStatus?.webhookStatus === "configured" ? "conexão ativa" : "sincronizando"} - Atendimento: {evolutionStatus?.automationStatus === "configured" ? "pronto" : "pendente"}
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-sm text-zinc-300">
                    {evolutionHelperMessage || "Clique para gerar o QR Code e conectar com seu WhatsApp Business."}
                  </p>
                </div>
              )}

              {!evolutionConnected ? (
                <button
                  type="button"
                  onClick={() => void handleEvolutionConnect()}
                  disabled={evolutionLoading || evolutionRecovering || !selectedCompanyId}
                  className="mt-5 w-full rounded-2xl bg-[#B6FF00] px-4 py-3 text-sm font-black text-zinc-950 transition hover:brightness-105 disabled:opacity-50"
                >
                  {evolutionLoading || evolutionRecovering ? "Preparando conexão..." : "Conectar WhatsApp"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleEvolutionDisconnect()}
                  disabled={evolutionLoading || !selectedCompanyId}
                  className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                >
                  Desconectar
                </button>
              )}
            </div>

            <div className="rounded-[24px] border border-lime-400/20 bg-zinc-900/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-black text-zinc-50">Conexão oficial</h4>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Opção oficial para conectar o canal da empresa.
                  </p>
                </div>
                <span className="rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-lime-300">
                  Oficial
                </span>
              </div>

              {officialConnected ? (
                <div className="mt-4 rounded-2xl border border-lime-400/30 bg-lime-400/10 p-4">
                  <p className="text-sm font-bold text-lime-300">WhatsApp conectado</p>
                  <p className="mt-1 text-sm text-zinc-200">
                    Canal conectado
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-sm text-zinc-300">
                    Conecte o canal oficial quando precisar.
                  </p>
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setOfficialOpen(true)}
                  disabled={!selectedCompanyId}
                  className="flex-1 rounded-2xl bg-[#B6FF00] px-4 py-3 text-sm font-black text-zinc-950 transition hover:brightness-105 disabled:opacity-50"
                >
                  Conectar canal oficial
                </button>
                {officialConnected ? (
                  <button
                    type="button"
                    onClick={() => void handleOfficialDisconnect()}
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
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                      card.status?.connected && !(card.key === "INSTAGRAM" && instagramNeedsReconnect)
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : card.key === "INSTAGRAM" && instagramNeedsReconnect
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                        : "border-zinc-700 bg-zinc-900 text-zinc-400"
                    }`}
                  >
                    {card.key === "INSTAGRAM" && instagramNeedsReconnect
                      ? "Token expirado"
                      : card.status?.connected
                        ? "Conectado"
                        : "Não conectado"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{card.description}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  Última sincronização: {formatLastSync(card.status?.updatedAt || null)}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              {card.actionType === "instagram" ? (
                <div className="w-full space-y-3">
                  {instagramConnectionStatus?.provider_setup_required ? (
                    <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
                      A conexão com Instagram está temporariamente indisponível. Tente novamente em instantes.
                    </div>
                  ) : null}
                  {instagramConnectionStatus?.connected || instagramNeedsReconnect ? (
                    <div className={`rounded-2xl border p-4 ${
                      instagramNeedsReconnect
                        ? "border-amber-500/30 bg-amber-500/10"
                        : "border-emerald-500/30 bg-emerald-500/10"
                    }`}>
                      <p className={`text-sm font-bold ${
                        instagramNeedsReconnect ? "text-amber-200" : "text-emerald-300"
                      }`}>
                        {instagramNeedsReconnect
                          ? "Token expirado / Reconexão necessária"
                          : "Instagram conectado"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        Mensagens e oportunidades prontas para organização.
                      </p>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      instagramConnectionStatus?.connected && !instagramNeedsReconnect
                        ? void handleInstagramDisconnect()
                        : void handleInstagramConnect()
                    }
                    disabled={instagramLoading || !selectedCompanyId || Boolean(instagramConnectionStatus?.provider_setup_required)}
                    className={`rounded-2xl px-4 py-3 text-sm font-black transition disabled:opacity-50 ${
                      instagramConnectionStatus?.connected && !instagramNeedsReconnect
                        ? "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                        : "bg-[#B6FF00] text-zinc-950 hover:brightness-105"
                    }`}
                  >
                    {instagramLoading
                      ? "Aguarde..."
                      : instagramNeedsReconnect
                        ? "Reconectar Instagram"
                      : instagramConnectionStatus?.connected
                        ? "Desconectar"
                        : "Conectar Instagram"}
                  </button>
                </div>
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

      {evolutionOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setEvolutionOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-[28px] border border-zinc-800 bg-zinc-950 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">
                  WhatsApp
                </p>
                <h3 className="mt-2 text-2xl font-black text-zinc-50">Conectar WhatsApp</h3>
              </div>
              <button
                type="button"
                onClick={() => setEvolutionOpen(false)}
                className="rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-400"
              >
                Fechar
              </button>
            </div>

            <div className="mt-6 rounded-[24px] border border-lime-400/20 bg-zinc-900/70 p-6 text-center">
              <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-3xl border border-dashed border-lime-300/40 bg-white p-3 text-center text-xs font-bold text-zinc-700">
                {qrStatus === "timeout" ? (
                  <div className="space-y-3">
                    <p>QR Code expirou. Tentar novamente.</p>
                    <button
                      type="button"
                      onClick={() => void handleEvolutionConnect()}
                      disabled={evolutionLoading}
                      className="rounded-2xl bg-[#B6FF00] px-4 py-2 text-xs font-black text-zinc-950 disabled:opacity-50"
                    >
                      {evolutionLoading ? "Gerando..." : "Tentar novamente"}
                    </button>
                  </div>
                ) : qrStatus === "rate_limited" ? (
                  <div className="space-y-3">
                    <p>Muitas tentativas agora.</p>
                    <p>Aguarde alguns segundos. Vamos tentar de novo automaticamente.</p>
                  </div>
                ) : qrStatus === "warming" ? (
                  <div className="space-y-3">
                    <p>Preparando conexão...</p>
                    <p>A conexão está sendo preparada.</p>
                  </div>
                ) : qrCode && qrStatus === "ready" ? (
                  <img
                    src={qrCode}
                    alt="QR Code WhatsApp"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : evolutionStatus?.pairingCode ? (
                  <div className="space-y-2">
                    <p>Código de pareamento</p>
                    <p className="rounded-2xl bg-zinc-100 px-4 py-3 text-lg tracking-[0.25em] text-zinc-900">
                      {evolutionStatus.pairingCode}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p>Gerando QR Code... aguarde alguns segundos.</p>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2 text-sm text-zinc-400">
                {qrStatus === "ready" ? (
                  <p>Escaneie o QR Code com seu WhatsApp Business</p>
                ) : qrStatus === "rate_limited" ? (
                  <p>Aguardando nova tentativa.</p>
                ) : qrStatus === "warming" ? (
                  <p>Sem ação manual: o painel continua tentando buscar o QR.</p>
                ) : evolutionStatus?.pairingCode ? (
                  <p>Se preferir, use o código de pareamento no WhatsApp.</p>
                ) : (
                  <p>Aguardando QR Code...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {officialOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setOfficialOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-[28px] border border-zinc-800 bg-zinc-950 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">Conexão Oficial Meta</p>
                <h3 className="mt-2 text-2xl font-black text-zinc-50">Conecte em 3 passos</h3>
              </div>
              <button
                type="button"
                onClick={() => setOfficialOpen(false)}
                className="rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-400"
              >
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
                  <li>1. Abra Configurações e Usuários do Sistema.</li>
                  <li>2. Gere um token com acesso ao WhatsApp.</li>
                  <li>3. Copie o token para finalizar a conexão.</li>
                </ol>
              </div>

              <div className="rounded-[24px] border border-lime-400/20 bg-lime-400/5 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-300">Passo 3</p>
                <h4 className="mt-2 text-lg font-black text-zinc-50">Cole o token</h4>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  O Next Level salva a configuração e atualiza o status.
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
