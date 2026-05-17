import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string | React.ReactNode;
  icon?: string;
  timestamp?: string;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "ai",
    icon: "smart_toy",
    content: (
      <div>
        <p>Olá, Carlos Henrique! Estou pronto para analisar a operação da sua empresa e apontar riscos, perdas e oportunidades.</p>
        <p className="mt-2" style={{ color: "#B6FF00" }}>Como posso ajudar na estratégia de hoje?</p>
      </div>
    ),
  },
  {
    id: "2",
    role: "user",
    content: "Gostaria de um panorama geral sobre o fluxo financeiro desta semana, focando onde tivemos as maiores saídas.",
  },
  {
    id: "3",
    role: "ai",
    icon: "table_chart",
    content: (
      <div>
        <p>Analisando os dados da semana atual, notei uma concentração de saídas em duas categorias principais. Aqui está o detalhamento:</p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div
            className="p-4 rounded-xl"
            style={{ background: "#1d201e", border: "1px solid #424a33" }}
          >
            <p style={{ fontSize: "12px", color: "#c2caad", marginBottom: "6px" }}>Marketing (Campanhas)</p>
            <p style={{ fontSize: "22px", fontWeight: 700, color: "#ffb4ab" }}>R$ 12.450</p>
            <div style={{ height: "4px", background: "#ffb4ab", borderRadius: "2px", marginTop: "6px", width: "80%" }} />
          </div>
          <div
            className="p-4 rounded-xl"
            style={{ background: "#1d201e", border: "1px solid #424a33" }}
          >
            <p style={{ fontSize: "12px", color: "#c2caad", marginBottom: "6px" }}>Infraestrutura (Servidores)</p>
            <p style={{ fontSize: "22px", fontWeight: 700, color: "#B6FF00" }}>R$ 8.200</p>
            <div style={{ height: "4px", background: "#B6FF00", borderRadius: "2px", marginTop: "6px", width: "55%" }} />
          </div>
        </div>
        <div className="flex items-start gap-2 mt-4 p-3 rounded-lg" style={{ background: "rgba(182,255,0,0.05)", border: "1px solid rgba(182,255,0,0.15)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#B6FF00", marginTop: "2px" }}>lightbulb</span>
          <p style={{ fontSize: "13px", color: "#c2caad", margin: 0 }}>
            Sugestão: Podemos revisar a alocação das campanhas ativas para otimizar o CAC desta semana.
          </p>
        </div>
      </div>
    ),
  },
];

const suggestions = [
  "Resuma as perdas de hoje e me diga onde agir primeiro.",
  "Quais setores da empresa merecem mais atenção agora?",
];

const historyItems = [
  { label: "Análise de fluxo...", time: "10h", day: "Hoje" },
  { label: "Otimização de CAC...", time: "09h", day: "Hoje" },
  { label: "Relatório semanal...", time: "15h", day: "Ontem" },
  { label: "Projeção Q4...", time: "11h", day: "Ontem" },
];

export default function ChatIA() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "ai",
      icon: "smart_toy",
      content: "Analisando sua solicitação... Estou processando os dados da empresa para fornecer uma resposta precisa.",
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#050706" }}>
      <Sidebar />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col" style={{ marginLeft: "220px" }}>
        {/* Header bar */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 py-4"
          style={{ background: "#111412", borderBottom: "1px solid #424a33" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#B6FF00" }}>smart_toy</span>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#B6FF00" }}>
                ASSISTENTE IA
              </span>
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#e1e3de", margin: 0 }}>Chat Estratégico</h2>
            <p style={{ fontSize: "13px", color: "#c2caad", marginTop: "2px" }}>
              Conversando sobre <span style={{ color: "#e1e3de" }}>Carlos Henrique</span>
            </p>
          </div>
          <button
            data-testid="button-limpar-conversa"
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
            style={{ border: "1px solid #424a33", color: "#c2caad", fontSize: "13px", background: "transparent" }}
            onClick={() => setMessages(initialMessages)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete_sweep</span>
            Limpar Conversa
          </button>
        </div>

        {/* Suggestions */}
        <div className="flex-shrink-0 flex gap-2 px-6 pt-4">
          {suggestions.map((s, i) => (
            <button
              key={i}
              data-testid={`button-suggestion-${i}`}
              onClick={() => setInput(s)}
              className="px-3 py-2 rounded-full transition-colors"
              style={{
                border: "1px solid #424a33",
                color: "#c2caad",
                fontSize: "13px",
                background: "transparent",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 sidebar-scroll" style={{ maxHeight: "calc(100vh - 280px)" }}>
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                data-testid={`message-${msg.role}-${msg.id}`}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" && (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ background: "rgba(182,255,0,0.15)", border: "1px solid rgba(182,255,0,0.3)" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#B6FF00" }}>
                      {msg.icon || "smart_toy"}
                    </span>
                  </div>
                )}
                <div
                  className="rounded-2xl px-4 py-3 max-w-2xl"
                  style={{
                    background: msg.role === "ai" ? "#1d201e" : "#272b28",
                    border: `1px solid ${msg.role === "ai" ? "#424a33" : "#323632"}`,
                    fontSize: "14px",
                    color: "#e1e3de",
                    lineHeight: 1.6,
                  }}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-sm font-bold"
                    style={{ background: "#B6FF00", color: "#050706" }}
                  >
                    C
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div
          className="flex-shrink-0 px-6 pb-6 pt-3"
          style={{ background: "#050706" }}
        >
          <div
            className="max-w-3xl mx-auto flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ background: "#111613", border: "1px solid #424a33" }}
          >
            <button
              data-testid="button-attach"
              style={{ color: "#c2caad", background: "transparent", border: "none", cursor: "pointer" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>attach_file</span>
            </button>
            <input
              data-testid="input-chat"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Pergunte sobre perdas, fluxo de caixa, operação, vendas ou oportunidades..."
              className="flex-1"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#e1e3de",
                fontSize: "14px",
              }}
            />
            <button
              data-testid="button-send"
              onClick={sendMessage}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: "#B6FF00", border: "none", cursor: "pointer" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#050706" }}>send</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right history panel */}
      <div
        className="hidden xl:flex flex-col flex-shrink-0"
        style={{ width: "200px", background: "#111412", borderLeft: "1px solid #424a33" }}
      >
        <div className="p-4">
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c2caad", marginBottom: "12px" }}>
            Histórico
          </p>
          {["Hoje", "Ontem"].map((day) => (
            <div key={day} className="mb-4">
              <p style={{ fontSize: "11px", color: "#c2caad", marginBottom: "6px" }}>{day}</p>
              {historyItems
                .filter((h) => h.day === day)
                .map((h, i) => (
                  <button
                    key={i}
                    data-testid={`history-item-${i}`}
                    className="w-full text-left px-2 py-2 rounded-lg mb-1 transition-colors"
                    style={{ background: "transparent", border: "none", cursor: "pointer" }}
                  >
                    <p style={{ fontSize: "13px", color: "#e1e3de", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {h.label}
                    </p>
                    <p style={{ fontSize: "11px", color: "#c2caad", margin: 0 }}>{h.time}</p>
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
