import React, { useEffect, useState } from "react";
import { useAuth } from "../App";
import { useToast } from "./Toast";
import {
  createWhatsappInstance,
  disconnectMetaAPIConfig,
  getMetaWhatsappStatus,
  getWhatsappQRCode,
  saveMetaAPIConfig,
} from "../src/services/endpoints";

type OfficialStatus = {
  connected: boolean;
  phoneNumberId: string | null;
  phoneNumber?: string | null;
};

const quickSteps = [
  "Escaneie o QR Code com o celular da empresa.",
  "Mantenha o aparelho ligado e com internet.",
  "Se o WhatsApp atualizar, talvez seja preciso reconectar.",
];

const officialSteps = [
  "Clique em Configurações → Usuários do Sistema",
  "Clique em Adicionar → Nome: next-level-bot → Função: Admin",
  "Clique em Gerar novo token → selecione seu App → marque whatsapp_business_messaging",
  "Copie o token gerado (começa com EAA...)",
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
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const loadStatus = async () => {
    if (!selectedCompanyId) return;
    try {
      const data = await getMetaWhatsappStatus(selectedCompanyId);
      setOfficialStatus(data);
      if (data?.phoneNumber) {
        setPhoneNumber(data.phoneNumber);
      }
    } catch {
      setOfficialStatus(null);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, [selectedCompanyId]);

  const handleQuickConnect = async () => {
    if (!selectedCompanyId) {
      addToast("Escolha uma empresa antes de conectar.", "info");
      return;
    }

    setQuickLoading(true);
    try {
      await createWhatsappInstance(selectedCompanyId);
      const status = await getWhatsappQRCode(selectedCompanyId);
      setQrCode(status.qrCode || `QR-${selectedCompanyId.slice(-6)}`);
      setQuickOpen(true);
    } catch {
      addToast("Nao foi possivel abrir o QR Code agora.", "error");
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

  return (
    <section className="rounded-[30px] border border-zinc-800 bg-[#09090b] p-6 shadow-2xl shadow-black/30">
      <div className="mb-6 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-lime-300">
          WhatsApp Business
        </p>
        <h2 className="text-2xl font-black text-zinc-50 md:text-3xl">
          Escolha como conectar seu WhatsApp
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-zinc-400">
          Conexao simples para quem quer rapidez, ou conexao oficial para quem quer mais estabilidade.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[28px] border border-amber-400/20 bg-zinc-950/80 p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-zinc-50">Conexão Rápida</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Conecte seu WhatsApp escaneando um QR Code. Mais fácil, porém pode ser instável se o celular desligar ou o WhatsApp atualizar.
              </p>
            </div>
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
              Não oficial — pode ser instável
            </span>
          </div>

          <button
            type="button"
            onClick={() => void handleQuickConnect()}
            disabled={quickLoading || !selectedCompanyId}
            className="w-full rounded-2xl bg-amber-400 px-4 py-3 text-sm font-black text-zinc-950 transition hover:brightness-105 disabled:opacity-50"
          >
            {quickLoading ? "Abrindo QR Code..." : "Conectar via QR Code"}
          </button>
        </article>

        <article className="rounded-[28px] border border-lime-400/20 bg-zinc-950/80 p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-zinc-50">Conexão Oficial Meta</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Conecte usando a API oficial do WhatsApp Business. Mais seguro e estável. Requer 10 minutos de configuração.
              </p>
            </div>
            <span className="rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-lime-300">
              Recomendado — mais estável
            </span>
          </div>

          {officialStatus?.connected ? (
            <div className="mb-4 rounded-2xl border border-lime-400/30 bg-lime-400/10 p-4">
              <p className="text-sm font-bold text-lime-300">✓ WhatsApp Conectado</p>
              <p className="mt-1 text-sm text-zinc-200">
                {officialStatus.phoneNumber || "Número conectado"}
              </p>
            </div>
          ) : null}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOfficialOpen(true)}
              disabled={!selectedCompanyId}
              className="flex-1 rounded-2xl bg-[#B6FF00] px-4 py-3 text-sm font-black text-zinc-950 transition hover:brightness-105 disabled:opacity-50"
            >
              Conectar via Meta API
            </button>
            {officialStatus?.connected ? (
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
        </article>
      </div>

      {quickOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={() => setQuickOpen(false)}>
          <div className="w-full max-w-lg rounded-[28px] border border-zinc-800 bg-zinc-950 p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">Conexão Rápida</p>
                <h3 className="mt-2 text-2xl font-black text-zinc-50">Escaneie o QR Code</h3>
              </div>
              <button type="button" onClick={() => setQuickOpen(false)} className="rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-400">
                Fechar
              </button>
            </div>

            <div className="mt-6 rounded-[24px] border border-amber-400/20 bg-zinc-900/70 p-6 text-center">
              <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-3xl border border-dashed border-amber-300/40 bg-white text-center text-xs font-bold text-zinc-700">
                {qrCode || "QR Code"}
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
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">Conexão Oficial Meta</p>
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
                  Clique no botão abaixo para abrir o Meta Business Suite. Entre com o Facebook vinculado ao seu WhatsApp Business.
                </p>
                <a
                  href="https://business.facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-2xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-100 transition hover:border-lime-400/40"
                >
                  Abrir Meta Business Suite →
                </a>
              </div>

              <div className="rounded-[24px] border border-zinc-800 bg-zinc-900/60 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-300">Passo 2</p>
                <h4 className="mt-2 text-lg font-black text-zinc-50">Gere seu token de acesso</h4>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Dentro do painel da Meta, siga esses passos:
                </p>
                <ol className="mt-3 space-y-2 text-sm text-zinc-300">
                  {officialSteps.map((step, index) => (
                    <li key={step}>
                      {index + 1}. {step}
                    </li>
                  ))}
                </ol>
                <a
                  href="https://business.facebook.com/settings/system-users"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-2xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-100 transition hover:border-lime-400/40"
                >
                  Ir direto para Usuários do Sistema →
                </a>
              </div>

              <div className="rounded-[24px] border border-lime-400/20 bg-lime-400/5 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-300">Passo 3</p>
                <h4 className="mt-2 text-lg font-black text-zinc-50">Cole seu token aqui</h4>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Pronto! Cole o token copiado abaixo e clique em Conectar. O Next Level configura tudo automaticamente.
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
                <p className="mt-3 text-xs text-zinc-400">🔒 Seu token é armazenado com segurança</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default IntegrationsHub;
