import React, { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../App";
import { useToast } from "../components/Toast";
import { WhatsAppStatus } from "../components/WhatsAppStatus";
import {
  getAttendantConversation,
  getAttendantConversations,
  getAttendantRoi,
  getBotConfig,
  normalizeConversation,
  pauseAttendantConversation,
  resumeAttendantConversation,
  sendHumanAttendantMessage,
  updateBotConfig,
} from "../src/services/endpoints";
import type { BotConfig, ConversationThread } from "../src/types/domain";
import { getErrorMessage } from "../src/services/error";

const defaultConfig: BotConfig = {
  id: "",
  companyId: "",
  botName: "Atendente Next Level",
  agentName: "Atendente Next Level",
  welcomeMessage: "Olá! Sou a assistente virtual da empresa. Como posso te ajudar hoje?",
  toneOfVoice: "Amigável",
  tone: "Amigável",
  instructions:
    "Sempre seja educada e prestativa. Nunca invente preços. Se o cliente pedir humano, transfira o atendimento e pause por 24h.",
  isActive: true,
  isOnline: true,
};

const toneOptions = ["Amigável", "Profissional", "Descontraído", "Formal"];

const statusClassMap: Record<string, string> = {
  "IA respondeu": "border-lime-400/30 bg-lime-400/10 text-lime-300",
  Aguardando: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  "Humano assumiu": "border-sky-400/30 bg-sky-400/10 text-sky-300",
};

type LiveFeedPayload = {
  companyId: string;
  event?: string;
  incomingMessage?: string;
  aiResponse?: string;
  conversation?: unknown;
};

function resolveSocketUrl() {
  const raw = String(
    import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || window.location.origin,
  ).trim();

  if (!raw) {
    return window.location.origin;
  }

  return raw.replace(/\/api\/?$/i, "");
}

const Attendant = () => {
  const { selectedCompanyId } = useAuth();
  const { addToast } = useToast();
  const [config, setConfig] = useState<BotConfig>(defaultConfig);
  const [conversations, setConversations] = useState<ConversationThread[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationThread | null>(null);
  const [roi, setRoi] = useState<{ iaSalesCount: number; iaRevenue: number } | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [humanMessage, setHumanMessage] = useState("");
  const [sendingHumanMessage, setSendingHumanMessage] = useState(false);

  const loadConfig = async () => {
    if (!selectedCompanyId) return;
    setLoadingConfig(true);
    try {
      const data = await getBotConfig(selectedCompanyId);
      setConfig(data);
    } catch (error) {
      addToast(getErrorMessage(error, "Falha ao carregar o agente."), "error");
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadConversations = async (keepSelection = true) => {
    if (!selectedCompanyId) return;
    setLoadingConversations(true);
    try {
      const data = await getAttendantConversations({ companyId: selectedCompanyId, limit: 20 });
      setConversations(data);

      if (keepSelection && selectedConversation) {
        const refreshed = await getAttendantConversation(selectedCompanyId, selectedConversation.id);
        setSelectedConversation(refreshed);
      }
    } catch {
      // polling silencioso
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadRoi = async () => {
    if (!selectedCompanyId) return;
    try {
      const data = await getAttendantRoi(selectedCompanyId);
      setRoi(data);
    } catch {
      setRoi(null);
    }
  };

  useEffect(() => {
    void loadConfig();
    void loadConversations(false);
    void loadRoi();
    const interval = setInterval(() => void loadConversations(true), 20000);
    return () => clearInterval(interval);
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId) {
      return;
    }

    const socket: Socket = io(`${resolveSocketUrl()}/attendant`, {
      transports: ["websocket"],
      withCredentials: true,
      query: { companyId: selectedCompanyId },
    });

    socket.on("conversation.updated", (payload: LiveFeedPayload) => {
      if (!payload?.conversation) {
        return;
      }

      const normalized = normalizeConversation(payload.conversation);

      setConversations((current) => {
        const next = current.filter((item) => item.id !== normalized.id);
        return [normalized, ...next].slice(0, 20);
      });

      setSelectedConversation((current) =>
        current?.id === normalized.id ? normalized : current,
      );

      if (payload.event === "ai.replied") {
        void loadRoi();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedCompanyId]);

  const openConversation = async (conversationId: string) => {
    if (!selectedCompanyId) return;
    try {
      const thread = await getAttendantConversation(selectedCompanyId, conversationId);
      setSelectedConversation(thread);
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível abrir a conversa."), "error");
    }
  };

  const handleSaveAgent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCompanyId) return;
    setSavingConfig(true);
    try {
      const updated = await updateBotConfig(selectedCompanyId, {
        agentName: config.agentName || config.botName,
        botName: config.agentName || config.botName,
        welcomeMessage: config.welcomeMessage,
        tone: config.tone,
        toneOfVoice: config.tone,
        instructions: config.instructions,
        isOnline: config.isOnline,
        isActive: config.isOnline,
      });
      setConfig(updated);
      addToast("Agente salvo e ativo!", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Erro ao salvar o agente."), "error");
    } finally {
      setSavingConfig(false);
    }
  };

  const handlePause = async (conversationId: string) => {
    if (!selectedCompanyId) return;
    try {
      await pauseAttendantConversation(selectedCompanyId, conversationId);
      await loadConversations(true);
      if (selectedConversation?.id === conversationId) {
        const refreshed = await getAttendantConversation(selectedCompanyId, conversationId);
        setSelectedConversation(refreshed);
      }
      addToast("Conversa assumida por humano por 24h.", "info");
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível assumir a conversa."), "error");
    }
  };

  const handleResume = async (conversationId: string) => {
    if (!selectedCompanyId) return;
    try {
      await resumeAttendantConversation(selectedCompanyId, conversationId);
      await loadConversations(true);
      if (selectedConversation?.id === conversationId) {
        const refreshed = await getAttendantConversation(selectedCompanyId, conversationId);
        setSelectedConversation(refreshed);
      }
      addToast("Conversa devolvida para a IA.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível devolver para a IA."), "error");
    }
  };

  const handleSendHumanMessage = async () => {
    if (!selectedCompanyId || !selectedConversation || !humanMessage.trim()) return;
    setSendingHumanMessage(true);
    try {
      const updated = await sendHumanAttendantMessage(
        selectedCompanyId,
        selectedConversation.id,
        humanMessage.trim(),
      );
      setSelectedConversation(updated);
      setHumanMessage("");
      await loadConversations(false);
      addToast("Mensagem humana enviada.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível enviar a mensagem."), "error");
    } finally {
      setSendingHumanMessage(false);
    }
  };

  const feed = useMemo(() => conversations.slice(0, 10), [conversations]);

  return (
    <div className="space-y-6">
      <header className="rounded-[28px] border border-zinc-800 bg-[radial-gradient(circle_at_top_right,rgba(182,255,0,0.12),transparent_30%),#09090b] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lime-300">Atendente IA</p>
            <h1 className="mt-2 text-3xl font-black text-zinc-50">Seu agente no WhatsApp</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Configure a identidade do agente, acompanhe mensagens em tempo real e assuma o controle quando quiser.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <WhatsAppStatus companyId={selectedCompanyId} />
            <div className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] ${config.isOnline ? "border-lime-400/30 bg-lime-400/10 text-lime-300" : "border-zinc-700 bg-zinc-900 text-zinc-400"}`}>
              {config.isOnline ? "Agente Online" : "Agente Offline"}
            </div>
          </div>
        </div>
      </header>

      {roi ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Conversas ativas</p>
            <p className="mt-2 text-3xl font-black text-zinc-50">{conversations.length}</p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Respostas da IA</p>
            <p className="mt-2 text-3xl font-black text-lime-300">{roi.iaSalesCount}</p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">ROI visível</p>
            <p className="mt-2 text-xl font-black text-zinc-50">Acompanhamento em tempo real</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={(event) => void handleSaveAgent(event)} className="rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-6">
          <div className="mb-5">
            <h2 className="text-xl font-black text-zinc-50">Configuração do Agente</h2>
            <p className="mt-2 text-sm text-zinc-400">Tudo em linguagem simples para o cliente final.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Nome do Agente</span>
              <input
                value={config.agentName || config.botName}
                onChange={(event) => setConfig((current) => ({ ...current, agentName: event.target.value, botName: event.target.value }))}
                placeholder="Sofia, Max, Atendente Next Level"
                disabled={loadingConfig}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none focus:border-lime-400/40"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Tom de voz</span>
              <select
                value={config.tone || config.toneOfVoice}
                onChange={(event) => setConfig((current) => ({ ...current, tone: event.target.value, toneOfVoice: event.target.value }))}
                disabled={loadingConfig}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none focus:border-lime-400/40"
              >
                {toneOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 block space-y-2 text-sm">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Mensagem de boas-vindas</span>
            <textarea
              rows={3}
              value={config.welcomeMessage || ""}
              onChange={(event) => setConfig((current) => ({ ...current, welcomeMessage: event.target.value }))}
              placeholder="Olá! Sou a Sofia, assistente virtual da [empresa]. Como posso te ajudar hoje?"
              disabled={loadingConfig}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none focus:border-lime-400/40"
            />
          </label>

          <label className="mt-4 block space-y-2 text-sm">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Instruções do Agente</span>
            <textarea
              rows={7}
              value={config.instructions || ""}
              onChange={(event) => setConfig((current) => ({ ...current, instructions: event.target.value }))}
              placeholder="Você é a Sofia, atendente virtual da Loja XYZ. Sempre seja educada e prestativa. Nunca ofereça desconto acima de 10% sem autorização. Se o cliente quiser falar com humano, diga que vai transferir e pause o bot por 24h."
              disabled={loadingConfig}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none focus:border-lime-400/40"
            />
          </label>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-zinc-100">Agente Online</p>
                  <p className="text-xs text-zinc-500">Quando desligado, o agente para de responder.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig((current) => ({ ...current, isOnline: !current.isOnline, isActive: !current.isOnline }))}
                  className={`relative h-7 w-12 rounded-full ${config.isOnline ? "bg-lime-400" : "bg-zinc-700"}`}
                >
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${config.isOnline ? "left-6" : "left-1"}`} />
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-sm font-bold text-zinc-100">Pausar para atendimento humano</p>
              <p className="mt-1 text-xs text-zinc-500">Use os botões de cada conversa para pausar por 24h.</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Regras de segurança</p>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                "A IA nunca inventa preços — se não houver valor no contexto, informa que vai confirmar com um humano.",
                "Sempre se identifica como assistente virtual — nunca finge ser humano.",
                "Detecta frustração e escala automaticamente para atendimento humano, pausando o bot por 24h.",
              ].map((rule) => (
                <div key={rule} className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-300">
                  <span className="mr-2">🔒</span>
                  {rule}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={savingConfig || loadingConfig}
            className="mt-6 rounded-2xl bg-[#B6FF00] px-6 py-3 text-sm font-black text-zinc-950 transition hover:brightness-105 disabled:opacity-50"
          >
            {savingConfig ? "Salvando..." : "Salvar Agente"}
          </button>
        </form>

        <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-zinc-50">Live Feed</h2>
            <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              {loadingConversations ? "Atualizando..." : "Tempo real"}
            </span>
          </div>

          <div className="space-y-3">
            {feed.length === 0 ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 text-sm text-zinc-400">
                Nenhuma conversa ainda. Conecte o WhatsApp para começar.
              </div>
            ) : (
              feed.map((conversation) => {
                const customerMessage = [...conversation.messages]
                  .reverse()
                  .find((message) => message.role === "user");
                const aiMessage = [...conversation.messages]
                  .reverse()
                  .find((message) => message.role === "assistant");
                const paused = conversation.isPaused && conversation.pausedUntil && new Date(conversation.pausedUntil) > new Date();

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => void openConversation(conversation.id)}
                    className="w-full rounded-3xl border border-zinc-800 bg-zinc-900/60 p-4 text-left transition hover:border-lime-400/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-zinc-100">{conversation.contactName || conversation.contactNumber}</p>
                        <p className="text-xs text-zinc-500">{conversation.contactNumber}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${statusClassMap[conversation.status] || statusClassMap["Aguardando"]}`}>
                        {conversation.status}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Cliente</p>
                        <p className="mt-2 line-clamp-3 text-sm text-zinc-300">
                          {customerMessage?.content || "Aguardando mensagem."}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-lime-400/20 bg-lime-400/5 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lime-300">IA</p>
                          <span className="rounded-full border border-lime-400/30 bg-lime-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-lime-300">
                            IA respondeu
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-3 text-sm text-lime-100">
                          {aiMessage?.content || "Sem resposta da IA ainda."}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-zinc-500">
                        {new Date(conversation.lastMessageAt).toLocaleString("pt-BR")}
                      </span>
                      {paused ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleResume(conversation.id);
                          }}
                          className="rounded-2xl border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs font-bold text-sky-300"
                        >
                          Devolver para IA
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handlePause(conversation.id);
                          }}
                          className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-300"
                        >
                          Assumir conversa
                        </button>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </div>

      {selectedConversation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={() => setSelectedConversation(null)}>
          <div className="w-full max-w-4xl rounded-[28px] border border-zinc-800 bg-zinc-950 p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex flex-col gap-4 border-b border-zinc-800 pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-black text-zinc-50">
                  {selectedConversation.contactName || selectedConversation.contactNumber}
                </h3>
                <p className="mt-1 text-sm text-zinc-500">{selectedConversation.contactNumber}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {selectedConversation.isPaused ? (
                  <button
                    type="button"
                    onClick={() => void handleResume(selectedConversation.id)}
                    className="rounded-2xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm font-black text-sky-300"
                  >
                    Devolver para IA
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handlePause(selectedConversation.id)}
                    className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-black text-amber-300"
                  >
                    Assumir conversa
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedConversation(null)}
                  className="rounded-2xl border border-zinc-800 px-4 py-3 text-sm font-bold text-zinc-300"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-3 rounded-[28px] border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-3xl px-4 py-3 text-sm ${
                        message.role === "assistant"
                          ? "ml-10 bg-lime-400/10 text-lime-100"
                          : message.role === "human"
                            ? "ml-10 bg-sky-400/10 text-sky-100"
                            : "mr-10 bg-zinc-800 text-zinc-100"
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                        {message.role === "assistant" ? "IA" : message.role === "human" ? "Humano" : "Cliente"} •{" "}
                        {new Date(message.timestamp).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="text-sm font-black text-zinc-100">Responder como humano</p>
                <textarea
                  rows={8}
                  value={humanMessage}
                  onChange={(event) => setHumanMessage(event.target.value)}
                  placeholder="Digite a resposta que será enviada para o cliente..."
                  className="mt-3 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-sky-400/40"
                />
                <button
                  type="button"
                  onClick={() => void handleSendHumanMessage()}
                  disabled={sendingHumanMessage || !humanMessage.trim()}
                  className="mt-4 w-full rounded-2xl bg-sky-400 px-4 py-3 text-sm font-black text-zinc-950 transition hover:brightness-105 disabled:opacity-50"
                >
                  {sendingHumanMessage ? "Enviando..." : "Enviar como humano"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Attendant;
