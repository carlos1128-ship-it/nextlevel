import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "../types";
import { SendIcon, UserIcon, LightbulbIcon } from "../components/icons";
import { useAuth } from "../App";
import { useToast } from "../components/Toast";
import { chatWithAi, getCompanies } from "../src/services/endpoints";
import { getErrorMessage } from "../src/services/error";

const CHAT_STORAGE_KEY = "chat_history_v1";
const QUICK_PROMPTS = [
  "Resuma as perdas de hoje e me diga onde agir primeiro.",
  "Quais setores da empresa merecem mais atenção agora?",
  "Monte um plano de otimização de custos para esta semana.",
];

const TypingIndicator = () => (
  <div className="flex items-center space-x-1 p-2">
    <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: "0s" }} />
    <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: "0.2s" }} />
    <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: "0.4s" }} />
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
      // ignore
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

      const errorText = isUsageLimit
        ? "Você atingiu o limite mensal de IA do seu plano. Faça upgrade para continuar."
        : isGeminiError
          ? "A IA está sobrecarregada no momento. Tente novamente em instantes."
          : "Não consegui processar sua solicitação agora.";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: errorText,
          sender: "ai",
        },
      ]);
      addToast(errorText, "error");
    } finally {
      setIsTyping(false);
    }
  };

  const safeMessages = Array.isArray(messages) ? messages : [];
  const canSend = useMemo(() => input.trim().length > 0 && !isTyping, [input, isTyping]);

  return (
    <div className="card-base relative flex h-[calc(100vh-160px)] min-h-[680px] flex-col overflow-hidden">
      <header className="z-10 border-b border-[#B6FF00]/10 bg-[#070A08]/88 px-6 py-5 backdrop-blur-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-2 w-2 rounded-full bg-[#B6FF00] animate-pulse"></span>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B6FF00]">Canal de Inteligência</p>
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white">Análise Operacional AI</h1>
            <p className="mt-1 text-xs text-zinc-500 font-bold uppercase tracking-tight">
              Sessão: <span className="text-zinc-300">{companyName}</span>
            </p>
          </div>
          <button
            onClick={() => {
              if (window.confirm("Deseja realmente limpar o histórico de análise?")) {
                localStorage.removeItem(CHAT_STORAGE_KEY);
                setMessages([
                  {
                    id: 1,
                    text: `Olá, ${username || "usuário"}! Estou pronto para analisar a operação da sua empresa e apontar riscos, perdas e oportunidades.`,
                    sender: "ai",
                  },
                ]);
              }
            }}
            className="flex items-center gap-2 rounded-xl border border-[#B6FF00]/10 bg-[#090C09] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[#AEB8B4] transition-all hover:border-[#B6FF00]/40 hover:bg-[#11170F] hover:text-white active:scale-95"
            type="button"
          >
            Resetar Sessão
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void sendMessage(prompt)}
              disabled={isTyping}
              className="px-4 py-2 rounded-xl border border-white/5 bg-black/40 text-[10px] font-bold text-zinc-400 transition-all hover:border-[#B6FF00]/40 hover:text-white hover:bg-[#B6FF00]/5 disabled:opacity-30 whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto bg-[#050706] p-6 scrollbar-hide">
        {safeMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <LightbulbIcon className="h-12 w-12 mb-4 text-[#B6FF00]" />
            <p className="text-sm font-black uppercase tracking-widest text-[#B6FF00]">Aguardando Comando</p>
          </div>
        ) : (
          safeMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-4 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${
                msg.sender === "ai" 
                  ? "border-[#B6FF00]/20 bg-[#B6FF00]/10 text-[#B6FF00]" 
                  : "border-[#B6FF00]/10 bg-[#090C09] text-zinc-400"
              }`}>
                {msg.sender === "ai" ? <LightbulbIcon className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
              </div>
              
              <div
                className={`group relative max-w-[85%] md:max-w-[70%] p-4 rounded-2xl transition-all duration-300 ${
                  msg.sender === "user"
                    ? "bg-[#B6FF00] text-[#050706] rounded-tr-none shadow-lg shadow-lime-300/5 font-medium"
                    : "border border-[#B6FF00]/10 bg-[#090C09] text-zinc-200 rounded-tl-none hover:border-[#B6FF00]/35 hover:bg-[#11170F]"
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))
        )}
        {isTyping ? (
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[#B6FF00]/20 bg-[#B6FF00]/10 text-[#B6FF00]">
              <LightbulbIcon className="h-4 w-4" />
            </div>
            <div className="rounded-2xl border border-[#B6FF00]/10 bg-[#090C09] p-1 px-2">
              <TypingIndicator />
            </div>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[#B6FF00]/10 bg-[#070A08]/88 p-6 backdrop-blur-md">
        <div className="relative group max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void sendMessage()}
            placeholder="Comando de análise..."
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#B6FF00]/40 focus:ring-1 focus:ring-[#B6FF00]/20 transition-all font-medium"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={!canSend}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#B6FF00] text-[#050706] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-lime-300/10 disabled:opacity-20"
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="text-center mt-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest pointer-events-none">
          Next Level Intelligence Core v2.5
        </p>
      </div>
    </div>
  );
};

export default Chat;
