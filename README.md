<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Next Level Frontend

Frontend React/Vite da Next Level Platform.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure `.env.local` com:
   `VITE_API_URL=https://next-level-backend.onrender.com`
   `NEXT_PUBLIC_API_URL=https://next-level-backend.onrender.com`
3. Run the app:
   `npm run dev`

## Deploy Vercel

- Root Directory: `next-level-front`
- Build Command: `npm run build`
- Output Directory: `dist`
- Env obrigatoria: `VITE_API_URL=https://next-level-backend.onrender.com`

## Mercado Livre

A tela `/integrations` conecta OAuth do Mercado Livre. As rotas `/products` e `/orders` exibem dados sincronizados; perguntas continuam sendo ingeridas no backend para IA/contexto, sem pagina standalone no MVP.

Scripts:
- `npm test`
- `npm run build`
