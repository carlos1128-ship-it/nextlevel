import React, { useEffect, useState } from "react";
import { useAuth } from "../App";
import { useToast } from "../components/Toast";
import { getAgentConfig, saveAgentConfig } from "../src/services/endpoints";
import { getErrorMessage } from "../src/services/error";
import type { AgentConfig } from "../src/types/domain";

const emptyConfig: Partial<AgentConfig> = {
  agentName: "Atendente Next Level",
  welcomeMessage: "Oi! Sou o atendimento da empresa. Como posso ajudar?",
  systemPrompt:
    "Voce e um atendente comercial claro, util e focado em gerar ROI para o cliente.",
  toneOfVoice: "consultivo",
  internetSearchEnabled: false,
  speechToTextEnabled: false,
  imageUnderstandingEnabled: false,
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
  { key: "speechToTextEnabled", label: "Audio para texto" },
  { key: "imageUnderstandingEnabled", label: "Leitura de imagem" },
  { key: "pauseForHuman", label: "Pausar para humano" },
];

const Attendant = () => {
  const { selectedCompanyId } = useAuth();
  const { addToast } = useToast();
  const [config, setConfig] = useState<Partial<AgentConfig>>(emptyConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedCompanyId) return;

    setLoading(true);
    getAgentConfig(selectedCompanyId)
      .then((data) => setConfig(data))
      .catch((error) => {
        addToast(getErrorMessage(error, "Nao foi possivel carregar o atendente."), "error");
      })
      .finally(() => setLoading(false));
  }, [addToast, selectedCompanyId]);

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
      addToast(getErrorMessage(error, "Nao foi possivel salvar o atendente."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-7">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
          Atendente IA
        </p>
        <h1 className="text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">
          Configuracao do agente
        </h1>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              Nome
            </span>
            <input
              value={config.agentName || ""}
              onChange={(event) => updateField("agentName", event.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              Tom de voz
            </span>
            <input
              value={config.toneOfVoice || ""}
              onChange={(event) => updateField("toneOfVoice", event.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-400"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              Mensagem inicial
            </span>
            <textarea
              value={config.welcomeMessage || ""}
              onChange={(event) => updateField("welcomeMessage", event.target.value)}
              rows={3}
              className="w-full resize-y rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-400"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              Prompt do sistema
            </span>
            <textarea
              value={config.systemPrompt || ""}
              onChange={(event) => updateField("systemPrompt", event.target.value)}
              rows={7}
              className="w-full resize-y rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-400"
            />
          </label>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              Modelo
            </span>
            <input
              value={config.modelName || ""}
              onChange={(event) => updateField("modelName", event.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              Debounce
            </span>
            <input
              type="number"
              min={0}
              max={300}
              value={config.debounceSeconds ?? 3}
              onChange={(event) => updateField("debounceSeconds", Number(event.target.value))}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              Contexto
            </span>
            <input
              type="number"
              min={1}
              max={200}
              value={config.maxContextMessages ?? 20}
              onChange={(event) => updateField("maxContextMessages", Number(event.target.value))}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-lime-400"
            />
          </label>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {booleanFields.map((field) => (
            <label
              key={field.key}
              className="flex items-center justify-between gap-3 rounded-md border border-zinc-800 bg-zinc-900 p-3 text-sm font-semibold text-zinc-200"
            >
              <span>{field.label}</span>
              <input
                type="checkbox"
                checked={Boolean(config[field.key])}
                onChange={(event) => updateField(field.key, event.target.checked as never)}
                className="h-4 w-4 accent-lime-400"
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving || !selectedCompanyId}
            className="rounded-md bg-lime-400 px-5 py-2 text-sm font-black text-zinc-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar atendente"}
          </button>
        </div>
      </section>
    </main>
  );
};

export default Attendant;
