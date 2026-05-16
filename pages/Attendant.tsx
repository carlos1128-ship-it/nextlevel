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
    <div className="nl-page">
      <div className="nl-page-header">
        <div className="nl-page-header__meta">
          <p className="nl-eyebrow">Agência Digital Autônoma</p>
          <h1 className="nl-page-title">Personalidade do Agente</h1>
          <p className="nl-page-subtitle">
            Configure o comportamento, conhecimento e ferramentas do seu atendente IA para maximizar conversões.
          </p>
        </div>
      </div>

      <section className="nl-card p-6 md:p-8 mb-8">
        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-[var(--nl-text-muted)] mb-8 flex items-center gap-2">
           <span className="h-1.5 w-1.5 rounded-full bg-[var(--nl-neon)] shadow-[0_0_8px_var(--nl-neon)]" />
           Identidade & Diretrizes
        </h3>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] px-1">Pseudônimo do Agente</span>
            <input
              value={config.agentName || ""}
              onChange={(event) => updateField("agentName", event.target.value)}
              placeholder="Ex: Atendente Next Level"
              className="nl-input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] px-1">Tom de Comunicação</span>
            <input
              value={config.toneOfVoice || ""}
              onChange={(event) => updateField("toneOfVoice", event.target.value)}
              placeholder="Ex: Consultivo, amigável"
              className="nl-input"
            />
          </div>

          <div className="flex flex-col gap-2 lg:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] px-1">Core Business (Descrição)</span>
            <textarea
              value={config.companyDescription || ""}
              onChange={(event) => updateField("companyDescription", event.target.value)}
              rows={3}
              placeholder="Descreva o que sua empresa faz..."
              className="nl-input min-h-[100px] py-3"
            />
          </div>

          <div className="flex flex-col gap-2 lg:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] px-1">Boas-vindas Padrão</span>
            <textarea
              value={config.welcomeMessage || ""}
              onChange={(event) => updateField("welcomeMessage", event.target.value)}
              rows={2}
              placeholder="Mensagem disparada no primeiro contato..."
              className="nl-input min-h-[80px] py-3"
            />
          </div>

          <div className="flex flex-col gap-2 lg:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] px-1">Prompt de Instrução Mestra</span>
            <textarea
              value={config.systemPrompt || ""}
              onChange={(event) => updateField("systemPrompt", event.target.value)}
              rows={6}
              placeholder="Regras de ouro para a IA seguir..."
              className="nl-input py-4 font-mono text-xs leading-relaxed"
            />
          </div>
        </div>

        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-[var(--nl-text-muted)] mb-8 mt-12 flex items-center gap-2">
           <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
           Parâmetros Heurísticos
        </h3>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] px-1">Engine Cerebrat</span>
            <input
              value={config.modelName || ""}
              onChange={(event) => updateField("modelName", event.target.value)}
              className="nl-input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] px-1">Debounce de Resposta</span>
            <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={300}
                  value={config.debounceSeconds ?? 3}
                  onChange={(event) => updateField("debounceSeconds", Number(event.target.value))}
                  className="nl-input pr-10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--nl-text-muted)]">SEG</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] px-1">Tokens de Contexto</span>
            <input
              type="number"
              min={1}
              max={200}
              value={config.maxContextMessages ?? 20}
              onChange={(event) => updateField("maxContextMessages", Number(event.target.value))}
              className="nl-input"
            />
          </div>
        </div>

        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-[var(--nl-text-muted)] mb-8 mt-12 flex items-center gap-2">
           <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
           Módulos Funcionais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {booleanFields.map((field) => (
            <label
              key={field.key}
              className="nl-card-glass p-5 cursor-pointer flex items-center justify-between group hover:border-white/10 transition-colors"
            >
              <span className="text-[12px] font-bold text-[var(--nl-text-secondary)] group-hover:text-white transition-colors">
                {field.label}
              </span>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={Boolean(config[field.key])}
                  onChange={(event) => updateField(field.key, event.target.checked as never)}
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full border border-white/10 bg-white/5 transition-colors duration-200 ease-in-out peer-focus:outline-none peer-checked:border-[var(--nl-neon)] peer-checked:bg-[var(--nl-neon)] after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white/40 after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:bg-white" />
              </div>
            </label>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center">
           <p className="text-[11px] text-[var(--nl-text-muted)] max-w-sm">
             Todas as alterações são aplicadas instantaneamente ao motor de inferência assim que salvas.
           </p>
           <button
             type="button"
             onClick={handleSave}
             disabled={loading || saving || !selectedCompanyId}
             className="nl-button-primary px-10 py-3 text-xs"
           >
             {saving ? "Sincronizando..." : "Salvar Configurações"}
           </button>
        </div>
      </section>

      <section className="nl-card overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
           <div>
              <h3 className="text-[13px] font-bold text-[var(--nl-text-primary)]">Fluxo de Diálogos em Tempo Real</h3>
              <p className="text-[11px] text-[var(--nl-text-muted)] mt-0.5">Monitoramento de interação humana vs IA</p>
           </div>
           <div className={`nl-badge-${feedLoading ? "muted" : "neon"} transition-all`}>
              {feedLoading ? "Sincronizando..." : "Conexão Estável"}
           </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="nl-table">
            <thead>
              <tr>
                <th className="w-[30%]">Contato & Canal</th>
                <th>Status Operacional</th>
                <th className="text-right">Último Evento</th>
              </tr>
            </thead>
            <tbody>
              {liveFeed.length ? (
                liveFeed.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                           <span className="text-[13px] font-bold text-[var(--nl-text-primary)]">
                             {item.contactName || item.remoteJid || item.contactNumber}
                           </span>
                           <span className={`nl-badge-${item.botPaused ? "danger" : "neon"} scale-90`}>
                             {item.botPaused ? "Humano" : "IA Ativa"}
                           </span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold uppercase text-[var(--nl-text-muted)]">{channelLabel(item)}</span>
                           <span className="text-[11px] text-[var(--nl-text-secondary)] truncate max-w-[200px]">
                             {item.lastMessage || "Aguardando..."}
                           </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${item.lastMessageStatus === "failed" ? "text-red-400" : "text-[var(--nl-text-muted)]"}`}>
                        {item.lastMessageStatus === "failed" ? "✘ Falha no Envio" : `✔ ${item.status}`}
                      </span>
                    </td>
                    <td className="text-right">
                       <span className="text-[12px] text-[var(--nl-text-secondary)]">
                          {new Date(item.lastMessageAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-12 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--nl-text-muted)]">
                      Nenhuma atividade capturada no momento.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Attendant;
