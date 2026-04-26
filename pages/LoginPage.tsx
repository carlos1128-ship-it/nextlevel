import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { api } from "../services/api";
import type { UserNiche } from "../src/types/domain";

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
function getFirstString(values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────
   Icons
───────────────────────────────────────────────────────────── */
const EyeIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const EyeOffIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0112 20c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 012.042-3.366M6.26 6.26A9.952 9.952 0 0112 4c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411M3 3l18 18" />
  </svg>
);
const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   AuthPanel Props
───────────────────────────────────────────────────────────── */
interface AuthPanelProps {
  isRegisterView: boolean;
  setIsRegisterView: (v: boolean) => void;
  onLogin: (e: React.FormEvent) => void;
  onRegister: (e: React.FormEvent) => void;
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  showPassword: boolean; setShowPassword: (v: boolean) => void;
  error: string; loading: boolean; setError: (v: string) => void;
}

const fieldCls = "w-full rounded-[14px] border border-white/5 bg-[#0A0D14] px-4 py-3 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-600 focus:border-[#B6FF00]/50 focus:bg-[#0A0D14] focus:shadow-[0_0_12px_rgba(182,255,0,0.1)]";

const AuthPanel: React.FC<AuthPanelProps> = ({
  isRegisterView, setIsRegisterView, onLogin, onRegister,
  name, setName, email, setEmail, password, setPassword,
  showPassword, setShowPassword, error, loading, setError,
}) => (
  <div className="w-full max-w-md mx-auto xl:mx-0 xl:max-w-lg rounded-3xl border border-white/10 bg-[#06090F] p-8 lg:p-10 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative overflow-hidden">
    {/* Subtle glow inside card */}
    <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 bg-[#B6FF00] opacity-[0.03] blur-3xl rounded-full" />
    
    <div className="relative">
      <div className="mb-8">
        <h2 className="text-2xl lg:text-3xl font-black tracking-[-0.04em] text-white">
          {isRegisterView ? "CRIAR CONTA NEXT LEVEL" : "ENTRAR NO PAINEL"}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          {isRegisterView ? "Crie sua conta e prepare seu painel operacional." : "Acesse sua operação com segurança."}
        </p>
      </div>

      <div className="mb-6 flex rounded-xl border border-white/5 bg-[#0A0D14] p-1">
        <button type="button" onClick={() => { setIsRegisterView(false); setError(""); }}
          className={`flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition ${!isRegisterView ? "bg-[#B6FF00]/10 text-[#B6FF00] shadow-sm" : "text-zinc-500 hover:text-white"}`}>
          Login
        </button>
        <button type="button" onClick={() => { setIsRegisterView(true); setError(""); }}
          className={`flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition ${isRegisterView ? "bg-[#B6FF00]/10 text-[#B6FF00] shadow-sm" : "text-zinc-500 hover:text-white"}`}>
          Cadastro
        </button>
      </div>

      <form onSubmit={isRegisterView ? onRegister : onLogin} className="space-y-5">
        {isRegisterView && (
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={fieldCls} type="text" placeholder="Nome completo" />
          </div>
        )}
        <div>
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">E-mail</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className={fieldCls} type="email" placeholder="email@empresa.com" />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Senha</label>
            {!isRegisterView && (
              <a href="/forgot-password" className="text-[10px] font-semibold text-zinc-500 transition hover:text-[#B6FF00]">Esqueceu a senha?</a>
            )}
          </div>
          <div className="relative">
            <input value={password} onChange={(e) => setPassword(e.target.value)} className={`${fieldCls} pr-12`}
              type={showPassword ? "text" : "password"} placeholder={isRegisterView ? "Crie uma senha forte" : "Sua senha"} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-zinc-300"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 flex items-center gap-2">
            <p className="text-xs text-red-400 font-medium">{error}</p>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="mt-2 w-full rounded-xl bg-[#B6FF00] py-3.5 text-xs font-black uppercase tracking-[0.2em] text-black transition hover:brightness-110 disabled:opacity-50">
          {loading ? "Processando..." : isRegisterView ? "Criar Conta" : "Entrar no Painel"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/5" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Ou</span>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      <button type="button"
        onClick={() => {
          const raw = String(import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
          const base = /\/api$/i.test(raw) ? raw : `${raw}/api`;
          window.location.href = `${base}/auth/google`;
        }}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#0A0D14] py-3 text-xs font-bold uppercase tracking-[0.1em] text-zinc-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white">
        <GoogleIcon /> Continuar com Google
      </button>

      {!isRegisterView && (
        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-500 font-medium tracking-wide">
            AINDA NÃO TEM CONTA?{' '}
            <button onClick={() => navigate('/plans')} className="text-[#B6FF00] hover:underline uppercase font-bold ml-1">
              Assinar Agora
            </button>
          </p>
        </div>
      )}
      {isRegisterView && (
        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-500 font-medium tracking-wide">
            JÁ TEM CONTA?{' '}
            <button onClick={() => { setIsRegisterView(false); setError(""); }} className="text-[#B6FF00] hover:underline uppercase font-bold ml-1">
              Entrar no Painel
            </button>
          </p>
        </div>
      )}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────── */
const LoginPage: React.FC = () => {
  const [isRegisterView, setIsRegisterView] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const resetForm = () => { setName(""); setEmail(""); setPassword(""); setError(""); setLoading(false); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) { setError("Preencha e-mail e senha."); return; }
    try {
      setLoading(true);
      const response = await api.post<{
        accessToken?: string; access_token?: string;
        refreshToken?: string; refresh_token?: string;
        user?: { name?: string; admin?: boolean; niche?: UserNiche | null };
      }>("/auth/login", { email, password });
      const payload = response.data as Record<string, unknown>;
      const nestedData = (payload.data || payload.result || payload.tokens || {}) as Record<string, unknown>;
      const token = getFirstString([payload.access_token, payload.accessToken, payload.token, nestedData.access_token, nestedData.accessToken, nestedData.token]);
      const refreshToken = getFirstString([payload.refresh_token, payload.refreshToken, nestedData.refresh_token, nestedData.refreshToken]);
      if (!token) throw new Error("Token não retornado no login.");
      localStorage.setItem("access_token", token);
      if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
      else localStorage.removeItem("refresh_token");
      login({ name: response.data.user?.name || email, email, admin: Boolean(response.data.user?.admin), niche: response.data.user?.niche || null });
      navigate("/", { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const r = (err as { response?: { data?: Record<string, unknown> } }).response;
        setError(String(r?.data?.message || r?.data?.error || r?.data?.detail || "Erro ao fazer login"));
      } else {
        setError(err instanceof Error ? err.message : "Erro ao fazer login");
      }
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password.trim()) { setError("Preencha todos os campos."); return; }
    try {
      setLoading(true);
      await api.post("/auth/register", { email, password, name: name.trim(), companyName: name.trim() });
      alert("Conta criada com sucesso. Faça login.");
      setIsRegisterView(false);
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao registrar");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-[#030507]">
      {/* 
        RIGHT SIDE ON DESKTOP, TOP ON MOBILE:
        The prompt explicitly requested "On mobile: Show the auth form first or very near the top."
        Using flex-col makes elements stack naturally. To show auth first on mobile but keep it on the right side on desktop, we can use flex-col-reverse or order classes.
      */}
      <div className="order-2 lg:order-1 flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 lg:px-16 xl:px-24 relative overflow-hidden">
        {/* Background Accents for Left Side */}
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#B6FF00] opacity-[0.02] blur-[100px]" />
        
        <div className="relative z-10 max-w-lg mx-auto lg:mx-0 lg:ml-auto">
          <div className="inline-flex rounded-full border border-[#B6FF00]/20 bg-[#B6FF00]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#B6FF00] mb-8">
            ACESSO SEGURO NEXT LEVEL
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[0.9] tracking-[-0.04em] text-white">
            ENTRE NO <span className="text-[#B6FF00]">CENTRO DE COMANDO</span> DA SUA <span className="text-[#B6FF00]">OPERAÇÃO.</span>
          </h1>

          <p className="mt-8 text-sm sm:text-base font-medium tracking-wide text-zinc-400 uppercase leading-relaxed max-w-md">
            RECUPERE VISÃO, MARGEM E CONTROLE ANTES QUE A OPERAÇÃO PERCA RITMO.
          </p>

          <div className="mt-12 space-y-4">
            <div className="flex items-start gap-4 rounded-[20px] border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm transition-colors hover:bg-white/[0.04]">
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#B6FF00] shadow-[0_0_12px_rgba(182,255,0,0.4)]" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-zinc-300">MARGEM EM TEMPO REAL</p>
                <p className="mt-2 text-sm text-zinc-500">Visualize lucro, perdas e oportunidades no mesmo painel.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-[20px] border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm transition-colors hover:bg-white/[0.04]">
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#B6FF00] shadow-[0_0_12px_rgba(182,255,0,0.4)]" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-zinc-300">IA OPERACIONAL</p>
                <p className="mt-2 text-sm text-zinc-500">Transforme dados em ações práticas para a empresa.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-[20px] border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm transition-colors hover:bg-white/[0.04]">
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#B6FF00] shadow-[0_0_12px_rgba(182,255,0,0.4)]" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-zinc-300">CANAIS CONECTADOS</p>
                <p className="mt-2 text-sm text-zinc-500">Prepare WhatsApp, Instagram e marketplaces para operar juntos.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="order-1 lg:order-2 flex w-full lg:w-1/2 items-center justify-center bg-[#010203] px-6 py-12 lg:px-16 border-b border-white/5 lg:border-b-0 lg:border-l relative">
        <AuthPanel
          isRegisterView={isRegisterView} setIsRegisterView={setIsRegisterView}
          onLogin={handleLogin} onRegister={handleRegister}
          name={name} setName={setName} email={email} setEmail={setEmail}
          password={password} setPassword={setPassword}
          showPassword={showPassword} setShowPassword={setShowPassword}
          error={error} loading={loading} setError={setError}
        />
      </div>
    </div>
  );
};

export default LoginPage;
