import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "../components/Toast";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { FilterCard, FormCard, TableCard } from "../components/ui/Card";
import { useAuth } from "../App";
import { getErrorMessage } from "../src/services/error";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../src/services/endpoints";
import type { Pagination, Product } from "../src/types/domain";
import { calculateFinancialHealth } from "../src/utils/calculate-financial-health";

const asCurrency = (value: number) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

const emptyForm = () => ({
  name: "",
  sku: "",
  category: "",
  price: "",
  cost: "",
  tax: "",
  shipping: "",
});

const Products = () => {
  const { selectedCompanyId } = useAuth();
  const { addToast } = useToast();

  const [items, setItems] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const preview = useMemo(
    () =>
      calculateFinancialHealth(
        Number(form.cost || 0),
        Number(form.tax || 0),
        Number(form.shipping || 0),
        Number(form.price || 0),
      ),
    [form.cost, form.price, form.shipping, form.tax],
  );
  const previewClassName =
    preview.warningLevel === "CRITICAL"
      ? "border-red-500/50 bg-red-600/30 text-red-50"
      : preview.warningLevel === "WARNING"
        ? "border-amber-400/50 bg-amber-500/20 text-amber-50"
        : "border-lime-400/40 bg-lime-500/15 text-lime-100";

  const loadProducts = async () => {
    if (!selectedCompanyId) {
      setError("Selecione uma empresa para visualizar produtos.");
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, pagination: meta } = await getProducts({
        companyId: selectedCompanyId,
        search: search.trim() || undefined,
        category: category.trim() || undefined,
        page,
        limit,
      });
      setItems(data);
      setPagination(meta);
    } catch (err) {
      const message = getErrorMessage(err, "Não foi possível carregar os produtos.");
      setError(message);
      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, category, limit]);

  useEffect(() => {
    void loadProducts();
  }, [selectedCompanyId, page, limit, search, category]);

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
    if (!form.price.trim() || Number.isNaN(Number(form.price)) || Number(form.price) <= 0) {
      addToast("Preço invalido.", "info");
      return;
    }

    try {
      if (editingId) {
        await updateProduct(selectedCompanyId, editingId, {
          name: form.name,
          sku: form.sku || undefined,
          category: form.category || undefined,
          price: Number(form.price),
          cost: form.cost ? Number(form.cost) : undefined,
          tax: form.tax ? Number(form.tax) : undefined,
          shipping: form.shipping ? Number(form.shipping) : undefined,
        });
        addToast("Produto atualizado.", "success");
      } else {
        await createProduct(selectedCompanyId, {
          name: form.name,
          sku: form.sku || undefined,
          category: form.category || undefined,
          price: Number(form.price),
          cost: form.cost ? Number(form.cost) : undefined,
          tax: form.tax ? Number(form.tax) : undefined,
          shipping: form.shipping ? Number(form.shipping) : undefined,
        });
        addToast("Produto criado.", "success");
      }
      setForm(emptyForm());
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      addToast(getErrorMessage(err, "Falha ao salvar produto."), "error");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      sku: product.sku || "",
      category: product.category || "",
      price: String(product.price ?? ""),
      cost: product.cost !== null && product.cost !== undefined ? String(product.cost) : "",
      tax: product.tax !== null && product.tax !== undefined ? String(product.tax) : "",
      shipping:
        product.shipping !== null && product.shipping !== undefined
          ? String(product.shipping)
          : "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!selectedCompanyId) return;
    const confirmed = window.confirm("Excluir este produto?");
    if (!confirmed) return;
    try {
      await deleteProduct(selectedCompanyId, id);
      addToast("Produto removido.", "success");
      if (items.length === 1 && page > 1) {
        setPage((prev) => Math.max(1, prev - 1));
      } else {
        await loadProducts();
      }
    } catch (err) {
      addToast(getErrorMessage(err, "Falha ao remover produto."), "error");
    }
  };


  const changePage = (next: number) => {
    setPage(Math.max(1, Math.min(next, pagination.totalPages || 1)));
  };

  return (
    <div className="nl-page">
      <div className="nl-page-header">
        <div className="nl-page-header__meta">
          <p className="nl-eyebrow">Gestão de Inventário</p>
          <h1 className="nl-page-title">Produtos & Serviços</h1>
          <p className="nl-page-subtitle">
            Catalogação unificada, análise de markup e saúde financeira por unidade de negócio.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm());
            }}
            className="nl-button-secondary py-2"
          >
            Resetar Formulário
          </button>
          <button
            type="button"
            onClick={loadProducts}
            className="nl-button-primary py-2"
          >
            Sincronizar Catálogo
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-4 mb-8">
        <div className="lg:col-span-3 nl-card p-6 md:p-8">
          <h3 className="text-xs font-black uppercase tracking-[0.14em] text-[var(--nl-text-muted)] mb-8 flex items-center gap-2">
             <span className="h-1.5 w-1.5 rounded-full bg-[var(--nl-neon)] shadow-[0_0_8px_var(--nl-neon)]" />
             {editingId ? "Editor de Item" : "Novo Cadastro"}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-1.5">
               <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] px-1">Título</span>
               <input
                 value={form.name}
                 onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                 placeholder="Cerveja Artesanal 500ml"
                 className="nl-input text-xs"
               />
            </div>
            <div className="md:col-span-2 lg:col-span-2 flex flex-col gap-1.5">
               <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] px-1">Referência</span>
               <input
                 value={form.sku}
                 onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                 placeholder="SKU-992"
                 className="nl-input text-xs"
               />
            </div>
            <div className="md:col-span-3 lg:col-span-2 flex flex-col gap-1.5">
               <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] px-1">Preço Público</span>
               <input
                 value={form.price}
                 onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                 placeholder="0,00"
                 className="nl-input text-xs font-bold"
               />
            </div>
            <div className="md:col-span-3 lg:col-span-2 flex flex-col gap-1.5">
               <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] px-1">Custo Bruto</span>
               <input
                 value={form.cost}
                 onChange={(e) => setForm((prev) => ({ ...prev, cost: e.target.value }))}
                 placeholder="0,00"
                 className="nl-input text-xs"
               />
            </div>
            <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] px-1">Categoria Operacional</span>
                <input
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="Bebidas / Destilados"
                  className="nl-input text-xs"
                />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-1.5">
               <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] px-1">Outras Taxas (Impostos/Frete)</span>
               <div className="flex gap-2">
                 <input
                   value={form.tax}
                   onChange={(e) => setForm((prev) => ({ ...prev, tax: e.target.value }))}
                   placeholder="Imposto"
                   className="nl-input text-[10px] py-1.5"
                 />
                 <input
                   value={form.shipping}
                   onChange={(e) => setForm((prev) => ({ ...prev, shipping: e.target.value }))}
                   placeholder="Frete"
                   className="nl-input text-[10px] py-1.5"
                 />
               </div>
            </div>
            <div className="md:col-span-6 lg:col-span-12 flex items-end">
                <button
                  type="submit"
                  className="nl-button-primary w-full py-2.5 text-xs font-black uppercase tracking-widest"
                >
                  {editingId ? "Salvar Edição" : "Cadastrar Produto"}
                </button>
            </div>
          </form>

          <div
            className={`mt-6 rounded-2xl border p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${previewClassName} shadow-[0_0_20px_rgba(0,0,0,0.1)]`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-60">Estimativa de Markup</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-3xl font-black">{preview.netMargin.toFixed(0)}%</p>
                  <p className="text-xs font-bold opacity-60">líquido</p>
                </div>
              </div>
              <div className="h-10 w-px bg-white/10 hidden md:block" />
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-60">Resultado Unitário</p>
                <p className="text-xl font-black mt-1">{asCurrency(preview.grossProfit)}</p>
              </div>
            </div>

            <div className="text-[11px] font-bold py-2 px-3 rounded-xl bg-white/5 border border-white/5 max-w-[280px]">
              {preview.warningLevel === "WARNING" ? (
                <p className="flex items-center gap-2">⚠️ <span className="opacity-80">Atenção: Margem abaixo do ideal configurado (15%).</span></p>
              ) : preview.warningLevel === "CRITICAL" ? (
                <p className="flex items-center gap-2">⛔ <span className="opacity-90">Risco: Custo excedendo preço de venda. Unidade deficitária.</span></p>
              ) : (
                <p className="flex items-center gap-2">✅ <span className="opacity-80">Canal Saudável: Margem dentro da meta operacional.</span></p>
              )}
            </div>
          </div>
        </div>

        <div className="nl-card p-5 md:p-7 space-y-5">
          <h2 className="text-[14px] font-bold uppercase tracking-[0.12em] text-[var(--nl-text-muted)]">
            Filtros
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--nl-text-muted)] px-1">Busca Geral</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, SKU..."
                className="nl-input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--nl-text-muted)] px-1">Categoria</span>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Filtrar por cat."
                className="nl-input"
              />
            </div>
            <div className="flex items-center justify-between gap-4 pt-2">
              <span className="text-[11px] font-bold text-[var(--nl-text-muted)] uppercase tracking-wider">Itens / Pág</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value) || 10)}
                className="bg-[#181A1D] border border-[var(--nl-border)] rounded-lg px-2 py-1 text-[12px] text-[var(--nl-text-primary)] focus:outline-none focus:border-[var(--nl-neon)]"
              >
                {[5, 10, 20, 50].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--nl-neon)] border-t-transparent" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--nl-text-muted)]">Carregando catálogo...</p>
          </div>
        </div>
      ) : error ? (
        <section className="nl-card p-10 text-center border-red-900/30">
          <h3 className="text-xl font-bold text-red-200">Erro no catálogo</h3>
          <p className="text-sm text-[var(--nl-text-secondary)] mt-2">{error}</p>
          <button onClick={loadProducts} className="nl-button-secondary mt-6">Tentar novamente</button>
        </section>
      ) : items.length === 0 ? (
        <section className="nl-card p-20 text-center border-dashed">
          <p className="text-xl font-bold text-[var(--nl-text-muted)]">Nenhum produto cadastrado</p>
          <p className="text-sm text-[var(--nl-text-secondary)] mt-1">Sua lista está vazia. Comece adicionando um item acima.</p>
        </section>
      ) : (
        <section className="nl-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 md:px-7 border-b border-[var(--nl-border)] bg-[rgba(255,255,255,0.01)]">
            <div>
              <h3 className="text-[14px] font-bold text-[var(--nl-text-primary)]">
                Itens Listados ({pagination.total})
              </h3>
              <p className="text-[11px] text-[var(--nl-text-muted)] font-bold uppercase tracking-wider">
                Pág. {pagination.page} / {pagination.totalPages || 1}
              </p>
            </div>
            <div className="flex items-center gap-2">
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
                  <th>Produto</th>
                  <th>Categoria / SKU</th>
                  <th>Marketplace</th>
                  <th className="text-right">Preço</th>
                  <th className="text-right">Custo</th>
                  <th className="text-right">Margem</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((product) => {
                  const financials =
                    product.financials ??
                    calculateFinancialHealth(
                      Number(product.cost ?? 0),
                      Number(product.tax ?? 0),
                      Number(product.shipping ?? 0),
                      Number(product.price ?? 0),
                    );
                  const financialBadge =
                    financials.warningLevel === "CRITICAL"
                      ? "danger"
                      : financials.warningLevel === "WARNING"
                        ? "muted"
                        : "neon";

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="font-bold text-[var(--nl-text-primary)]">{product.name}</div>
                        <p className="text-[11px] text-[var(--nl-text-muted)] mt-0.5">
                          ID: {product.id.slice(-8).toUpperCase()}
                        </p>
                      </td>
                      <td>
                        <div className="text-[13px] text-[var(--nl-text-secondary)]">{product.category || "Sem cat."}</div>
                        <p className="text-[11px] font-mono text-[var(--nl-text-muted)] mt-0.5">{product.sku || "N/A"}</p>
                      </td>
                      <td>
                        <span className={`nl-badge-${product.marketplaceStatus === "active" ? "success" : "muted"}`}>
                          {product.marketplaceStatus || "Local"}
                        </span>
                      </td>
                      <td className="text-right font-bold text-[var(--nl-text-primary)]">{asCurrency(product.price)}</td>
                      <td className="text-right text-[var(--nl-text-secondary)]">
                        {product.cost !== null && product.cost !== undefined ? asCurrency(product.cost) : "—"}
                      </td>
                      <td className="text-right">
                        <span className={`nl-badge-${financialBadge}`}>
                          {financials.warningLevel === "CRITICAL"
                            ? "Prejuizo"
                            : `${financials.netMargin.toFixed(1)}%`}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="p-2 rounded-lg border border-[var(--nl-border)] hover:bg-[rgba(255,255,255,0.05)] transition text-[var(--nl-text-secondary)]"
                            onClick={() => handleEdit(product)}
                            title="Editar"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="p-2 rounded-lg border border-red-900/30 hover:bg-red-950/20 transition text-red-400"
                            onClick={() => handleDelete(product.id)}
                            title="Excluir"
                          >
                            ✕
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

export default Products;
