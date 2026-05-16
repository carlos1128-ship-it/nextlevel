import React, { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { FilterCard, FormCard, MetricCard, TableCard } from "../components/ui/Card";
import { DollarSignIcon, ReceiptIcon } from "../components/icons";
import { useAuth } from "../App";
import { getErrorMessage } from "../src/services/error";
import {
  createCost,
  deleteCost,
  getCosts,
  updateCost,
} from "../src/services/endpoints";
import type { OperationalCost, Pagination } from "../src/types/domain";

const asCurrency = (value: number) =>
  (Number(value || 0)).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

const Costs = () => {
  const { selectedCompanyId } = useAuth();
  const { addToast } = useToast();

  const [items, setItems] = useState<OperationalCost[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const loadCosts = async () => {
    if (!selectedCompanyId) {
      setError("Selecione uma empresa para visualizar custos.");
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, pagination: meta } = await getCosts({
        companyId: selectedCompanyId,
        search: search.trim() || undefined,
        category: category.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit,
      });
      setItems(data);
      setPagination(meta);
    } catch (err) {
      const message = getErrorMessage(err, "Não foi possível carregar custos.");
      setError(message);
      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, category, startDate, endDate, limit]);

  useEffect(() => {
    void loadCosts();
  }, [selectedCompanyId, page, limit, search, category, startDate, endDate]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: "", category: "", amount: "", date: new Date().toISOString().slice(0, 10) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      addToast("Selecione uma empresa.", "info");
      return;
    }
    if (!form.name.trim()) {
      addToast("Nome e obrigatorio.", "info");
      return;
    }
    if (!form.amount.trim() || Number.isNaN(Number(form.amount))) {
      addToast("Valor invalido.", "info");
      return;
    }
    if (!form.date) {
      addToast("Data obrigatoria.", "info");
      return;
    }

    try {
      if (editingId) {
        await updateCost(selectedCompanyId, editingId, {
          name: form.name,
          category: form.category || undefined,
          amount: Number(form.amount),
          date: form.date,
        });
        addToast("Custo atualizado.", "success");
      } else {
        await createCost(selectedCompanyId, {
          name: form.name,
          category: form.category || undefined,
          amount: Number(form.amount),
          date: form.date,
        });
        addToast("Custo registrado.", "success");
      }
      resetForm();
      await loadCosts();
    } catch (err) {
      addToast(getErrorMessage(err, "Falha ao salvar custo."), "error");
    }
  };

  const handleEdit = (cost: OperationalCost) => {
    setEditingId(cost.id);
    setForm({
      name: cost.name || "",
      category: cost.category || "",
      amount: String(cost.amount ?? ""),
      date: cost.date ? cost.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
  };

  const handleDelete = async (id: string) => {
    if (!selectedCompanyId) return;
    const confirmed = window.confirm("Excluir este custo?");
    if (!confirmed) return;
    try {
      await deleteCost(selectedCompanyId, id);
      addToast("Custo removido.", "success");
      if (items.length === 1 && page > 1) {
        setPage((prev) => Math.max(1, prev - 1));
      } else {
        await loadCosts();
      }
    } catch (err) {
      addToast(getErrorMessage(err, "Falha ao remover custo."), "error");
    }
  };

  const changePage = (next: number) => {
    setPage(Math.max(1, Math.min(next, pagination.totalPages || 1)));
  };

  const totalAmount = items.reduce((acc, item) => acc + Number(item.amount || 0), 0);

  return (
    <div className="nl-page">
      <div className="nl-page-header">
        <div className="nl-page-header__meta">
          <p className="nl-eyebrow">Gestão Operacional</p>
          <h1 className="nl-page-title">Custos & Despesas</h1>
          <p className="nl-page-subtitle">Controle despesas por categoria e período para enxergar lucro real, não apenas faturamento.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={resetForm} className="nl-button-secondary py-2 text-xs">
            Limpar Form
          </button>
          <button type="button" onClick={loadCosts} className="nl-button-primary py-2 text-xs">
            Sincronizar
          </button>
        </div>
      </div>      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px] mb-8">
        <section className="nl-card p-6 md:p-8">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--nl-text-muted)]">
                {editingId ? "Edição Direta" : "Fluxo de Caixa"}
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[var(--nl-text-primary)]">
                {editingId ? "Atualizar Movimentação" : "Lançar Despesa"}
              </h2>
            </div>
            {editingId && (
              <span className="nl-badge-neon text-[10px]">Alteração Ativa</span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-4 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--nl-text-muted)] px-1">Descrição do Gasto</span>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Aluguel Fevereiro"
                className="nl-input"
              />
            </div>
            <div className="lg:col-span-3 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--nl-text-muted)] px-1">Classificação</span>
              <input
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="Marketing, Fixo..."
                className="nl-input"
              />
            </div>
            <div className="lg:col-span-2 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--nl-text-muted)] px-1">Valor (R$)</span>
              <input
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="0,00"
                className="nl-input font-bold"
              />
            </div>
            <div className="lg:col-span-3 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--nl-text-muted)] px-1">Data Competência</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                className="nl-input"
              />
            </div>
            <div className="flex flex-col justify-end lg:col-span-12">
              <button type="submit" className="nl-button-primary w-full py-3">
                {editingId ? "Salvar Alterações" : "Registrar na Planilha"}
              </button>
            </div>
          </form>
        </section>

        <div className="space-y-6">
          <div className="nl-card p-6 relative overflow-hidden flex flex-col justify-between h-[160px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500 opacity-[0.03] blur-3xl pointer-events-none" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--nl-text-muted)]">Saída Acumulada</p>
              <p className="mt-3 text-3xl font-black text-red-400 leading-none">{asCurrency(totalAmount)}</p>
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-[var(--nl-text-muted)] font-bold">
              <span>{pagination.total} LANÇAMENTOS</span>
              <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center text-red-400">
                <ReceiptIcon className="h-4 w-4" />
              </div>
            </div>
          </div>

          <section className="nl-card p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--nl-text-muted)] mb-4">Filtragem Estratégica</p>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase text-[var(--nl-text-muted)] px-1">Termo</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar..."
                  className="nl-input text-xs py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-[var(--nl-text-muted)] px-1">Início</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="nl-input text-[10px] py-1.5"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-[var(--nl-text-muted)] px-1">Fim</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="nl-input text-[10px] py-1.5"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase text-[var(--nl-text-muted)] px-1">Visualização</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value) || 10)}
                  className="nl-input text-xs py-2"
                >
                  {[5, 10, 20, 50].map((option) => (
                    <option key={option} value={option}>{option} por página</option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>
      {loading ? (
        <div className="py-20 flex justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--nl-neon)] border-t-transparent" />
        </div>
      ) : error ? (
        <section className="nl-card p-10 text-center border-red-900/30">
          <h3 className="text-xl font-bold text-red-200">Erro na Recuperação de Dados</h3>
          <p className="text-sm text-[var(--nl-text-secondary)] mt-2">{error}</p>
          <button onClick={loadCosts} className="nl-button-secondary mt-6">Recarregar</button>
        </section>
      ) : items.length === 0 ? (
        <section className="nl-card p-20 text-center border-dashed">
          <p className="text-xl font-bold text-[var(--nl-text-muted)]">Nenhuma Despesa</p>
          <p className="text-sm text-[var(--nl-text-secondary)] mt-1">Refine seus filtros ou adicione um novo lançamento.</p>
        </section>
      ) : (
        <section className="nl-card overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between border-b border-white/5">
            <div>
              <p className="text-[13px] font-bold text-[var(--nl-text-primary)]">{pagination.total} Lançamentos</p>
              <p className="text-[11px] text-[var(--nl-text-muted)] mt-0.5">Visão consolidada do período</p>
            </div>
            <div className="flex gap-2">
              <button
                className="nl-button-secondary py-1.5 px-3 text-xs"
                onClick={() => changePage(page - 1)}
                disabled={page <= 1}
              >
                Anterior
              </button>
              <button
                className="nl-button-secondary py-1.5 px-3 text-xs"
                onClick={() => changePage(page + 1)}
                disabled={pagination.totalPages !== 0 && page >= pagination.totalPages}
              >
                Próxima
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="nl-table">
              <thead>
                <tr>
                  <th>Descrição / Item</th>
                  <th>Classificação</th>
                  <th>Data Competência</th>
                  <th className="text-right">Valor Total</th>
                  <th className="text-right">Gerenciamento</th>
                </tr>
              </thead>
              <tbody>
                {items.map((cost) => (
                  <tr key={cost.id}>
                    <td>
                      <div className="font-bold text-[var(--nl-text-primary)] flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-red-400/10 flex items-center justify-center text-red-400">
                           <ReceiptIcon className="h-4 w-4" />
                        </div>
                        {cost.name}
                      </div>
                    </td>
                    <td>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                        {cost.category || "Sem Categ."}
                      </span>
                    </td>
                    <td className="text-[13px] text-[var(--nl-text-secondary)] font-medium">
                      {new Date(cost.date).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="text-right font-black text-red-400 text-[14px]">
                      {asCurrency(Number(cost.amount || 0))}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="nl-button-secondary py-1.5 px-3 text-xs"
                          onClick={() => handleEdit(cost)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="nl-button-danger py-1.5 px-3 text-xs"
                          onClick={() => handleDelete(cost.id)}
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default Costs;
