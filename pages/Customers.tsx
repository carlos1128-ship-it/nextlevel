import React, { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { TableCard, FormCard, FilterCard, MetricCard } from "../components/ui/Card";
import { UsersIcon } from "../components/icons";
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
      const message = getErrorMessage(err, "Não foi possível carregar os clientes.");
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

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: "", email: "", phone: "" });
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
      resetForm();
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

  const formatStatus = (status?: string | null) => {
    const labels: Record<string, string> = {
      PENDING_CONFIRMATION: "Aguardando confirmacao",
      NEEDS_INFO: "Aguardando informações",
      PENDING_DATA: "Aguardando informações",
      NEEDS_HUMAN: "Precisa de atendimento humano",
      CONFIRMED: "Confirmado",
      CANCELLED: "Cancelado",
      COMPLETED: "Concluido",
      LEAD: "Lead novo",
      NEW: "Lead novo",
    };
    return status ? labels[status] || status : "-";
  };

  const statusClass = (status?: string | null) => {
    if (status === "CONFIRMED" || status === "COMPLETED") return "border-lime-400/30 bg-lime-400/10 text-lime-200";
    if (status === "CANCELLED") return "border-red-400/30 bg-red-500/10 text-red-200";
    if (status === "NEEDS_HUMAN" || status === "NEEDS_INFO" || status === "PENDING_DATA") {
      return "border-amber-400/30 bg-amber-500/10 text-amber-200";
    }
    return "border-zinc-700 bg-zinc-900 text-zinc-300";
  };

  return (
    <div className="space-y-6">
      <div className="nl-enter flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-300/80">Base de clientes</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">Clientes</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Organize contatos, origem, interesse e sinais comerciais em uma tela limpa para vender melhor.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={resetForm} className="nl-button-secondary">
            Limpar formulario
          </button>
          <button type="button" onClick={loadCustomers} className="nl-button-primary">
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <FormCard className="nl-enter">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                {editingId ? "Edicao ativa" : "Novo cadastro"}
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-zinc-100">
                {editingId ? "Atualizar cliente" : "Cadastrar cliente"}
              </h2>
            </div>
            {editingId ? (
              <span className="w-max rounded-full border border-lime-400/25 bg-lime-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">
                Modo edicao
              </span>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <label htmlFor="customer-name" className="nl-label">Nome</label>
              <input
                id="customer-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do cliente"
                className="nl-input"
              />
            </div>
            <div className="lg:col-span-3">
              <label htmlFor="customer-email" className="nl-label">Email</label>
              <input
                id="customer-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="cliente@email.com"
                className="nl-input"
              />
            </div>
            <div className="lg:col-span-3">
              <label htmlFor="customer-phone" className="nl-label">Telefone</label>
              <input
                id="customer-phone"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="WhatsApp ou telefone"
                className="nl-input"
              />
            </div>
            <div className="flex items-end lg:col-span-2">
              <button type="submit" className="nl-button-primary w-full">
                {editingId ? "Salvar" : "Adicionar"}
              </button>
            </div>
          </form>
        </FormCard>

        <div className="space-y-4">
          <MetricCard interactive className="nl-enter">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Clientes no filtro</p>
                <p className="mt-3 text-4xl font-black leading-none tracking-tight text-zinc-100">{pagination.total}</p>
                <p className="mt-2 text-xs font-semibold text-zinc-500">
                  Pagina {pagination.page} de {pagination.totalPages || 1}
                </p>
              </div>
              <div className="rounded-2xl border border-lime-400/20 bg-lime-400/10 p-3 text-lime-300">
                <UsersIcon className="h-5 w-5" />
              </div>
            </div>
          </MetricCard>

          <FilterCard className="nl-enter">
            <p className="mb-4 text-sm font-black text-zinc-200">Filtros</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="customer-search" className="nl-label">Busca</label>
                <input
                  id="customer-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nome, email ou telefone"
                  className="nl-input"
                />
              </div>
              <div>
                <label htmlFor="customer-limit" className="nl-label">Itens por pagina</label>
                <select
                  id="customer-limit"
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
        <TableCard className="nl-enter">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div>
              <p className="text-sm font-black text-zinc-100">
                {pagination.total} cliente{pagination.total === 1 ? "" : "s"}
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
                  <th className="text-left">Cliente</th>
                  <th className="text-left">Email</th>
                  <th className="text-left">Telefone</th>
                  <th className="text-left">Origem</th>
                  <th className="text-left">Interesse</th>
                  <th className="text-left">Data/Hora</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Observacao</th>
                  <th className="text-left">Criado em</th>
                  <th className="text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="text-zinc-200">
                {items.map((customer) => {
                  const status = customer.status || customer.latestAction?.status;
                  return (
                    <tr key={customer.id} className="border-t border-zinc-800/80">
                      <td className="font-bold text-zinc-100">{customer.name}</td>
                      <td>{customer.email || "-"}</td>
                      <td>{customer.phone || "-"}</td>
                      <td>{formatChannel(customer)}</td>
                      <td className="max-w-[220px] truncate">{formatInterest(customer)}</td>
                      <td>{formatDesiredDateTime(customer)}</td>
                      <td>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusClass(status)}`}>
                          {formatStatus(status)}
                        </span>
                      </td>
                      <td
                        className="max-w-[420px] whitespace-normal text-xs leading-5 text-zinc-400"
                        title={formatLatestNote(customer)}
                      >
                        {formatLatestNote(customer)}
                      </td>
                      <td>{new Date(customer.createdAt).toLocaleDateString("pt-BR")}</td>
                      <td className="space-x-2 text-right">
                        <button
                          type="button"
                          className="nl-button-secondary min-h-0 px-3 py-2 text-xs"
                          onClick={() => handleEdit(customer)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="nl-button-danger min-h-0 px-3 py-2 text-xs"
                          onClick={() => handleDelete(customer.id)}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TableCard>
      )}
    </div>
  );
};

export default Customers;
