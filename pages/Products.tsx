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
    <main className="space-y-6">
      <section className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Catálogo operacional</p>
          <h1 className="text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">Produtos e Serviços</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm());
            }}
            className="rounded-xl border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-lime-400"
          >
            Limpar formulario
          </button>
          <button
            type="button"
            onClick={loadProducts}
            className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-black text-zinc-900 transition hover:brightness-95"
          >
            Atualizar
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <FormCard className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nome do produto"
              className="nl-input md:col-span-3"
            />
            <input
              value={form.sku}
              onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
              placeholder="SKU"
              className="nl-input md:col-span-2"
            />
            <input
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="Categoria"
              className="nl-input md:col-span-2"
            />
            <input
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              placeholder="Preço venda (BRL)"
              className="nl-input md:col-span-1"
            />
            <input
              value={form.cost}
              onChange={(e) => setForm((prev) => ({ ...prev, cost: e.target.value }))}
              placeholder="Custo"
              className="nl-input md:col-span-1"
            />
            <input
              value={form.tax}
              onChange={(e) => setForm((prev) => ({ ...prev, tax: e.target.value }))}
              placeholder="Impostos"
              className="nl-input md:col-span-1"
            />
            <input
              value={form.shipping}
              onChange={(e) => setForm((prev) => ({ ...prev, shipping: e.target.value }))}
              placeholder="Frete"
              className="nl-input md:col-span-1"
            />
            <button
              type="submit"
              className="nl-button-primary md:col-span-1"
            >
              {editingId ? "Salvar" : "Add"}
            </button>
          </form>

          <div
            className={`mt-4 rounded-2xl border p-4 transition-colors ${previewClassName}`}
            role="status"
            aria-live="polite"
            aria-label={`Margem ${preview.netMargin.toFixed(1)} por cento, lucro ${asCurrency(preview.grossProfit)}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em]">Margem em tempo real</p>
                <p className="mt-2 text-2xl font-black">{preview.netMargin.toFixed(2)}%</p>
              </div>
              <div className="text-sm">
                <p>Lucro líquido (estim.): {asCurrency(preview.grossProfit)}</p>
                {preview.warningLevel === "WARNING" ? (
                  <p className="mt-1">⚠️ Margem abaixo de 10%.</p>
                ) : null}
                {preview.warningLevel === "CRITICAL" ? (
                  <p className="mt-1 font-bold">Prejuizo ou margem zero</p>
                ) : null}
              </div>
            </div>
          </div>
        </FormCard>

        <FilterCard className="space-y-3">
          <p className="text-sm font-semibold text-zinc-300">Filtros</p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, SKU ou categoria"
            className="nl-input"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Categoria exata (opcional)"
            className="nl-input"
          />
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs text-zinc-500">Itens por página</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value) || 10)}
              className="nl-input min-h-0 py-2 text-xs"
            >
              {[5, 10, 20, 50].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </FilterCard>
      </section>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          title="Erro ao carregar produtos"
          description={error}
          actionLabel="Tentar novamente"
          onAction={loadProducts}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nenhum produto encontrado"
          description="Cadastre produtos para destravar margens, precificacao e LTV."
        />
      ) : (
        <TableCard>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
            <div>
              <p className="text-sm font-semibold text-zinc-200">
                {pagination.total} produto{pagination.total === 1 ? "" : "s"}
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
            <table className="nl-table">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">Produto</th>
                  <th className="px-3 py-2 text-left">Categoria</th>
                  <th className="px-3 py-2 text-left">SKU</th>
                  <th className="px-3 py-2 text-left">Status ML</th>
                  <th className="px-3 py-2 text-right">Estoque</th>
                  <th className="px-3 py-2 text-right">Preço</th>
                  <th className="px-3 py-2 text-right">Custo</th>
                  <th className="px-3 py-2 text-right">Margem</th>
                  <th className="px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="text-zinc-100">
                {items.map((product) => {
                  const financials =
                    product.financials ??
                    calculateFinancialHealth(
                      Number(product.cost ?? 0),
                      Number(product.tax ?? 0),
                      Number(product.shipping ?? 0),
                      Number(product.price ?? 0),
                    );
                  const financialClassName =
                    financials.warningLevel === "CRITICAL"
                      ? "border border-red-500/50 bg-red-500/25 text-red-100"
                      : financials.warningLevel === "WARNING"
                        ? "border border-amber-400/40 bg-amber-400/15 text-amber-100"
                        : "border border-lime-400/25 bg-lime-400/10 text-lime-200";

                  return (
                    <tr key={product.id} className="border-t border-zinc-800/80">
                      <td className="px-3 py-2">
                        <div className="font-semibold">{product.name}</div>
                        <p className="text-xs text-zinc-500">
                          Criado em {new Date(product.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </td>
                      <td className="px-3 py-2">{product.category || "—"}</td>
                      <td className="px-3 py-2">{product.sku || "—"}</td>
                      <td className="px-3 py-2">{product.marketplaceStatus || "—"}</td>
                      <td className="px-3 py-2 text-right">{product.availableQuantity ?? "—"}</td>
                      <td className="px-3 py-2 text-right font-semibold">{asCurrency(product.price)}</td>
                      <td className="px-3 py-2 text-right text-zinc-200">
                        {product.cost !== null && product.cost !== undefined ? asCurrency(product.cost) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className={`inline-flex rounded-xl px-3 py-1 text-sm font-semibold ${financialClassName}`}>
                          {financials.warningLevel === "CRITICAL"
                            ? "Prejuizo"
                            : `${financials.netMargin.toFixed(1)}%`}
                        </div>
                      </td>
                      <td className="space-x-2 px-3 py-2 text-right">
                        <button
                          type="button"
                          className="nl-button-secondary min-h-0 px-3 py-2 text-xs"
                          onClick={() => handleEdit(product)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="nl-button-danger min-h-0 px-3 py-2 text-xs"
                          onClick={() => handleDelete(product.id)}
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
    </main>
  );
};

export default Products;
