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
  "Quais setores da empresa merecem mais atenção agora?",
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
    <div className="nl-card flex h-[calc(100vh-120px)] min-h-0 flex-col overflow-hidden">
      <header className="border-b border-white/[0.08] bg-[#111613]/70 px-5 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="nl-eyebrow">Assistente IA</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-100">Chat estratégico</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Conversando sobre <span className="text-zinc-200">{companyName}</span>
            </p>
          </div>
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
            className="nl-button-secondary"
            type="button"
          >
            Limpar conversa
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void sendMessage(prompt)}
              disabled={isTyping}
              className="nl-chip transition hover:border-lime-400/40 hover:text-zinc-100 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(182,255,0,0.08),_transparent_30%),linear-gradient(180deg,#080D0B_0%,#050706_100%)] p-5">
        {safeMessages.length === 0 ? (
          <EmptyState
            title="Conversa vazia"
            description="Envie uma pergunta para iniciar o chat com a IA."
          />
        ) : (
          safeMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "ai" ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-lime-300/20 bg-lime-400/15 text-lime-400">
                  <LightbulbIcon className="h-4 w-4" />
                </div>
              ) : null}
              <div
                className={`max-w-[88%] rounded-3xl p-4 shadow-md md:max-w-[70%] ${msg.sender === "user"
                    ? "rounded-br-md bg-[#B6FF00] text-[#050706]"
                    : "rounded-bl-md border border-white/10 bg-[#111613] text-zinc-100"
                  }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.text}</p>
              </div>
              {msg.sender === "user" ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/40">
                  <UserIcon className="h-5 w-5 text-zinc-100" />
                </div>
              ) : null}
            </div>
          ))
        )}
        {isTyping ? (
          <div className="flex items-start justify-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-lime-300/20 bg-lime-400/15 text-lime-400">
              <LightbulbIcon className="h-4 w-4" />
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#111613]">
              <TypingIndicator />
            </div>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/[0.08] bg-[#080D0B]/80 p-4">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void sendMessage()}
            placeholder="Pergunte sobre perdas, fluxo de caixa, operação, vendas ou oportunidades..."
            className="nl-input rounded-full py-3 pl-5 pr-14"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={!canSend}
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#B6FF00] text-[#050706] transition hover:bg-[#9BE600] disabled:opacity-50"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
