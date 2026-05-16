import React, { useEffect, useState } from "react";
import { useToast } from "../components/Toast";
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
    if (status === "CONFIRMED" || status === "COMPLETED") return "success";
    if (status === "CANCELLED") return "danger";
    if (status === "NEEDS_HUMAN" || status === "NEEDS_INFO" || status === "PENDING_DATA") {
      return "warning";
    }
    return "muted";
  };

  return (
    <div className="nl-page">
      <div className="nl-page-header">
        <div className="nl-page-header__meta">
          <p className="nl-eyebrow">Relacionamento & Vendas</p>
          <h1 className="nl-page-title">Base de Clientes</h1>
          <p className="nl-page-subtitle">Organize contatos, origem, interesse e sinais comerciais em uma tela limpa para vender melhor.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={resetForm} className="nl-button-secondary py-2 text-xs">
            Limpar Form
          </button>
          <button type="button" onClick={loadCustomers} className="nl-button-primary py-2 text-xs">
            Sincronizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px] mb-8">
        <section className="nl-card p-6 md:p-8">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--nl-text-muted)]">
                {editingId ? "Edição Direta" : "Nova Prospecção"}
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-[var(--nl-text-primary)]">
                {editingId ? "Atualizar Ficha" : "Adicionar Cliente"}
              </h2>
            </div>
            {editingId && (
              <span className="nl-badge-neon text-[10px]">Alteração Ativa</span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-4 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--nl-text-muted)] px-1">Nome de Contato</span>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: João Silva"
                className="nl-input"
              />
            </div>
            <div className="lg:col-span-4 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--nl-text-muted)] px-1">E-mail Principal</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="cliente@servidor.com"
                className="nl-input"
              />
            </div>
            <div className="lg:col-span-2 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--nl-text-muted)] px-1">WhatsApp / Tel</span>
              <input
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+55 11..."
                className="nl-input"
              />
            </div>
            <div className="flex flex-col justify-end lg:col-span-2">
              <button type="submit" className="nl-button-primary w-full py-3">
                {editingId ? "Salvar" : "Fixar"}
              </button>
            </div>
          </form>
        </section>

        <div className="space-y-6">
          <div className="nl-card p-6 relative overflow-hidden flex flex-col justify-between h-[160px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--nl-neon)] opacity-[0.03] blur-3xl pointer-events-none" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--nl-text-muted)]">Alcance Total</p>
              <p className="mt-3 text-4xl font-black text-[var(--nl-text-primary)] leading-none">{pagination.total}</p>
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-[var(--nl-text-muted)] font-bold">
              <span>CONTATOS NA BASE</span>
              <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center text-[var(--nl-neon)]">
                <UsersIcon className="h-4 w-4" />
              </div>
            </div>
          </div>

          <section className="nl-card p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--nl-text-muted)] mb-4">Filtragem Dinâmica</p>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase text-[var(--nl-text-muted)] px-1">Pesquisar</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nome ou contato..."
                  className="nl-input text-xs py-2"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase text-[var(--nl-text-muted)] px-1">Exibição</span>
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
          <h3 className="text-xl font-bold text-red-200">Falha ao rastrear clientes</h3>
          <p className="text-sm text-[var(--nl-text-secondary)] mt-2">{error}</p>
          <button onClick={loadCustomers} className="nl-button-secondary mt-6">Tentar novamente</button>
        </section>
      ) : items.length === 0 ? (
        <section className="nl-card p-20 text-center border-dashed">
          <p className="text-xl font-bold text-[var(--nl-text-muted)]">Ambiente Vazio</p>
          <p className="text-sm text-[var(--nl-text-secondary)] mt-1">Nenhum registro encontrado com os critérios atuais.</p>
        </section>
      ) : (
        <section className="nl-card overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between border-b border-white/5">
            <div>
              <p className="text-[13px] font-bold text-[var(--nl-text-primary)]">{pagination.total} Clientes Registrados</p>
              <p className="text-[11px] text-[var(--nl-text-muted)] mt-0.5">Página {pagination.page} de {pagination.totalPages || 1}</p>
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
                  <th>Cliente / Contato</th>
                  <th>Origem / Interesse</th>
                  <th>Data/Hora Desejada</th>
                  <th>Status Comercial</th>
                  <th>Sinais & Notas</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((customer) => {
                  const status = customer.status || customer.latestAction?.status;
                  const sClass = statusClass(status);
                  return (
                    <tr key={customer.id}>
                      <td>
                        <div className="font-bold text-[var(--nl-text-primary)]">{customer.name}</div>
                        <div className="text-[11px] text-[var(--nl-text-muted)] mt-0.5">{customer.email || customer.phone || "Sem contato"}</div>
                      </td>
                      <td>
                        <div className="text-[13px] text-[var(--nl-text-secondary)] font-medium">{formatChannel(customer)}</div>
                        <div className="text-[11px] text-[var(--nl-text-muted)] mt-0.5 max-w-[180px] truncate" title={formatInterest(customer)}>
                          {formatInterest(customer)}
                        </div>
                      </td>
                      <td className="text-[12px] text-[var(--nl-text-secondary)]">
                        {formatDesiredDateTime(customer)}
                      </td>
                      <td>
                        <span className={`nl-badge-${sClass}`}>
                          {formatStatus(status)}
                        </span>
                      </td>
                      <td className="max-w-[300px]">
                        <p className="text-[12px] text-[var(--nl-text-secondary)] leading-relaxed line-clamp-2" title={formatLatestNote(customer)}>
                          {formatLatestNote(customer)}
                        </p>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="nl-button-secondary py-1.5 px-3 text-xs"
                            onClick={() => handleEdit(customer)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="nl-button-danger py-1.5 px-3 text-xs"
                            onClick={() => handleDelete(customer.id)}
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default Customers;
