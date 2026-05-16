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
      const message = getErrorMessage(err, "Não foi possível carregar pedidos.");
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
    <div className="nl-page">
      <div className="nl-page-header">
        <div className="nl-page-header__meta">
          <p className="nl-eyebrow">Gestão de Fluxo</p>
          <h1 className="nl-page-title">Histórico de Pedidos</h1>
          <p className="nl-page-subtitle">Pedidos integrados de todos os canais de vendas ativos no ecossistema.</p>
        </div>
        <button
          type="button"
          onClick={loadOrders}
          disabled={loading || !selectedCompanyId}
          className="nl-button-primary py-2 text-xs"
        >
          {loading ? "Sincronizando..." : "Sincronizar Pedidos"}
        </button>
      </div>      {loading ? (
        <div className="py-20 flex justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--nl-neon)] border-t-transparent" />
        </div>
      ) : error ? (
        <section className="nl-card p-10 text-center border-red-900/30">
          <h3 className="text-xl font-bold text-red-200">Falha na Sincronização</h3>
          <p className="text-sm text-[var(--nl-text-secondary)] mt-2">{error}</p>
          <button onClick={loadOrders} className="nl-button-secondary mt-6">Tentar novamente</button>
        </section>
      ) : orders.length === 0 ? (
        <section className="nl-card p-20 text-center border-dashed">
          <p className="text-xl font-bold text-[var(--nl-text-muted)]">Sem pedidos registrados</p>
          <p className="text-sm text-[var(--nl-text-secondary)] mt-1">Conecte canais de vendas ou importe dados via planilha.</p>
        </section>
      ) : (
        <section className="nl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="nl-table">
              <thead>
                <tr>
                  <th className="text-left">Identificador</th>
                  <th className="text-left">Instante</th>
                  <th className="text-left">Canal Origem</th>
                  <th className="text-left">Detalhamento dos Itens</th>
                  <th className="text-left">Status</th>
                  <th className="text-right">Montante</th>
                </tr>
              </thead>
              <tbody>
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
                  <tr key={`${order.type}-${id}`}>
                    <td className="font-mono text-[11px] text-[var(--nl-neon)]">{id}</td>
                    <td className="text-[12px] text-[var(--nl-text-secondary)]">{new Date(date).toLocaleString("pt-BR")}</td>
                    <td>
                      <span className="nl-badge-neon text-[10px]">
                        {source}
                      </span>
                    </td>
                    <td className="max-w-[300px]">
                       <p className="text-[12px] text-[var(--nl-text-secondary)] truncate" title={items}>
                         {items}
                       </p>
                    </td>
                    <td>
                      <span className="nl-badge-muted text-[10px]">
                        {status}
                      </span>
                    </td>
                    <td className="text-right font-black text-[var(--nl-text-primary)]">
                       {asCurrency(total, currency)}
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

export default Orders;
