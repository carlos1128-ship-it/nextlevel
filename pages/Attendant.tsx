import React, { useEffect, useState } from "react";
import { useAuth } from "../App";
import { useToast } from "../components/Toast";
import {
  getAgentConfig,
  getConversationsLiveFeed,
  saveAgentConfig,
} from "../src/services/endpoints";
import { getErrorMessage } from "../src/services/error";
import type { AgentConfig, ConversationLiveFeedItem } from "../src/types/domain";

const emptyConfig: Partial<AgentConfig> = {
  agentName: "Atendente Next Level",
  welcomeMessage: "Oi! Sou o atendimento da empresa. Como posso ajudar?",
  companyDescription: "",
  systemPrompt:
    "Você é um atendente comercial claro, útil e focado em gerar ROI para o cliente.",
  toneOfVoice: "consultivo",
  internetSearchEnabled: false,
  speechToTextEnabled: false,
  imageUnderstandingEnabled: false,
  splitRepliesEnabled: false,
  messageBufferEnabled: true,
  pauseForHuman: true,
  debounceSeconds: 3,
  maxContextMessages: 20,
  isEnabled: false,
  modelProvider: "openai",
  modelName: "gpt-4o-mini",
};

const booleanFields: Array<{
  key: keyof AgentConfig;
  label: string;
}> = [
  { key: "isEnabled", label: "Atendente ativo" },
  { key: "internetSearchEnabled", label: "Pesquisa na internet" },
  { key: "speechToTextEnabled", label: "Áudio para texto" },
  { key: "imageUnderstandingEnabled", label: "Leitura de imagem" },
  { key: "splitRepliesEnabled", label: "Dividir respostas" },
  { key: "messageBufferEnabled", label: "Buffer ativo" },
  { key: "pauseForHuman", label: "Pausar para humano" },
];

const channelLabel = (item: ConversationLiveFeedItem) =>
  item.channel === "instagram" || item.provider === "INSTAGRAM" ? "Instagram" : "WhatsApp";

