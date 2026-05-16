import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "../types";
import { SendIcon, UserIcon, LightbulbIcon } from "../components/icons";
import { useAuth } from "../App";
import { useToast } from "../components/Toast";
import { EmptyState } from "../components/AsyncState";
import { chatWithAi, getCompanies } from "../src/services/endpoints";
import { getErrorMessage } from "../src/services/error";

const CHAT_STORAGE_KEY = "chat_history_v1";
const QUICK_PROMPTS = [
  "Resuma as perdas de hoje e me diga onde agir primeiro.",
  "Quais áreas da empresa merecem mais atenção agora?",
  "Monte um plano de otimização de custos para esta semana.",
];

const TypingIndicator = () => (
  <div className="flex items-center space-x-1 p-2">
    <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "0s" }} />
    <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "0.2s" }} />
    <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: "0.4s" }} />
  </div>
);

const normalizeText = (value: string) =>
  value
    .replace(/\*/g, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();

const Chat = () => {
  const { username, detailLevel, selectedCompanyId } = useAuth();
  const { addToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [companyName, setCompanyName] = useState("empresa ativa");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    const seedMessage = {
      id: 1,
      text: `Olá, ${username || "usuário"}! Estou pronto para analisar a operação da sua empresa e apontar riscos, perdas e oportunidades.`,
      sender: "ai" as const,
    };

    if (!raw) {
      setMessages([seedMessage]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as ChatMessage[];
      if (Array.isArray(parsed) && parsed.length) {
        setMessages(parsed);
        return;
      }
    } catch {
      // ignore parse error and re-seed intro message
    }
    setMessages([seedMessage]);
  }, [username]);

  useEffect(() => {
    if (!messages.length) return;
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-50)));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    getCompanies()
      .then((companies) => {
        const list = Array.isArray(companies) ? companies : [];
        const active = list.find((company) => (company.id || company._id) === selectedCompanyId) || list[0];
        setCompanyName(active?.name || "empresa ativa");
      })
      .catch(() => {
        setCompanyName("empresa ativa");
      });
  }, [selectedCompanyId]);

  const resolveCompanyId = async () => {
    if (selectedCompanyId) return selectedCompanyId;
    const companies = await getCompanies();
    const first = Array.isArray(companies) ? companies[0] : null;
    const firstId = first?.id || first?._id || null;
    return firstId;
  };

  const sendMessage = async (preset?: string) => {
    const userInput = (preset || input).trim();
    if (!userInput || isTyping) return;

    setMessages((prev) => [...prev, { id: Date.now(), text: userInput, sender: "user" }]);
    setInput("");
    setIsTyping(true);

    try {
      const companyId = await resolveCompanyId();
      if (!companyId) {
        throw new Error("Crie ou selecione uma empresa para conversar com a IA.");
      }
      const data = await chatWithAi({ companyId, message: userInput, detailLevel });
      const responseText =
        typeof data === "string" ? data : data.response || data.message || "Sem resposta.";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: normalizeText(responseText),
          sender: "ai",
        },
      ]);
    } catch (error) {
      const message = getErrorMessage(error, "Erro ao consultar IA.");
      const normalizedMessage = message.toLowerCase();
      const isUsageLimit =
        normalizedMessage.includes("limite de ia") ||
        normalizedMessage.includes("limite mensal de ia") ||
        normalizedMessage.includes("plan_limit_reached");
      const isGeminiError = normalizedMessage.includes('gemini') ||
        normalizedMessage.includes('overloaded') ||
        normalizedMessage.includes('rate limit') ||
        normalizedMessage.includes('503') ||
        normalizedMessage.includes('529');

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: isUsageLimit
            ? "Você atingiu o limite mensal de IA do seu plano. Faça upgrade para continuar usando este recurso."
            : isGeminiError
              ? "A IA está sobrecarregada no momento. Tente novamente em alguns segundos ou minutos."
              : "Não consegui responder agora. Tente novamente em alguns segundos.",
          sender: "ai",
        },
      ]);
      addToast(
        isUsageLimit
          ? "Você atingiu o limite mensal de IA do seu plano. Faça upgrade para continuar usando este recurso."
          : isGeminiError
            ? "Aviso: IA sobrecarregada, tente novamente em alguns segundos"
            : message,
        "error",
      );
    } finally {
      setIsTyping(false);
    }
  };

  const safeMessages = Array.isArray(messages) ? messages : [];
  const canSend = useMemo(() => input.trim().length > 0 && !isTyping, [input, isTyping]);

  return (
    <div className="nl-page flex flex-col h-[calc(100vh-140px)]">
      <div className="nl-page-header border-b border-white/5 pb-6 mb-0">
        <div className="nl-page-header__meta">
          <p className="nl-eyebrow">Motor de Inteligência Cognitiva</p>
          <h1 className="nl-page-title">Análise Estratégica</h1>
          <p className="nl-page-subtitle">
            Consulte dados cruzados da <span className="text-[var(--nl-text-primary)] font-bold italic">{companyName}</span> para decisões baseadas em evidências.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={() => {
              localStorage.removeItem(CHAT_STORAGE_KEY);
              setMessages([
                {
                  id: 1,
                  text: `Olá, ${username || "usuário"}! Estou pronto para analisar a operação da sua empresa e apontar riscos, perdas e oportunidades.`,
                  sender: "ai",
                },
              ]);
            }}
            className="nl-button-secondary text-[10px] py-1.5 px-4"
            type="button"
          >
            Limpar Memória
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col bg-[rgba(255,255,255,0.01)] backdrop-blur-3xl rounded-b-3xl border-x border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
           <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-[var(--nl-neon)] opacity-[0.03] blur-[120px] rounded-full" />
           <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-blue-500 opacity-[0.02] blur-[100px] rounded-full" />
        </div>

        <div className="flex flex-wrap gap-2 px-6 pt-4 pb-2 z-10">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void sendMessage(prompt)}
              disabled={isTyping}
              className="text-[10px] font-bold py-1.5 px-3 rounded-full border border-white/5 bg-white/5 text-[var(--nl-text-muted)] hover:text-white hover:border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scroll-smooth z-10 custom-scrollbar">
          {safeMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center opacity-30 grayscale scale-90">
              <EmptyState
                title="Pronto para Análise"
                description="Submeta uma dúvida estratégica para iniciar."
              />
            </div>
          ) : (
            safeMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-4 ${msg.sender === "user" ? "flex-row-reverse" : "justify-start"}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg ${
                  msg.sender === "ai" 
                    ? "bg-[var(--nl-neon)] text-black" 
                    : "bg-white/5 border border-white/10 text-white"
                }`}>
                  {msg.sender === "ai" ? "NL" : (username?.[0] || "U")}
                </div>
                
                <div
                  className={`relative p-4 rounded-2xl max-w-[80%] lg:max-w-[70%] border transition-all ${
                    msg.sender === "user"
                      ? "bg-white/5 border-white/10 rounded-tr-none text-[var(--nl-text-primary)]"
                      : "nl-card-glass border-[var(--nl-neon)]/15 rounded-tl-none text-[var(--nl-text-secondary)] shadow-[0_4px_30px_rgba(0,0,0,0.2)]"
                  }`}
                >
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap selection:bg-[var(--nl-neon)] selection:text-black">
                    {msg.text}
                  </p>
                  <span className="absolute bottom-[-18px] right-2 text-[9px] font-black uppercase tracking-widest opacity-20">
                    {msg.sender === "ai" ? "Next Intelligence" : "Protocolo de Usuário"}
                  </span>
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--nl-neon)] text-black flex items-center justify-center text-xs font-black animate-pulse">
                NL
              </div>
              <div className="nl-card-glass border-[var(--nl-neon)]/15 rounded-2xl rounded-tl-none p-4 shadow-xl">
                 <div className="flex gap-1.5 py-1">
                    <span className="w-1.5 h-1.5 bg-[var(--nl-neon)] rounded-full animate-bounce delay-0" />
                    <span className="w-1.5 h-1.5 bg-[var(--nl-neon)] rounded-full animate-bounce delay-150" />
                    <span className="w-1.5 h-1.5 bg-[var(--nl-neon)] rounded-full animate-bounce delay-300" />
                 </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 bg-transparent z-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--nl-neon)] to-blue-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void sendMessage()}
                placeholder="Busque por perdas ocultas, tendências ou planos de ação..."
                className="w-full h-14 bg-black border border-white/10 rounded-2xl py-0 px-6 text-[var(--nl-text-primary)] text-sm transition focus:border-[var(--nl-neon)]/50 focus:outline-none pr-16 shadow-2xl placeholder:opacity-40"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!canSend}
                className="absolute right-2 top-1.5 bottom-1.5 w-12 flex items-center justify-center rounded-xl bg-[var(--nl-neon)] text-black transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale"
              >
                <SendIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <p className="mt-3 text-center text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--nl-text-muted)] opacity-50">
            Powered by Next Cognitive Core v2.5 • Decisões baseadas em real-time data
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
