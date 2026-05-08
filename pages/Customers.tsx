import React, { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { useAuth } from "../App";
import { getErrorMessage } from "../src/services/error";
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "../src/services/endpoints";
import type { Customer, Pagination } from "../src/types/domain";

const Customers = () => {
  const { selectedCompanyId } = useAuth();
  const { addToast } = useToast();

  const [items, setItems] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const loadCustomers = async () => {
    if (!selectedCompanyId) {
      setError("Selecione uma empresa para visualizar clientes.");
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, pagination: meta } = await getCustomers({
        companyId: selectedCompanyId,
        search: search.trim() || undefined,
        page,
        limit,
      });
      setItems(data);
      setPagination(meta);
    } catch (err) {
      const message = getErrorMessage(err, "Nao foi possivel carregar os clientes.");
      setError(message);
      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, limit]);

  useEffect(() => {
    void loadCustomers();
  }, [selectedCompanyId, page, limit, search]);

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

    try {
      if (editingId) {
        await updateCustomer(selectedCompanyId, editingId, {
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
        });
        addToast("Cliente atualizado.", "success");
      } else {
        await createCustomer(selectedCompanyId, {
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
        });
        addToast("Cliente criado.", "success");
      }
      setForm({ name: "", email: "", phone: "" });
      setEditingId(null);
      await loadCustomers();
    } catch (err) {
      addToast(getErrorMessage(err, "Falha ao salvar cliente."), "error");
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!selectedCompanyId) return;
    const confirmed = window.confirm("Excluir este cliente?");
    if (!confirmed) return;
    try {
      await deleteCustomer(selectedCompanyId, id);
      addToast("Cliente removido.", "success");
      if (items.length === 1 && page > 1) {
        setPage((prev) => Math.max(1, prev - 1));
      } else {
        await loadCustomers();
      }
    } catch (err) {
      addToast(getErrorMessage(err, "Falha ao remover cliente."), "error");
    }
  };

  const changePage = (next: number) => {
    setPage(Math.max(1, Math.min(next, pagination.totalPages || 1)));
  };

  const formatChannel = (customer: Customer) => {
    const channel = customer.channel || customer.latestAction?.channel;
    if (channel === "instagram") return "Instagram";
    if (channel === "whatsapp") return "WhatsApp";
    return channel || "Manual";
  };

  const formatInterest = (customer: Customer) =>
    customer.interest ||
    customer.objective ||
    customer.latestAction?.requestedService ||
    customer.latestAction?.objective ||
    "Sem interesse registrado";

  const formatDesiredDateTime = (customer: Customer) => {
    const date = customer.desiredDate || customer.latestAction?.desiredDate;
    const time = customer.desiredTime || customer.latestAction?.desiredTime;
    if (!date && !time) return "-";
    const formattedDate = date ? new Date(date).toLocaleDateString("pt-BR") : "";
    return [formattedDate, time].filter(Boolean).join(" ");
  };

  const formatLatestNote = (customer: Customer) =>
    customer.latestAction?.notes || customer.objective || "-";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Fase A · Base de clientes</p>
          <h1 className="text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">Clientes</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", email: "", phone: "" });
            }}
            className="rounded-xl border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-lime-400"
          >
            Limpar formulario
          </button>
          <button
            type="button"
            onClick={loadCustomers}
            className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-black text-zinc-900 transition hover:brightness-95"
          >
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4 lg:col-span-3">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nome do cliente"
              className="col-span-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            <input
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Email"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Telefone"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-lime-400 px-3 py-2 text-sm font-black text-zinc-900 transition hover:brightness-95"
            >
              {editingId ? "Salvar alteracoes" : "Adicionar"}
            </button>
          </form>
        </div>

        <div className="space-y-2 rounded-2xl border border-zinc-900 bg-zinc-950 p-4">
          <p className="text-sm font-semibold text-zinc-300">Filtro</p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, email ou telefone"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs text-zinc-500">Itens por pagina</label>
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

      {loading ? (
        <LoadingState label="Carregando clientes..." />
      ) : error ? (
        <ErrorState
          title="Erro ao carregar clientes"
          description={error}
          actionLabel="Tentar novamente"
          onAction={loadCustomers}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nenhum cliente cadastrado"
          description="Cadastre clientes para calcular LTV, ticket medio e segmentar vendas."
        />
      ) : (
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
            <div>
              <p className="text-sm font-semibold text-zinc-200">
                {pagination.total} cliente{pagination.total === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-zinc-500">
                Pagina {pagination.page} de {pagination.totalPages || 1}
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
                Proxima
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800 text-sm">
              <thead className="text-xs uppercase tracking-tight text-zinc-500">
                <tr>
                  <th className="px-3 py-2 text-left">Cliente</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Telefone</th>
                  <th className="px-3 py-2 text-left">Origem</th>
                  <th className="px-3 py-2 text-left">Interesse</th>
                  <th className="px-3 py-2 text-left">Data/Hora</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Observacao</th>
                  <th className="px-3 py-2 text-left">Criado em</th>
                  <th className="px-3 py-2 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-100">
                {items.map((customer) => (
                  <tr key={customer.id} className="hover:bg-zinc-900/60">
                    <td className="px-3 py-2 font-semibold">{customer.name}</td>
                    <td className="px-3 py-2">{customer.email || "-"}</td>
                    <td className="px-3 py-2">{customer.phone || "-"}</td>
                    <td className="px-3 py-2">{formatChannel(customer)}</td>
                    <td className="px-3 py-2 max-w-[220px] truncate">{formatInterest(customer)}</td>
                    <td className="px-3 py-2">{formatDesiredDateTime(customer)}</td>
                    <td className="px-3 py-2">{customer.status || customer.latestAction?.status || "-"}</td>
                    <td className="px-3 py-2 max-w-[260px] truncate">{formatLatestNote(customer)}</td>
                    <td className="px-3 py-2">
                      {new Date(customer.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <button
                        type="button"
                        className="rounded-lg border border-zinc-800 px-2 py-1 text-xs text-zinc-200 hover:border-lime-400"
                        onClick={() => handleEdit(customer)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-red-500/60 px-2 py-1 text-xs text-red-400 hover:border-red-400"
                        onClick={() => handleDelete(customer.id)}
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

export default Customers;
