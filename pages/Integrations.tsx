import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useBilling } from "../App";
import { LockIcon } from "../components/icons";
import { useToast } from "../components/Toast";
import {
  disconnectMercadoLivre,
  disconnectWhatsapp,
  connectWhatsapp,
  disconnectInstagram,
  getMercadoLivreConnectUrl,
  getMercadoLivreDashboard,
  getMercadoLivreStatus,
  getInstagramConnectUrl,
  getInstagramStatus,
  getWhatsappConnectionStatus,
  getWhatsappQr,
  getWhatsappStatus,
  syncMercadoLivre,
  type InstagramConnectionStatus,
  type MercadoLivreDashboard,
  type MercadoLivreStatus,
  type WhatsappEvolutionStatus,
} from "../src/services/endpoints";
import { getErrorMessage } from "../src/services/error";

function isInstagramTokenExpired(status?: InstagramConnectionStatus | null) {
  return Boolean(
    status?.tokenExpired ||
      status?.status === "token_expired" ||
      status?.status === "reconnect_required",
  );
}

function getInstagramStatusLabel(status?: InstagramConnectionStatus | null) {
  if (isInstagramTokenExpired(status)) return "Token expirado";
  if (status?.connected) return "Conectado";
  return "Desconectado";
}

const integrationCardClass =
  "rounded-[24px] border border-[#B6FF00]/20 bg-[#080A08] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:border-[#B6FF00]/45 hover:bg-[#0D100D]";

const integrationButtonClass =
  "rounded-xl bg-[#B6FF00] px-6 py-3 text-sm font-black text-[#050706] transition hover:bg-[#9BE600] disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClass =
  "rounded-xl border border-[#B6FF00]/15 bg-[#090C09] px-5 py-3 text-sm font-bold text-[#F5F7F2] transition hover:border-red-400/60 hover:text-red-300 disabled:opacity-50";

