# API Client Examples

## Fetch (correct POST)

```ts
await fetch(`${API_BASE_URL}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ email, password }),
});

await fetch(`${API_BASE_URL}/companies`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ name: "Minha Empresa", sector: "Servicos" }),
});

await fetch(`${API_BASE_URL}/financial/transactions`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ type: "revenue", amount: 1000, description: "Venda" }),
});

await fetch(`${API_BASE_URL}/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ message: "Resumo financeiro", detailLevel: "medium" }),
});
```

## Axios (correct POST)

```ts
import axios from "axios";

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

await http.post("/auth/login", { email, password });
await http.post("/companies", { name, sector });
await http.post("/financial/transactions", { type, amount, description });
await http.post("/chat", { message, detailLevel });
```

## Form submit safety

```ts
const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // call POST here
};
```

## Centralized client in this project

- `src/services/api.ts` handles base URL, HttpOnly cookie session, JSON parsing, and errors.
- `src/services/endpoints.ts` exposes domain methods (`createCompany`, `createTransaction`, `chatWithAi`).
- UI components call only endpoint methods, not raw `fetch`.
