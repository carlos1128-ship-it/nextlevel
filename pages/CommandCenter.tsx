import React, { useEffect, useState } from "react";
import { useAuth } from "../App";
import { useToast } from "../components/Toast";
import { executeStrategicAction, getStrategicActions } from "../src/services/endpoints";
import type { StrategicAction } from "../src/types/domain";
import { ArrowUpRightIcon } from "../components/icons";
import { AppCard, ActionCard } from "../components/ui/Card";

const ImpactBadge = ({ score }: { score: number }) => {
  const color =
    score >= 80 ? "bg-red-500/20 text-red-200 border-red-400/30" :
    score >= 60 ? "bg-amber-500/20 text-amber-200 border-amber-400/30" :
    "bg-lime-500/15 text-lime-200 border-lime-400/30";
  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] border ${color}`}>
      Impacto {score}
    </span>
  );
};

const CommandCenter = () => {
  const { selectedCompanyId } = useAuth();
  const { addToast } = useToast();
  const [actions, setActions] = useState<StrategicAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);

  const loadActions = async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const data = await getStrategicActions({ companyId: selectedCompanyId, status: "SUGGESTED" });
      setActions(data);
    } catch (error) {
      addToast("Não foi possível carregar ações sugeridas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadActions();
  }, [selectedCompanyId]);

  const handleExecute = async (id: string) => {
    if (!selectedCompanyId) return;
    setExecutingId(id);
    try {
      await executeStrategicAction(id, selectedCompanyId);
      addToast("Plano aprovado e executado", "success");
      await loadActions();
    } catch (error) {
      addToast("Falha ao executar plano", "error");
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Central de Comando</p>
          <h1 className="text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">
            Planos de Ação da IA
          </h1>
          <p className="text-sm text-zinc-500">
            Projetos sugeridos pela IA a partir de conversas, insights, vendas, custos, clientes e integrações conectadas.
          </p>
        </div>
        <button
          onClick={() => void loadActions()}
          className="self-start rounded-2xl bg-lime-400 px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 transition hover:opacity-90"
        >
          Atualizar
        </button>
      </div>

      {loading ? (
        <AppCard className="grid min-h-[180px] place-items-center p-10">
          <p className="text-2xl font-black tracking-[0.24em] text-[#B6FF00]">NEXT LEVEL</p>
        </AppCard>
      ) : actions.length === 0 ? (
        <AppCard className="border-dashed p-8 text-zinc-400">
          Nenhum projeto sugerido no momento. Assim que a IA detectar risco ou oportunidade com dados reais, os planos aparecerão aqui para aprovação.
        </AppCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {actions.map((action) => (
            <ActionCard key={action.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">{action.type}</p>
                  <h3 className="text-xl font-black tracking-tight text-zinc-100">{action.title}</h3>
                </div>
                <ImpactBadge score={action.impactScore} />
              </div>
              <p className="text-sm text-zinc-300 whitespace-pre-line">{action.description}</p>
              <div className="text-xs text-zinc-500">
                Criado em {new Date(action.createdAt).toLocaleString("pt-BR")}
              </div>
              <button
                disabled={executingId === action.id}
                onClick={() => void handleExecute(action.id)}
                className={`mt-auto flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition ${
                  executingId === action.id
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-[#C5FF00] text-black hover:opacity-90"
                }`}
              >
                {executingId === action.id ? (
                  <>Executando...</>
                ) : (
                  <>
                    Aprovar projeto <ArrowUpRightIcon className="h-4 w-4" />
                  </>
                )}
              </button>
            </ActionCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommandCenter;
