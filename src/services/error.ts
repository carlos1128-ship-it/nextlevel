import { AxiosError } from "axios";

export const ACTIVE_COMPANY_ACCESS_MESSAGE =
  "Não foi possível acessar a empresa ativa. Atualize a sessão ou selecione uma empresa válida.";

export function isActiveCompanyAccessError(error: unknown) {
  if (!(error instanceof AxiosError)) return false;
  if (error.response?.status !== 403) return false;
  const payload = error.response.data;
  const message =
    typeof payload === "string"
      ? payload
      : payload && typeof payload === "object"
        ? String((payload as { message?: unknown }).message || "")
        : "";
  return message.toLowerCase().includes("sem acesso a empresa");
}

export function getErrorMessage(error: unknown, fallback = "Erro na requisicao.") {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return "Não conseguimos falar com a plataforma agora. Verifique sua conexão e tente novamente.";
    }

    if (isActiveCompanyAccessError(error)) {
      return ACTIVE_COMPANY_ACCESS_MESSAGE;
    }

    const payload = error.response?.data;
    if (typeof payload === "string" && payload.trim()) return payload;
    if (payload && typeof payload === "object") {
      const code = (payload as { code?: unknown }).code;
      if (
        code === "PLAN_LIMIT_REACHED" ||
        code === "FEATURE_NOT_INCLUDED" ||
        code === "INTEGRATION_NOT_INCLUDED" ||
        code === "PLAN_UPGRADE_REQUIRED"
      ) {
        const message = (payload as { message?: unknown }).message;
        if (typeof message === "string" && message.trim()) return message;
        return "Este recurso pede upgrade de plano. Veja as opcoes disponiveis.";
      }
      const errorCode = (payload as { error?: unknown }).error;
      if (errorCode === "DependencyUnavailable") {
        return "Um servico externo não respondeu agora. Tente novamente em instantes.";
      }
      const message = (payload as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
      if (Array.isArray(message) && message.length > 0) {
        const first = message.find((item) => typeof item === "string" && item.trim());
        if (typeof first === "string") return first;
      }
      const errorText = (payload as { error?: unknown }).error;
      if (typeof errorText === "string" && errorText.trim()) return errorText;
    }
    if (error.response?.status === 404) {
      return "Não encontramos o recurso que você tentou acessar. Volte e tente novamente pelo menu principal.";
    }
    if (error.response?.status && error.response.status >= 500) {
      return "Algo saiu do fluxo esperado, mas seu painel continua protegido. Tente novamente em instantes.";
    }
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}
