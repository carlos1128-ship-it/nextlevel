import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export default function AtendenteIA() {
  const [agentName, setAgentName] = useState("Atendente Next Level");
  const [tone, setTone] = useState("Consultivo");
  const [companyDesc, setCompanyDesc] = useState("");
  const [initialMsg, setInitialMsg] = useState("Olá! Sou o atendimento da empresa. Como posso ajudar?");
  const [systemPrompt, setSystemPrompt] = useState(
    "Você é um atendente comercial claro, útil e focado em gerar ROI para o cliente. Siga as políticas da empresa e não invente informações."
  );
  const [model, setModel] = useState("gpt-4o-mini");
  const [debounce, setDebounce] = useState(3);
  const [context, setContext] = useState(20);

  return (
    <div className="flex min-h-screen" style={{ background: "#050706" }}>
      <Sidebar />
      <div className="flex-1" style={{ marginLeft: "220px" }}>
        <TopBar
          breadcrumbs={[
            { label: "ATENDENTE IA" },
            { label: "Configuração do agente" },
          ]}
        />
        <main className="pt-20 px-6 pb-10">
          {/* Header */}
          <div className="flex items-start justify-between mt-4 mb-8">
            <div>
              <h2 style={{ fontSize: "32px", fontWeight: 700, color: "#e1e3de", margin: 0 }}>
                Configuração do agente
              </h2>
              <p style={{ color: "#c2caad", fontSize: "14px", marginTop: "6px" }}>
                Defina a identidade e as diretrizes operacionais do seu assistente virtual.
              </p>
            </div>
            <button
              data-testid="button-salvar-configuracoes"
              className="px-5 py-2.5 rounded-lg font-bold transition-colors"
              style={{ background: "#B6FF00", color: "#050706", fontSize: "14px", border: "none" }}
            >
              Salvar configurações
            </button>
          </div>

          {/* Form Card */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "#111613", border: "1px solid #424a33", maxWidth: "800px" }}
          >
            {/* Identidade section */}
            <div className="mb-6">
              <p style={{ fontSize: "13px", color: "#c2caad", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #424a33" }}>
                Identidade
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label style={{ fontSize: "13px", color: "#e1e3de", display: "block", marginBottom: "8px" }}>
                    Nome do Agente
                  </label>
                  <input
                    data-testid="input-agent-name"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg transition-all"
                    style={{
                      background: "transparent",
                      border: "1px solid #424a33",
                      color: "#e1e3de",
                      fontSize: "14px",
                      outline: "none",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#B6FF00"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#424a33"; }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#e1e3de", display: "block", marginBottom: "8px" }}>
                    Tom de Voz
                  </label>
                  <select
                    data-testid="select-tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg transition-all appearance-none"
                    style={{
                      background: "#1d201e",
                      border: "1px solid #424a33",
                      color: "#e1e3de",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  >
                    <option value="Consultivo">Consultivo</option>
                    <option value="Formal">Formal</option>
                    <option value="Amigável">Amigável</option>
                    <option value="Técnico">Técnico</option>
                  </select>
                </div>
              </div>

              {/* Company description */}
              <div className="mb-4">
                <label style={{ fontSize: "13px", color: "#e1e3de", display: "block", marginBottom: "8px" }}>
                  Descrição da Empresa
                </label>
                <textarea
                  data-testid="textarea-company-desc"
                  value={companyDesc}
                  onChange={(e) => setCompanyDesc(e.target.value)}
                  placeholder="Forneça o contexto sobre a empresa para o agente..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg resize-none transition-all"
                  style={{
                    background: "transparent",
                    border: "1px solid #424a33",
                    color: "#e1e3de",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#B6FF00"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#424a33"; }}
                />
              </div>

              {/* Initial message */}
              <div className="mb-4">
                <label style={{ fontSize: "13px", color: "#e1e3de", display: "block", marginBottom: "8px" }}>
                  Mensagem Inicial
                </label>
                <input
                  data-testid="input-initial-message"
                  value={initialMsg}
                  onChange={(e) => setInitialMsg(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg transition-all"
                  style={{
                    background: "transparent",
                    border: "1px solid #424a33",
                    color: "#e1e3de",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#B6FF00"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#424a33"; }}
                />
              </div>

              {/* System prompt */}
              <div className="mb-6">
                <label style={{ fontSize: "13px", color: "#e1e3de", display: "block", marginBottom: "8px" }}>
                  Diretrizes do Sistema (Prompt)
                </label>
                <div style={{ borderBottom: "1px solid #424a33", marginBottom: "12px" }} />
                <textarea
                  data-testid="textarea-system-prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg resize-none transition-all"
                  style={{
                    background: "transparent",
                    border: "1px solid #424a33",
                    color: "#e1e3de",
                    fontSize: "14px",
                    outline: "none",
                    fontFamily: "'Courier New', monospace",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#B6FF00"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#424a33"; }}
                />
              </div>

              {/* Model & Parameters */}
              <div>
                <label style={{ fontSize: "13px", color: "#e1e3de", display: "block", marginBottom: "16px" }}>
                  Modelo e Parâmetros
                </label>
                <div className="grid grid-cols-3 gap-6 items-end">
                  {/* Model selector */}
                  <div>
                    <label style={{ fontSize: "12px", color: "#c2caad", display: "block", marginBottom: "8px" }}>
                      Modelo
                    </label>
                    <select
                      data-testid="select-model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg appearance-none"
                      style={{
                        background: "#1d201e",
                        border: "1px solid #424a33",
                        color: "#e1e3de",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    >
                      <option value="gpt-4o-mini">gpt-4o-mini</option>
                      <option value="gpt-4o">gpt-4o</option>
                      <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                    </select>
                  </div>

                  {/* Debounce slider */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label style={{ fontSize: "12px", color: "#c2caad" }}>Debounce</label>
                      <span style={{ fontSize: "12px", color: "#B6FF00", fontWeight: 700 }}>{debounce}s</span>
                    </div>
                    <input
                      data-testid="slider-debounce"
                      type="range"
                      min={0}
                      max={10}
                      value={debounce}
                      onChange={(e) => setDebounce(Number(e.target.value))}
                      className="w-full"
                      style={{ accentColor: "#B6FF00" }}
                    />
                  </div>

                  {/* Context slider */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label style={{ fontSize: "12px", color: "#c2caad" }}>Contexto</label>
                      <span style={{ fontSize: "12px", color: "#B6FF00", fontWeight: 700 }}>{context} msg</span>
                    </div>
                    <input
                      data-testid="slider-context"
                      type="range"
                      min={1}
                      max={50}
                      value={context}
                      onChange={(e) => setContext(Number(e.target.value))}
                      className="w-full"
                      style={{ accentColor: "#B6FF00" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
