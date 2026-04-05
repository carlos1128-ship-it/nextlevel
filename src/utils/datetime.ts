import type { TransactionItem } from "../types/domain";

export const BRAZIL_TIMEZONE = "America/Sao_Paulo";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function toDateTimeLocalValue(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getTransactionDateValue(transaction: Partial<TransactionItem>) {
  return transaction.date || transaction.occurredAt || transaction.createdAt || "";
}

export function formatTransactionDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    timeZone: BRAZIL_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTransactionDate(value?: string, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", {
    timeZone: BRAZIL_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    ...options,
  });
}
