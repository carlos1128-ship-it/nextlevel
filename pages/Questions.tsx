import React, { useEffect, useState } from "react";
import { useAuth } from "../App";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { useToast } from "../components/Toast";
import { getErrorMessage } from "../src/services/error";
import {
  answerMercadoLivreQuestion,
  getMercadoLivreQuestions,
  type MercadoLivreQuestion,
} from "../src/services/endpoints";

const Questions = () => {
  const { selectedCompanyId } = useAuth();
  const { addToast } = useToast();
  const [questions, setQuestions] = useState<MercadoLivreQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = async () => {
    if (!selectedCompanyId) {
      setQuestions([]);
      setError("Selecione uma empresa.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setQuestions(await getMercadoLivreQuestions(selectedCompanyId));
    } catch (err) {
      const message = getErrorMessage(err, "Nao foi possivel carregar perguntas.");
      setError(message);
      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuestions();
  }, [selectedCompanyId]);

  const handleAnswer = async (question: MercadoLivreQuestion) => {
    if (!selectedCompanyId) return;
    const text = answers[question.mlQuestionId]?.trim();
    if (!text) {
      addToast("Digite uma resposta.", "info");
      return;
    }
    try {
      setSavingId(question.mlQuestionId);
      await answerMercadoLivreQuestion(selectedCompanyId, question.mlQuestionId, text);
      setAnswers((current) => ({ ...current, [question.mlQuestionId]: "" }));
      await loadQuestions();
      addToast("Resposta enviada.", "success");
    } catch (err) {
      addToast(getErrorMessage(err, "Falha ao responder pergunta."), "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="space-y-6">
      <section>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-300">Mercado Livre</p>
        <h1 className="text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">Perguntas</h1>
      </section>

      {loading ? (
        <LoadingState label="Carregando perguntas..." />
      ) : error ? (
        <ErrorState title="Erro nas perguntas" description={error} actionLabel="Tentar novamente" onAction={loadQuestions} />
      ) : questions.length === 0 ? (
        <EmptyState title="Nenhuma pergunta sincronizada" description="Perguntas do Mercado Livre entram aqui para priorizacao humana e IA." />
      ) : (
        <section className="grid gap-4">
          {questions.map((question) => {
            const unanswered = question.status === "unanswered" || !question.answer;
            return (
              <article key={question.id} className="rounded-2xl border border-zinc-900 bg-zinc-950 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-100">{question.question}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {question.mlItemId || "Item ML"} · {question.dateCreated ? new Date(question.dateCreated).toLocaleString("pt-BR") : "sem data"}
                    </p>
                  </div>
                  <span className={`w-max rounded-full px-3 py-1 text-xs font-black uppercase ${
                    unanswered ? "bg-amber-400/15 text-amber-200" : "bg-lime-400/15 text-lime-300"
                  }`}>
                    {unanswered ? "Pendente" : "Respondida"}
                  </span>
                </div>

                {question.answer ? (
                  <div className="mt-4 rounded-xl border border-lime-400/20 bg-lime-400/10 p-3 text-sm text-lime-100">
                    {question.answer}
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                    <textarea
                      value={answers[question.mlQuestionId] || ""}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [question.mlQuestionId]: event.target.value,
                        }))
                      }
                      rows={3}
                      className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                      placeholder="Resposta para o cliente"
                    />
                    <button
                      type="button"
                      onClick={() => handleAnswer(question)}
                      disabled={savingId === question.mlQuestionId}
                      className="rounded-xl bg-lime-400 px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-950 disabled:opacity-50"
                    >
                      {savingId === question.mlQuestionId ? "Enviando..." : "Responder"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
};

export default Questions;