const Attendant = () => {
  const { selectedCompanyId } = useAuth();
  const { addToast } = useToast();
  const [config, setConfig] = useState<Partial<AgentConfig>>(emptyConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [liveFeed, setLiveFeed] = useState<ConversationLiveFeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);

  useEffect(() => {
    if (!selectedCompanyId) return;

    setLoading(true);
    getAgentConfig(selectedCompanyId)
      .then((data) => setConfig(data))
      .catch((error) => {
        addToast(getErrorMessage(error, "Não foi possível carregar o atendente."), "error");
      })
      .finally(() => setLoading(false));
  }, [addToast, selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId) {
      setLiveFeed([]);
      return;
    }

    let active = true;
    const loadFeed = async (showLoading = false) => {
      try {
        if (showLoading) setFeedLoading(true);
        const data = await getConversationsLiveFeed({
          companyId: selectedCompanyId,
          limit: 20,
        });
        if (active) setLiveFeed(data);
      } catch {
        if (active) setLiveFeed([]);
      } finally {
        if (active) setFeedLoading(false);
      }
    };

    void loadFeed(true);
    const timer = window.setInterval(() => {
      void loadFeed();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [selectedCompanyId]);

  const updateField = <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!selectedCompanyId) {
      addToast("Selecione uma empresa antes de salvar.", "error");
      return;
    }

    try {
      setSaving(true);
      const saved = await saveAgentConfig(selectedCompanyId, config);
      setConfig(saved);
      addToast("Atendente IA salvo.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível salvar o atendente."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-7">
      <section className="nl-page-header">
        <p className="nl-page-eyebrow">Atendente IA</p>
        <h1 className="nl-page-title">Configuração do agente</h1>
        <p className="nl-page-description">
          Ajuste a voz, os limites e os canais do atendente para responder clientes com segurança.
        </p>
      </section>

      <section className="nl-card p-5 md:p-7">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="nl-label">
              Nome
            </span>
            <input
              value={config.agentName || ""}
              onChange={(event) => updateField("agentName", event.target.value)}
              className="nl-input"
            />
          </label>

          <label className="space-y-2">
            <span className="nl-label">
              Tom de voz
            </span>
            <input
              value={config.toneOfVoice || ""}
              onChange={(event) => updateField("toneOfVoice", event.target.value)}
              className="nl-input"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="nl-label">
              Descrição da empresa
            </span>
            <textarea
              value={config.companyDescription || ""}
              onChange={(event) => updateField("companyDescription", event.target.value)}
              rows={3}
              className="nl-input min-h-[96px] resize-y"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="nl-label">
              Mensagem inicial
            </span>
            <textarea
              value={config.welcomeMessage || ""}
              onChange={(event) => updateField("welcomeMessage", event.target.value)}
              rows={3}
              className="nl-input min-h-[96px] resize-y"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="nl-label">
              Prompt do sistema
            </span>
            <textarea
              value={config.systemPrompt || ""}
              onChange={(event) => updateField("systemPrompt", event.target.value)}
              rows={7}
              className="nl-input min-h-[168px] resize-y"
            />
          </label>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="nl-label">
              Modelo
            </span>
            <input
              value={config.modelName || ""}
              onChange={(event) => updateField("modelName", event.target.value)}
              className="nl-input"
            />
          </label>

          <label className="space-y-2">
            <span className="nl-label">
              Debounce
            </span>
            <input
              type="number"
              min={0}
              max={300}
              value={config.debounceSeconds ?? 3}
              onChange={(event) => updateField("debounceSeconds", Number(event.target.value))}
              className="nl-input"
            />
          </label>

          <label className="space-y-2">
            <span className="nl-label">
              Contexto
            </span>
            <input
              type="number"
              min={1}
              max={200}
              value={config.maxContextMessages ?? 20}
              onChange={(event) => updateField("maxContextMessages", Number(event.target.value))}
              className="nl-input"
            />
          </label>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4 xl:grid-cols-7">
          {booleanFields.map((field) => (
            <label
              key={field.key}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3 text-sm font-semibold text-zinc-200"
            >
              <span>{field.label}</span>
              <input
                type="checkbox"
                checked={Boolean(config[field.key])}
                onChange={(event) => updateField(field.key, event.target.checked as never)}
                className="nl-switch-input"
              />
              <span className="nl-switch-track" aria-hidden="true">
                <span className="nl-switch-thumb" />
              </span>
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving || !selectedCompanyId}
            className="nl-button-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar atendente"}
          </button>
        </div>
      </section>

      <section className="nl-card p-5 md:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">
              Conversas
            </p>
            <h2 className="mt-2 text-xl font-black text-zinc-50">Feed vivo</h2>
          </div>
          <p className="nl-badge">
            {feedLoading ? "Sincronizando..." : `${liveFeed.length} itens`}
          </p>
        </div>

        <div className="mt-5 divide-y divide-white/[0.07]">
          {liveFeed.length ? (
            liveFeed.map((item) => (
              <article key={item.id} className="grid gap-3 py-4 md:grid-cols-[1fr_140px_120px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-black text-zinc-100">
                      {item.contactName || item.remoteJid || item.contactNumber}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        item.botPaused
                          ? "bg-red-500/10 text-red-300"
                          : "bg-lime-400/10 text-lime-300"
                      }`}
                    >
                      {item.botPaused ? "Humano" : "IA ativa"}
                    </span>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-zinc-300">
                      {channelLabel(item)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-zinc-400">
                    {item.lastMessage || "Sem mensagem"}
                  </p>
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500 md:text-right">
                  {item.lastMessageStatus === "failed" ? "Falha no envio" : item.status}
                </p>
                <p className="text-xs text-zinc-500 md:text-right">
                  {new Date(item.lastMessageAt).toLocaleString("pt-BR")}
                </p>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/[0.09] bg-white/[0.025] px-5 py-8 text-sm font-semibold text-zinc-500">
              Nenhuma conversa registrada ainda. As conversas aparecerão aqui quando o atendente estiver conectado aos canais.
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Attendant;
