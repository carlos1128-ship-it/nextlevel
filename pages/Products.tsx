import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "../components/Toast";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { useAuth } from "../App";
import { getErrorMessage } from "../src/services/error";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../src/services/endpoints";
import type { Pagination, Product } from "../src/types/domain";

const asCurrency = (value: number) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

function calculatePreview(price: string, cost: string) {
  const priceValue = Number(price || 0);
  const costValue = Number(cost || 0);
  const grossProfit = Number((priceValue - costValue).toFixed(2));
  const netMargin = priceValue > 0 ? Number(((grossProfit / priceValue) * 100).toFixed(2)) : 0;
  const warningLevel =
    netMargin <= 0 ? "CRITICAL" : netMargin < 10 ? "WARNING" : "HEALTHY";

  return {
    grossProfit,
    netMargin,
    warningLevel,
  } as Product["financials"];
}

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
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    cost: "",
  });

  const preview = useMemo(() => calculatePreview(form.price, form.cost), [form.cost, form.price]);
  const previewClassName =
    preview?.warningLevel === "CRITICAL"
      ? "border-red-500/40 bg-red-500/10 text-red-200"
      : preview?.warningLevel === "WARNING"
        ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
        : "border-lime-400/30 bg-lime-400/5 text-lime-300";

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
      const message = getErrorMessage(err, "Nao foi possivel carregar os produtos.");
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
      addToast("Preco invalido.", "info");
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
        });
        addToast("Produto atualizado.", "success");
      } else {
        await createProduct(selectedCompanyId, {
          name: form.name,
          sku: form.sku || undefined,
          category: form.category || undefined,
          price: Number(form.price),
          cost: form.cost ? Number(form.cost) : undefined,
        });
        addToast("Produto criado.", "success");
      }
      setForm({ name: "", sku: "", category: "", price: "", cost: "" });
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
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Fase A · Dados completos</p>
          <h1 className="text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">Produtos</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", sku: "", category: "", price: "", cost: "" });
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
        <article className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4 lg:col-span-3">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nome do produto"
              className="col-span-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            <input
              value={form.sku}
              onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
              placeholder="SKU"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            <input
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="Categoria"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            <input
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              placeholder="Preco (BRL)"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            <input
              value={form.cost}
              onChange={(e) => setForm((prev) => ({ ...prev, cost: e.target.value }))}
              placeholder="Custo (opcional)"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-lime-400 px-3 py-2 text-sm font-black text-zinc-900 transition hover:brightness-95"
            >
              {editingId ? "Salvar alteracoes" : "Adicionar"}
            </button>
          </form>

          <div className={`mt-4 rounded-2xl border p-4 ${previewClassName}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em]">Margem em tempo real</p>
                <p className="mt-2 text-2xl font-black">
                  {preview?.netMargin?.toFixed(2) || "0.00"}%
                </p>
              </div>
              <div className="text-sm">
                <p>Lucro bruto: {asCurrency(preview?.grossProfit || 0)}</p>
                {preview?.warningLevel === "WARNING" ? <p className="mt-1">⚠️ Margem abaixo de 10%.</p> : null}
                {preview?.warningLevel === "CRITICAL" ? <p className="mt-1 font-bold">Prejuizo</p> : null}
              </div>
            </div>
          </div>
        </article>

        <aside className="space-y-2 rounded-2xl border border-zinc-900 bg-zinc-950 p-4">
          <p className="text-sm font-semibold text-zinc-300">Filtros</p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, SKU ou categoria"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Categoria exata (opcional)"
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
        </aside>
      </section>

      {loading ? (
        <LoadingState label="Carregando produtos..." />
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
        <section className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
            <div>
              <p className="text-sm font-semibold text-zinc-200">
                {pagination.total} produto{pagination.total === 1 ? "" : "s"}
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
                  <th className="px-3 py-2 text-left">Produto</th>
                  <th className="px-3 py-2 text-left">Categoria</th>
                  <th className="px-3 py-2 text-left">SKU</th>
                  <th className="px-3 py-2 text-right">Preco</th>
                  <th className="px-3 py-2 text-right">Custo</th>
                  <th className="px-3 py-2 text-right">Margem</th>
                  <th className="px-3 py-2 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-100">
                {items.map((product) => {
                  const financials = product.financials || calculatePreview(String(product.price || 0), String(product.cost || 0));
                  const financialClassName =
                    financials.warningLevel === "CRITICAL"
                      ? "bg-red-500/10 text-red-200"
                      : financials.warningLevel === "WARNING"
                        ? "border border-amber-400/30 bg-amber-400/5 text-amber-200"
                        : "text-lime-300";

                  return (
                    <tr key={product.id} className="hover:bg-zinc-900/60">
                      <td className="px-3 py-2">
                        <div className="font-semibold">{product.name}</div>
                        <p className="text-xs text-zinc-500">
                          Criado em {new Date(product.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </td>
                      <td className="px-3 py-2">{product.category || "—"}</td>
                      <td className="px-3 py-2">{product.sku || "—"}</td>
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
                          className="rounded-lg border border-zinc-800 px-2 py-1 text-xs text-zinc-200 hover:border-lime-400"
                          onClick={() => handleEdit(product)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-red-500/60 px-2 py-1 text-xs text-red-400 hover:border-red-400"
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
        </section>
      )}
    </main>
  );
};

export default Products;
