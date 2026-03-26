import { AxiosError } from "axios";

export function getErrorMessage(error: unknown, fallback = "Erro na requisicao.") {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return "Nao conseguimos falar com a plataforma agora. Verifique sua conexao e tente novamente.";
    }

    const payload = error.response?.data;
    if (typeof payload === "string" && payload.trim()) return payload;
    if (payload && typeof payload === "object") {
      const errorCode = (payload as { error?: unknown }).error;
      if (errorCode === "DependencyUnavailable") {
        return "Um servico externo nao respondeu agora. Tente novamente em instantes.";
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
      return "Nao encontramos o recurso que voce tentou acessar. Volte e tente novamente pelo menu principal.";
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