function IntegrationMark({ label, tone = "lime" }: { label: string; tone?: "lime" | "pink" | "yellow" }) {
  const toneClass =
    tone === "pink"
      ? "border-pink-400/25 bg-pink-400/10 text-pink-300"
      : tone === "yellow"
        ? "border-yellow-300/25 bg-yellow-300/15 text-yellow-200"
        : "border-[#B6FF00]/20 bg-[#B6FF00]/10 text-[#B6FF00]";
  return (
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-xs font-black uppercase ${toneClass}`}>
      {label}
    </div>
  );
}

const Integrations = () => {
  const navigate = useNavigate();
  const { selectedCompanyId } = useAuth();
  const { currentPlan } = useBilling();
  const { addToast } = useToast();
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsappEvolutionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [instagramLoading, setInstagramLoading] = useState(false);
  const [instagramStatus, setInstagramStatus] = useState<InstagramConnectionStatus | null>(null);
  const [mercadoLivreStatus, setMercadoLivreStatus] = useState<MercadoLivreStatus | null>(null);
  const [mercadoLivreDashboard, setMercadoLivreDashboard] = useState<MercadoLivreDashboard | null>(null);
  const [mercadoLivreLoading, setMercadoLivreLoading] = useState(false);
  const [mercadoLivreSyncing, setMercadoLivreSyncing] = useState(false);
  const normalizedPlan = String(currentPlan || "").toUpperCase();
  const canUseMainIntegrations = normalizedPlan === "PREMIUM" || normalizedPlan === "PRO_BUSINESS";
  const canUseMarketplaces = normalizedPlan === "PREMIUM" || normalizedPlan === "PRO_BUSINESS";

  const statusLabel = useMemo(() => {
    if (!whatsappStatus) return "Desconectado";
    if (loading) return "Criando instancia";
    if (whatsappStatus.connected) return "Conectado";
    if (whatsappStatus.status === "WAITING_QR") return "Aguardando QR Code";
    if (whatsappStatus.status === "CONNECTING") return "Conectando";
    if (whatsappStatus.status === "ERROR") return "Erro de conexao";
    return "Desconectado";
  }, [loading, whatsappStatus]);

  const connectionHealthLabel =
    whatsappStatus?.webhookEnabled ? "Webhook configurado" : "Pendente";
  const automationLabel =
    whatsappStatus?.connected ? "Atendimento pronto" : "Aguardando conexão";

  useEffect(() => {
    if (!selectedCompanyId || !canUseMainIntegrations) {
      setWhatsappStatus(null);
      setInstagramStatus(null);
      setMercadoLivreStatus(null);
      setMercadoLivreDashboard(null);
      return;
    }
    getWhatsappStatus()
      .then(setWhatsappStatus)
      .catch(() => undefined);
    getInstagramStatus(selectedCompanyId)
      .then(setInstagramStatus)
      .catch(() => undefined);
    if (canUseMarketplaces) {
      getMercadoLivreStatus(selectedCompanyId)
        .then(setMercadoLivreStatus)
        .catch(() => undefined);
      getMercadoLivreDashboard(selectedCompanyId)
        .then(setMercadoLivreDashboard)
        .catch(() => undefined);
    } else {
      setMercadoLivreStatus(null);
      setMercadoLivreDashboard(null);
    }
  }, [canUseMainIntegrations, canUseMarketplaces, selectedCompanyId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const provider = params.get("integration_provider");
    if (provider !== "instagram" && provider !== "mercadolivre") return;

    const status = params.get("integration_status");
    const message = params.get("integration_message");
    const providerLabel = provider === "mercadolivre" ? "Mercado Livre" : "Instagram";
    addToast(
      message || (status === "connected" ? `${providerLabel} conectado.` : `Nao foi possivel conectar o ${providerLabel}.`),
      status === "connected" ? "success" : "error",
    );
    window.history.replaceState({}, "", window.location.pathname);
    if (provider === "mercadolivre" && selectedCompanyId && canUseMarketplaces) {
      getMercadoLivreStatus(selectedCompanyId).then(setMercadoLivreStatus).catch(() => undefined);
      getMercadoLivreDashboard(selectedCompanyId).then(setMercadoLivreDashboard).catch(() => undefined);
    }
  }, [addToast, canUseMarketplaces, selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId || !canUseMainIntegrations) return;
    if (whatsappStatus?.connected) return;
    if (whatsappStatus?.status !== "WAITING_QR" && whatsappStatus?.status !== "CONNECTING") return;

    const timer = window.setInterval(() => {
      handleRefreshConnectionStatus();
    }, 6000);

    return () => window.clearInterval(timer);
  }, [canUseMainIntegrations, selectedCompanyId, whatsappStatus?.connected, whatsappStatus?.status]);


  const handleConnect = async () => {
    if (!selectedCompanyId) {
      addToast("Selecione uma empresa antes de conectar.", "error");
      return;
    }
    try {
      setLoading(true);
      const next = await connectWhatsapp();
      setWhatsappStatus(next);
      addToast(next.connected ? "WhatsApp conectado." : "Instancia criada. Escaneie o QR Code.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Nao foi possivel conectar o WhatsApp."), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshQr = async () => {
    if (!selectedCompanyId) return;
    try {
      setLoading(true);
      const next = await getWhatsappQr();
      setWhatsappStatus(next);
      addToast("QR Code atualizado.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Nao foi possivel gerar um novo QR Code."), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshConnectionStatus = async () => {
    if (!selectedCompanyId) return;
    try {
      const next = await getWhatsappConnectionStatus();
      setWhatsappStatus(next);
    } catch {
      undefined;
    }
  };

  const handleDisconnect = async () => {
    if (!selectedCompanyId) return;

    try {
      setLoading(true);
      await disconnectWhatsapp();
      const next = await getWhatsappStatus();
      setWhatsappStatus(next);
      addToast("WhatsApp desconectado.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Nao foi possivel desconectar."), "error");
    } finally {
      setLoading(false);
    }
  };
  const refreshInstagramStatus = async () => {
    if (!selectedCompanyId) return;
    const next = await getInstagramStatus(selectedCompanyId);
    setInstagramStatus(next);
  };

  const handleInstagramConnect = async () => {
    if (!selectedCompanyId) {
      addToast("Selecione uma empresa antes de conectar.", "error");
      return;
    }

    try {
      setInstagramLoading(true);
      const returnTo = `${window.location.pathname}${window.location.search}`;
      const session = await getInstagramConnectUrl(selectedCompanyId, returnTo);
      window.location.assign(session.authUrl);
    } catch (error) {
      addToast(getErrorMessage(error, "NÃ£o foi possÃ­vel iniciar o Instagram."), "error");
      setInstagramLoading(false);
    }
  };

  const handleInstagramDisconnect = async () => {
    if (!selectedCompanyId) return;

    try {
      setInstagramLoading(true);
      await disconnectInstagram(selectedCompanyId);
      await refreshInstagramStatus();
      addToast("Instagram desconectado.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "NÃ£o foi possÃ­vel desconectar o Instagram."), "error");
    } finally {
      setInstagramLoading(false);
    }
  };

  const refreshMercadoLivre = async () => {
    if (!selectedCompanyId || !canUseMarketplaces) return;
    const [status, dashboard] = await Promise.all([
      getMercadoLivreStatus(selectedCompanyId),
      getMercadoLivreDashboard(selectedCompanyId),
    ]);
    setMercadoLivreStatus(status);
    setMercadoLivreDashboard(dashboard);
  };

  const handleMercadoLivreConnect = async () => {
    if (!selectedCompanyId) {
      addToast("Selecione uma empresa antes de conectar.", "error");
      return;
    }
    if (!canUseMarketplaces) {
      addToast("Mercado Livre esta disponivel a partir do plano Premium.", "error");
      return;
    }

    try {
      setMercadoLivreLoading(true);
      const returnTo = `${window.location.pathname}${window.location.search}`;
      const session = await getMercadoLivreConnectUrl(selectedCompanyId, returnTo);
      window.location.assign(session.authUrl);
    } catch (error) {
      addToast(getErrorMessage(error, "Nao foi possivel iniciar o Mercado Livre."), "error");
      setMercadoLivreLoading(false);
    }
  };

  const handleMercadoLivreSync = async () => {
    if (!selectedCompanyId || !canUseMarketplaces) return;
    try {
      setMercadoLivreSyncing(true);
      await syncMercadoLivre(selectedCompanyId);
      await refreshMercadoLivre();
      addToast("IntegraÃ§Ã£o Mercado Livre reprocessada.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Falha ao sincronizar Mercado Livre."), "error");
    } finally {
      setMercadoLivreSyncing(false);
    }
  };

  const handleMercadoLivreDisconnect = async () => {
    if (!selectedCompanyId || !canUseMarketplaces) return;
    try {
      setMercadoLivreLoading(true);
      await disconnectMercadoLivre(selectedCompanyId);
      await refreshMercadoLivre();
      addToast("Mercado Livre desconectado.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Nao foi possivel desconectar Mercado Livre."), "error");
    } finally {
      setMercadoLivreLoading(false);
    }
  };

  if (!canUseMainIntegrations) {
    return (
      <main className="mx-auto max-w-[1080px] space-y-6">
        <section className="space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#c2caad]">
            IntegraÃ§Ãµes
          </p>
          <h1 className="text-4xl font-black tracking-[-0.04em] text-[#B6FF00] md:text-5xl">
            Canais conectados ao lucro
          </h1>
        </section>

        <section className="rounded-[24px] border border-[#B6FF00]/20 bg-[#080A08] p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-red-400/30 bg-red-500/15 text-red-300">
                <LockIcon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
                  DisponÃ­vel no Premium
                </p>
                <h2 className="mt-2 text-2xl font-black text-zinc-50">
                  Assine Premium para ter integraÃ§Ãµes e mais.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
                  As integraÃ§Ãµes automÃ¡ticas liberam conexÃ£o com canais de venda, atendimento e dados em tempo real para sua empresa.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/planos?upgrade=integrations")}
              className="rounded-lg bg-lime-300 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-zinc-950 transition hover:brightness-105"
            >
              Ver planos
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1080px] space-y-6">
      <section className="space-y-2">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#c2caad]">
          IntegraÃ§Ãµes
        </p>
        <h1 className="text-4xl font-black tracking-[-0.04em] text-[#B6FF00] md:text-5xl">
          Canais conectados ao lucro
        </h1>
      </section>

      <section className={integrationCardClass}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-5">
            <div className="flex items-start gap-4">
              <IntegrationMark label="WA" />
              <div>
                <h2 className="text-3xl font-black tracking-tight text-[#F5F7F2]">
                  WhatsApp Business
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                  Conecte seu WhatsApp a NEXT usando QR Code.
                </p>
              </div>
            </div>
            <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-[#B6FF00]/15 bg-[#121512] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Status</p>
                <p className="mt-1 font-bold text-zinc-100">{statusLabel}</p>
              </div>
              <div className="rounded-xl border border-[#B6FF00]/15 bg-[#121512] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Numero</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {whatsappStatus?.phoneNumber || "Aguardando conexao"}
                </p>
              </div>
              <div className="rounded-xl border border-[#B6FF00]/15 bg-[#121512] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Provedor</p>
                <p className="mt-1 font-bold text-zinc-100">Evolution Go</p>
              </div>
              <div className="rounded-xl border border-[#B6FF00]/15 bg-[#121512] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Webhook</p>
                <p className="mt-1 font-bold text-zinc-100">{connectionHealthLabel}</p>
              </div>
              <div className="rounded-xl border border-[#B6FF00]/15 bg-[#121512] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Atendimento IA</p>
                <p className="mt-1 font-bold text-zinc-100">{automationLabel}</p>
              </div>
            </div>
            {whatsappStatus?.status === "ERROR" ? (
              <p className="rounded-md border border-red-500/30 bg-red-950/30 p-3 text-sm font-semibold text-red-200">
                Nao foi possivel conectar. Tente gerar um novo QR Code.
              </p>
            ) : null}
            {whatsappStatus?.status === "WAITING_QR" || whatsappStatus?.qrCode || whatsappStatus?.qrCodeText || whatsappStatus?.pairingCode ? (
              <div className="rounded-xl border border-[#B6FF00]/20 bg-[#121512] p-4">
                <p className="text-sm font-bold text-zinc-100">
                  Escaneie o QR Code com o WhatsApp para conectar.
                </p>
                {whatsappStatus?.qrCode ? (
                  <div className="mt-4 flex justify-center rounded-lg bg-white p-3 sm:inline-flex">
                    <img
                      src={whatsappStatus.qrCode.startsWith("data:") ? whatsappStatus.qrCode : `data:image/png;base64,${whatsappStatus.qrCode}`}
                      alt="QR Code WhatsApp"
                      className="h-56 w-56"
                    />
                  </div>
                ) : null}
                {!whatsappStatus?.qrCode && whatsappStatus?.qrCodeText ? (
                  <p className="mt-3 break-all rounded-lg border border-[#B6FF00]/15 bg-black/30 p-3 text-xs font-semibold text-zinc-200">
                    {whatsappStatus.qrCodeText}
                  </p>
                ) : null}
                {whatsappStatus?.pairingCode ? (
                  <p className="mt-3 text-sm font-bold text-[#B6FF00]">
                    Codigo de pareamento: {whatsappStatus.pairingCode}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 gap-3">
            {whatsappStatus?.connected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={loading}
                className={secondaryButtonClass}
              >
                {loading ? "Desconectando..." : "Desconectar"}
              </button>
            ) : (
              <>
                {(whatsappStatus?.status === "WAITING_QR" || whatsappStatus?.status === "CONNECTING") ? (
                  <button
                    type="button"
                    onClick={handleRefreshQr}
                    disabled={loading || !selectedCompanyId || !canUseMainIntegrations}
                    className={secondaryButtonClass}
                  >
                    {loading ? "Atualizando..." : "Atualizar QR"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={loading || !selectedCompanyId || !canUseMainIntegrations}
                  className={integrationButtonClass}
                >
                  {loading ? "Criando..." : "Conectar WhatsApp"}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className={integrationCardClass}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-5">
            <div className="flex items-start gap-4">
              <IntegrationMark label="IG" tone="pink" />
              <div>
              <h2 className="text-3xl font-black tracking-tight text-[#F5F7F2]">
                Instagram
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Organize mensagens e oportunidades vindas do Direct do Instagram diretamente no seu pipeline.
              </p>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-[#B6FF00]/15 bg-[#121512] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Status</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {getInstagramStatusLabel(instagramStatus)}
                </p>
              </div>
              <div className="rounded-xl border border-[#B6FF00]/15 bg-[#121512] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Conta</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {instagramStatus?.connected ? "Conta profissional conectada" : "Aguardando conexÃ£o"}
                </p>
              </div>
              <div className="rounded-xl border border-[#B6FF00]/15 bg-[#121512] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Oportunidades</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {instagramStatus?.connected ? "Mensagens organizadas" : "Conecte para ativar"}
                </p>
              </div>
            </div>

            {instagramStatus?.provider_setup_required ? (
              <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm font-semibold text-amber-100">
                A conexÃ£o com Instagram estÃ¡ temporariamente indisponÃ­vel. Tente novamente em instantes.
              </p>
            ) : null}
            {isInstagramTokenExpired(instagramStatus) ? (
              <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm font-semibold text-amber-100">
                Token expirado / ReconexÃ£o necessÃ¡ria.
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 gap-3">
            {instagramStatus?.connected && !isInstagramTokenExpired(instagramStatus) ? (
              <button
                type="button"
                onClick={handleInstagramDisconnect}
                disabled={instagramLoading}
                className={secondaryButtonClass}
              >
                {instagramLoading ? "Desconectando..." : "Desconectar"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleInstagramConnect}
                disabled={instagramLoading || !canUseMainIntegrations || Boolean(instagramStatus?.provider_setup_required)}
                className={integrationButtonClass}
              >
                {instagramLoading
                  ? "Abrindo Instagram..."
                  : !canUseMainIntegrations
                    ? "Disponivel no Premium"
                  : isInstagramTokenExpired(instagramStatus)
                    ? "Reconectar Instagram"
                    : "Conectar Instagram"}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className={integrationCardClass}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-5">
            <div className="flex items-start gap-4">
              <IntegrationMark label="ML" tone="yellow" />
              <div>
              <h2 className="text-3xl font-black tracking-tight text-[#F5F7F2]">
                Mercado Livre
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Conecte sua conta vendedora para importar produtos, pedidos, vendas e dados operacionais automaticamente.
              </p>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-[#B6FF00]/15 bg-[#121512] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Status</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {mercadoLivreStatus?.connected ? "Conectado" : "Desconectado"}
                </p>
              </div>
              <div className="rounded-xl border border-[#B6FF00]/15 bg-[#121512] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Conta</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {mercadoLivreStatus?.nickname || mercadoLivreStatus?.mlUserId || "Aguardando OAuth"}
                </p>
              </div>
              <div className="rounded-xl border border-[#B6FF00]/15 bg-[#121512] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Receita ML</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {Number(mercadoLivreDashboard?.revenue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
              <div className="rounded-xl border border-[#B6FF00]/15 bg-[#121512] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Produtos</p>
                <p className="mt-1 font-bold text-zinc-100">{mercadoLivreDashboard?.products || 0}</p>
              </div>
              <div className="rounded-xl border border-[#B6FF00]/15 bg-[#121512] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Pedidos</p>
                <p className="mt-1 font-bold text-zinc-100">{mercadoLivreDashboard?.orders || 0}</p>
              </div>
              <div className="rounded-xl border border-[#B6FF00]/15 bg-[#121512] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Perguntas</p>
                <p className="mt-1 font-bold text-zinc-100">{mercadoLivreDashboard?.pendingQuestions || 0} pendentes</p>
              </div>
              <div className="rounded-xl border border-[#B6FF00]/15 bg-[#121512] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Ãšltima sync</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {mercadoLivreStatus?.lastSyncAt ? new Date(mercadoLivreStatus.lastSyncAt).toLocaleString("pt-BR") : "Ainda nÃ£o sincronizado"}
                </p>
              </div>
            </div>

            {mercadoLivreStatus?.webhook ? (
              <p className="rounded-md border border-lime-400/20 bg-lime-400/10 p-3 text-sm font-semibold text-lime-100">
                Prova de conexao: ultimo webhook {mercadoLivreStatus.webhook.status.toLowerCase()} em {new Date(mercadoLivreStatus.webhook.lastEventAt).toLocaleString("pt-BR")}.
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            {mercadoLivreStatus?.connected ? (
              <>
                <button
                  type="button"
                  onClick={handleMercadoLivreSync}
                  disabled={mercadoLivreSyncing || !canUseMarketplaces}
                  className={integrationButtonClass}
                >
                  {mercadoLivreSyncing ? "Reprocessando..." : "Reprocessar integraÃ§Ã£o"}
                </button>
                <button
                  type="button"
                  onClick={handleMercadoLivreDisconnect}
                  disabled={mercadoLivreLoading}
                  className={secondaryButtonClass}
                >
                  Desconectar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleMercadoLivreConnect}
                disabled={mercadoLivreLoading || !canUseMarketplaces}
                className={integrationButtonClass}
              >
                {mercadoLivreLoading
                  ? "Abrindo Mercado Livre..."
                  : !canUseMarketplaces
                    ? "Disponivel no Premium"
                    : "Conectar Mercado Livre"}
              </button>
            )}
          </div>
        </div>
      </section>

      {!canUseMarketplaces ? (
        <p className="rounded-lg border border-lime-400/20 bg-lime-400/10 p-4 text-sm font-semibold text-lime-100">
          Mercado Livre esta disponivel a partir do Premium.
        </p>
      ) : null}

    </main>
  );
};

export default Integrations;










