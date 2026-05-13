import React, { useEffect, useState } from "react";
import { useAuth } from "../App";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { useToast } from "../components/Toast";
import { getErrorMessage } from "../src/services/error";
import {
  getMercadoLivreOrders,
  getSalesOrders,
  type SaleOrderItem,
  type MercadoLivreOrder,
} from "../src/services/endpoints";

const asCurrency = (value: number, currency = "BRL") =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });

const Orders = () => {
  const { selectedCompanyId } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<Array<
    | { type: "ml"; item: MercadoLivreOrder }
    | { type: "sale"; item: SaleOrderItem }
  >>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!selectedCompanyId) {
      setOrders([]);
      setError("Selecione uma empresa.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [mlOrders, saleOrders] = await Promise.all([
        getMercadoLivreOrders(selectedCompanyId).catch(() => []),
        getSalesOrders({ companyId: selectedCompanyId }).catch(() => []),
      ]);
      const mlExternalIds = new Set(mlOrders.map((order) => order.mlOrderId));
      const normalized = [
        ...mlOrders.map((item) => ({ type: "ml" as const, item })),
        ...saleOrders
          .filter((item) => !item.externalId || !mlExternalIds.has(item.externalId))
          .map((item) => ({ type: "sale" as const, item })),
      ].sort((a, b) => {
        const aDate = a.type === "ml" ? a.item.dateCreated : a.item.occurredAt;
        const bDate = b.type === "ml" ? b.item.dateCreated : b.item.occurredAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
      setOrders(normalized);
    } catch (err) {
      const message = getErrorMessage(err, "Nao foi possivel carregar pedidos.");
      setError(message);
      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, [selectedCompanyId]);

  return (
    <main className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-300">Pedidos de todos os canais</p>
          <h1 className="text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">Pedidos</h1>
        </div>
        <button
          type="button"
          onClick={loadOrders}
          disabled={loading || !selectedCompanyId}
          className="rounded-xl bg-lime-400 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-950 disabled:opacity-50"
        >
          {loading ? "Atualizando..." : "Atualizar lista"}
        </button>
      </section>

      {loading ? (
        <LoadingState label="Carregando pedidos..." />
      ) : error ? (
        <ErrorState title="Erro nos pedidos" description={error} actionLabel="Tentar novamente" onAction={loadOrders} />
      ) : orders.length === 0 ? (
        <EmptyState title="Nenhum pedido encontrado" description="Pedidos importados do Mercado Livre, CSV, iFood ou cadastros manuais aparecerao aqui quando houver dados confirmados." />
      ) : (
        <section className="overflow-x-auto rounded-2xl border border-zinc-900 bg-zinc-950 p-4">
          <table className="min-w-full divide-y divide-zinc-800 text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2 text-left">Pedido</th>
                <th className="px-3 py-2 text-left">Data</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Origem</th>
                <th className="px-3 py-2 text-left">Itens</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-zinc-100">
              {orders.map((order) => {
                const isMl = order.type === "ml";
                const id = isMl ? order.item.mlOrderId : order.item.externalId || order.item.id;
                const date = isMl ? order.item.dateCreated : order.item.occurredAt;
                const status = isMl ? order.item.status : "confirmado";
                const source = isMl
                  ? "Mercado Livre"
                  : order.item.channel === "manual" && order.item.category
                    ? order.item.category
                    : order.item.channel;
                const items = isMl
                  ? order.item.items.map((item) => `${item.quantity}x ${item.title}`).join(", ")
                  : order.item.productName || order.item.category || "Venda importada";
                const total = isMl ? order.item.totalAmount : order.item.amount;
                const currency = isMl ? order.item.currencyId || "BRL" : "BRL";

                return (
                <tr key={`${order.type}-${id}`} className="hover:bg-zinc-900/60">
                  <td className="px-3 py-3 font-mono text-xs text-lime-300">{id}</td>
                  <td className="px-3 py-3">{new Date(date).toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs font-bold uppercase text-zinc-300">
                      {status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-full border border-lime-400/25 bg-lime-400/10 px-2 py-1 text-xs font-bold text-lime-200">
                      {source}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-zinc-300">
                    {items}
                  </td>
                  <td className="px-3 py-3 text-right font-black">
                    {asCurrency(total, currency)}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
};

export default Orders;
