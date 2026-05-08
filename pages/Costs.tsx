import React, { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
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
      setForm({
        name: "",
        category: "",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
      });
      setEditingId(null);
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
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Custos operacionais</p>
          <h1 className="text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">Custos</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", category: "", amount: "", date: new Date().toISOString().slice(0, 10) });
            }}
            className="rounded-xl border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-lime-400"
          >
            Limpar formulario
          </button>
          <button
            type="button"
            onClick={loadCosts}
            className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-black text-zinc-900 transition hover:brightness-95"
          >
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4 lg:col-span-3">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nome do custo"
              className="col-span-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            <input
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="Categoria"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            <input
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="Valor"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-lime-400 px-3 py-2 text-sm font-black text-zinc-900 transition hover:brightness-95"
            >
              {editingId ? "Salvar alterações" : "Registrar"}
            </button>
          </form>
        </div>

        <div className="space-y-2 rounded-2xl border border-zinc-900 bg-zinc-950 p-4">
          <p className="text-sm font-semibold text-zinc-300">Filtros</p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou categoria"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Categoria exata (opcional)"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs text-zinc-500">Itens por página</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value) || 10)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 focus:outline-none"
            >
              {[5, 10, 20, 50].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total cadastrado</p>
          <p className="mt-1 text-2xl font-black text-zinc-100">{asCurrency(totalAmount)}</p>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Carregando custos..." />
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
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
            <div>
              <p className="text-sm font-semibold text-zinc-200">
                {pagination.total} custo{pagination.total === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-zinc-500">
                Página {pagination.page} de {pagination.totalPages || 1}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 disabled:opacity-40"
                onClick={() => changePage(page - 1)}
                disabled={page <= 1}
              >
                Anterior
              </button>
              <button
                className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 disabled:opacity-40"
                onClick={() => changePage(page + 1)}
                disabled={pagination.totalPages !== 0 && page >= pagination.totalPages}
              >
                Próxima
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800 text-sm">
              <thead className="text-xs uppercase tracking-tight text-zinc-500">
                <tr>
                  <th className="px-3 py-2 text-left">Nome</th>
                  <th className="px-3 py-2 text-left">Categoria</th>
                  <th className="px-3 py-2 text-left">Data</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-100">
                {items.map((cost) => (
                  <tr key={cost.id} className="hover:bg-zinc-900/60">
                    <td className="px-3 py-2 font-semibold">{cost.name}</td>
                    <td className="px-3 py-2">{cost.category || "—"}</td>
                    <td className="px-3 py-2">
                      {new Date(cost.date).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">{asCurrency(Number(cost.amount || 0))}</td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <button
                        type="button"
                        className="rounded-lg border border-zinc-800 px-2 py-1 text-xs text-zinc-200 hover:border-lime-400"
                        onClick={() => handleEdit(cost)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-red-500/60 px-2 py-1 text-xs text-red-400 hover:border-red-400"
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
        </div>
      )}
    </div>
  );
};

export default Costs;
