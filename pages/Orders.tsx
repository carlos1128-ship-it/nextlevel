import React, { useEffect, useState } from "react";
import { useAuth } from "../App";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { useToast } from "../components/Toast";
import { getErrorMessage } from "../src/services/error";
import {
  getMercadoLivreOrders,
  syncMercadoLivreOrders,
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
  const [orders, setOrders] = useState<MercadoLivreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
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
      setOrders(await getMercadoLivreOrders(selectedCompanyId));
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

  const handleSync = async () => {
    if (!selectedCompanyId) return;
    try {
      setSyncing(true);
      await syncMercadoLivreOrders(selectedCompanyId);
      await loadOrders();
      addToast("Pedidos sincronizados.", "success");
    } catch (err) {
      addToast(getErrorMessage(err, "Falha ao sincronizar pedidos."), "error");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-300">Mercado Livre</p>
          <h1 className="text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">Pedidos</h1>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing || !selectedCompanyId}
          className="rounded-xl bg-lime-400 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-950 disabled:opacity-50"
        >
          {syncing ? "Sincronizando..." : "Atualizar pedidos"}
        </button>
      </section>

      {loading ? (
        <LoadingState label="Carregando pedidos..." />
      ) : error ? (
        <ErrorState title="Erro nos pedidos" description={error} actionLabel="Tentar novamente" onAction={loadOrders} />
      ) : orders.length === 0 ? (
        <EmptyState title="Nenhum pedido sincronizado" description="Conecte e sincronize o Mercado Livre para alimentar dashboard, IA e financeiro." />
      ) : (
        <section className="overflow-x-auto rounded-2xl border border-zinc-900 bg-zinc-950 p-4">
          <table className="min-w-full divide-y divide-zinc-800 text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2 text-left">Pedido</th>
                <th className="px-3 py-2 text-left">Data</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Itens</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-zinc-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-900/60">
                  <td className="px-3 py-3 font-mono text-xs text-lime-300">{order.mlOrderId}</td>
                  <td className="px-3 py-3">{new Date(order.dateCreated).toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs font-bold uppercase text-zinc-300">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-zinc-300">
                    {order.items.map((item) => `${item.quantity}x ${item.title}`).join(", ")}
                  </td>
                  <td className="px-3 py-3 text-right font-black">
                    {asCurrency(order.totalAmount, order.currencyId || "BRL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
};

export default Orders;
