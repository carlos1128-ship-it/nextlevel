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
    <div className="space-y-6">
      <div className="nl-enter flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-300/80">Custos operacionais</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">Custos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Controle despesas por categoria e periodo para enxergar lucro real, nao apenas faturamento.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={resetForm} className="nl-button-secondary">
            Limpar formulario
          </button>
          <button type="button" onClick={loadCosts} className="nl-button-primary">
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <FormCard className="nl-enter">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                {editingId ? "Edicao ativa" : "Novo custo"}
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-zinc-100">
                {editingId ? "Atualizar custo" : "Registrar custo"}
              </h2>
            </div>
            {editingId ? (
              <span className="w-max rounded-full border border-lime-400/25 bg-lime-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">
                Modo edicao
              </span>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <label htmlFor="cost-name" className="nl-label">Nome</label>
              <input
                id="cost-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Aluguel, embalagem"
                className="nl-input"
              />
            </div>
            <div className="lg:col-span-3">
              <label htmlFor="cost-category" className="nl-label">Categoria</label>
              <input
                id="cost-category"
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="Fixo, marketing, entrega"
                className="nl-input"
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="cost-amount" className="nl-label">Valor</label>
              <input
                id="cost-amount"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="0,00"
                className="nl-input font-bold"
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="cost-date" className="nl-label">Data</label>
              <input
                id="cost-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                className="nl-input"
              />
            </div>
            <div className="flex items-end lg:col-span-2">
              <button type="submit" className="nl-button-primary w-full">
                {editingId ? "Salvar" : "Registrar"}
              </button>
            </div>
          </form>
        </FormCard>

        <div className="space-y-4">
          <MetricCard interactive className="nl-enter">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Total no filtro</p>
                <p className="mt-3 text-3xl font-black leading-none tracking-tight text-zinc-100">
                  {asCurrency(totalAmount)}
                </p>
                <p className="mt-2 text-xs font-semibold text-zinc-500">
                  {pagination.total} custo{pagination.total === 1 ? "" : "s"} encontrados
                </p>
              </div>
              <div className="rounded-2xl border border-lime-400/20 bg-lime-400/10 p-3 text-lime-300">
                <DollarSignIcon className="h-5 w-5" />
              </div>
            </div>
          </MetricCard>

          <FilterCard className="nl-enter">
            <p className="mb-4 text-sm font-black text-zinc-200">Filtros</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="cost-search" className="nl-label">Busca</label>
                <input
                  id="cost-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nome ou categoria"
                  className="nl-input"
                />
              </div>
              <div>
                <label htmlFor="cost-category-filter" className="nl-label">Categoria exata</label>
                <input
                  id="cost-category-filter"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Opcional"
                  className="nl-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cost-start" className="nl-label">Inicio</label>
                  <input
                    id="cost-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="nl-input"
                  />
                </div>
                <div>
                  <label htmlFor="cost-end" className="nl-label">Fim</label>
                  <input
                    id="cost-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="nl-input"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="cost-limit" className="nl-label">Itens por pagina</label>
                <select
                  id="cost-limit"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value) || 10)}
                  className="nl-input"
                >
                  {[5, 10, 20, 50].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </FilterCard>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          title="Erro ao carregar custos"
          description={error}
          actionLabel="Tentar novamente"
          onAction={loadCosts}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nenhum custo registrado"
          description="Cadastre custos operacionais para calcular lucro real e margem."
        />
      ) : (
        <TableCard className="nl-enter">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div>
              <p className="text-sm font-black text-zinc-100">
                {pagination.total} custo{pagination.total === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Pagina {pagination.page} de {pagination.totalPages || 1}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="nl-button-secondary min-h-0 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => changePage(page - 1)}
                disabled={page <= 1}
              >
                Anterior
              </button>
              <button
                className="nl-button-secondary min-h-0 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => changePage(page + 1)}
                disabled={pagination.totalPages !== 0 && page >= pagination.totalPages}
              >
                Proxima
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="nl-table">
              <thead>
                <tr>
                  <th className="text-left">Nome</th>
                  <th className="text-left">Categoria</th>
                  <th className="text-left">Data</th>
                  <th className="text-right">Valor</th>
                  <th className="text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="text-zinc-200">
                {items.map((cost) => (
                  <tr key={cost.id} className="border-t border-zinc-800/80">
                    <td className="font-bold text-zinc-100">
                      <span className="inline-flex items-center gap-2">
                        <ReceiptIcon className="h-4 w-4 text-lime-300" />
                        {cost.name}
                      </span>
                    </td>
                    <td>{cost.category || "-"}</td>
                    <td>{new Date(cost.date).toLocaleDateString("pt-BR")}</td>
                    <td className="text-right font-black text-zinc-100">{asCurrency(Number(cost.amount || 0))}</td>
                    <td className="space-x-2 text-right">
                      <button
                        type="button"
                        className="nl-button-secondary min-h-0 px-3 py-2 text-xs"
                        onClick={() => handleEdit(cost)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="nl-button-danger min-h-0 px-3 py-2 text-xs"
                        onClick={() => handleDelete(cost.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableCard>
      )}
    </div>
  );
};

export default Costs;
