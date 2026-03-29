import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { EyeIcon, EyeOffIcon } from "../components/icons";
import { api } from "../services/api";
import type { UserNiche } from "../src/types/domain";

function getFirstString(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function NLLogo() {
  return (
    <div className="flex items-center gap-3">
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "rgba(182,255,0,0.12)",
          border: "1px solid rgba(182,255,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: 14,
          color: "#b6ff00",
          letterSpacing: "0.04em",
        }}
      >
        NL
      </div>
      <div>
        <p style={{ fontWeight: 800, fontSize: 14, color: "#f4f4f4", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Next Level
        </p>
        <p style={{ fontSize: 10, color: "#52525b", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
          Operacao tatica
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */

const LoginPage = () => {
  const [isRegisterView, setIsRegisterView] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Preencha e-mail e senha.");
      return;
    }
    try {
      setLoading(true);
      const response = await api.post<{
        accessToken?: string;
        access_token?: string;
        refreshToken?: string;
        refresh_token?: string;
        user?: { name?: string; admin?: boolean; niche?: UserNiche | null };
      }>("/auth/login", { email, password });

      const payload = response.data as Record<string, unknown>;
      const nestedData = (payload.data || payload.result || payload.tokens || {}) as Record<string, unknown>;
      const token = getFirstString([
        payload.access_token, payload.accessToken, payload.token,
        nestedData.access_token, nestedData.accessToken, nestedData.token,
      ]);
      const refreshToken = getFirstString([
        payload.refresh_token, payload.refreshToken,
        nestedData.refresh_token, nestedData.refreshToken,
      ]);

      if (!token) throw new Error("Token nao retornado no login.");

      const userPayload = (payload.user || nestedData.user || {}) as Record<string, unknown>;
      login(token, refreshToken ?? undefined, {
        name: (userPayload.name as string) ?? "",
        admin: (userPayload.admin as boolean) ?? false,
        niche: (userPayload.niche as UserNiche) ?? null,
      });
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao entrar.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Preencha todos os campos.");
      return;
    }
    try {
      setLoading(true);
      await api.post("/auth/register", { name, email, password });
      await handleLogin(e);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar conta.";
      setError(msg);
      setLoading(false);
    }
  };

  /* ── Styles (inline so no Tailwind compile needed for new classes) ── */
  const s = {
    page: {
      minHeight: "100vh",
      background: "#050709",
      display: "flex",
      fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
      overflow: "hidden",
    } as React.CSSProperties,

    // Left panel – decorative
    leftPanel: {
      flex: 1,
      display: "none",
      position: "relative",
      padding: "48px",
      flexDirection: "column",
      justifyContent: "space-between",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      overflow: "hidden",
    } as React.CSSProperties,

    glowBlob: {
      position: "absolute",
      width: 480,
      height: 480,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(182,255,0,0.12) 0%, transparent 70%)",
      top: "50%",
      left: "50%",
      transform: "translate(-60%, -50%)",
      pointerEvents: "none",
    } as React.CSSProperties,

    glowBlobBottom: {
      position: "absolute",
      width: 300,
      height: 300,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(182,255,0,0.06) 0%, transparent 70%)",
      bottom: 80,
      right: -60,
      pointerEvents: "none",
    } as React.CSSProperties,

    gridPattern: {
      position: "absolute",
      inset: 0,
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
      `,
      backgroundSize: "48px 48px",
      pointerEvents: "none",
    } as React.CSSProperties,

    leftContent: {
      position: "relative",
      zIndex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      height: "100%",
    } as React.CSSProperties,

    heroText: {
      marginTop: "auto",
      marginBottom: "auto",
      paddingTop: 80,
    } as React.CSSProperties,

    eyebrow: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.28em",
      textTransform: "uppercase" as const,
      color: "rgba(182,255,0,0.7)",
      marginBottom: 20,
    } as React.CSSProperties,

    headline: {
      fontSize: "clamp(36px, 3.5vw, 52px)",
      fontWeight: 900,
      lineHeight: 0.94,
      letterSpacing: "-0.04em",
      color: "#f4f4f4",
      marginBottom: 24,
    } as React.CSSProperties,

    headlineAccent: {
      color: "#b6ff00",
    } as React.CSSProperties,

    subtext: {
      fontSize: 14,
      lineHeight: 1.75,
      color: "#71717a",
      maxWidth: 380,
    } as React.CSSProperties,

    statsRow: {
      display: "flex",
      gap: 24,
      marginTop: 48,
    } as React.CSSProperties,

    statCard: {
      flex: 1,
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.03)",
      padding: "16px 20px",
    } as React.CSSProperties,

    statValue: {
      fontSize: 22,
      fontWeight: 800,
      color: "#b6ff00",
      letterSpacing: "-0.03em",
    } as React.CSSProperties,

    statLabel: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.16em",
      textTransform: "uppercase" as const,
      color: "#52525b",
      marginTop: 4,
    } as React.CSSProperties,

    pillsRow: {
      display: "flex",
      flexWrap: "wrap" as const,
      gap: 8,
      marginTop: 40,
    } as React.CSSProperties,

    pill: {
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.1)",
      background: "rgba(255,255,255,0.04)",
      padding: "6px 14px",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.12em",
      textTransform: "uppercase" as const,
      color: "#71717a",
    } as React.CSSProperties,

    // Right panel – form
    rightPanel: {
      width: "100%",
      maxWidth: 520,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 32px",
      minHeight: "100vh",
    } as React.CSSProperties,

    formWrap: {
      width: "100%",
    } as React.CSSProperties,

    formHeader: {
      marginBottom: 40,
    } as React.CSSProperties,

    formTitle: {
      fontSize: 28,
      fontWeight: 900,
      letterSpacing: "-0.04em",
      color: "#f4f4f4",
      marginTop: 32,
      marginBottom: 8,
      lineHeight: 1.1,
    } as React.CSSProperties,

    formSubtitle: {
      fontSize: 14,
      color: "#52525b",
      lineHeight: 1.6,
    } as React.CSSProperties,

    tabRow: {
      display: "flex",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.03)",
      padding: 4,
      marginBottom: 32,
    } as React.CSSProperties,

    tab: (active: boolean): React.CSSProperties => ({
      flex: 1,
      borderRadius: 10,
      border: "none",
      cursor: "pointer",
      padding: "10px 0",
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      transition: "all 0.2s",
      ...(active
        ? { background: "rgba(182,255,0,0.12)", color: "#b6ff00", border: "1px solid rgba(182,255,0,0.2)" }
        : { background: "transparent", color: "#52525b" }),
    }),

    fieldGroup: {
      display: "flex",
      flexDirection: "column",
      gap: 20,
      marginBottom: 24,
    } as React.CSSProperties,

    fieldLabel: {
      display: "block",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.18em",
      textTransform: "uppercase" as const,
      color: "#71717a",
      marginBottom: 8,
    } as React.CSSProperties,

    fieldInput: {
      width: "100%",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.1)",
      background: "rgba(6,9,17,0.8)",
      padding: "14px 16px",
      fontSize: 14,
      color: "#f4f4f4",
      outline: "none",
      transition: "border-color 0.2s, box-shadow 0.2s",
      boxSizing: "border-box",
    } as React.CSSProperties,

    fieldInputPassword: {
      paddingRight: 48,
    } as React.CSSProperties,

    passwordWrap: {
      position: "relative",
    } as React.CSSProperties,

    eyeBtn: {
      position: "absolute",
      right: 14,
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#52525b",
      padding: 0,
      display: "flex",
      alignItems: "center",
    } as React.CSSProperties,

    forgotRow: {
      display: "flex",
      justifyContent: "flex-end",
      marginTop: -12,
    } as React.CSSProperties,

    forgotLink: {
      fontSize: 12,
      fontWeight: 600,
      color: "#52525b",
      textDecoration: "none",
      letterSpacing: "0.04em",
      cursor: "pointer",
      transition: "color 0.2s",
    } as React.CSSProperties,

    errorBox: {
      borderRadius: 12,
      border: "1px solid rgba(239,68,68,0.2)",
      background: "rgba(239,68,68,0.08)",
      padding: "12px 16px",
      fontSize: 13,
      color: "#fca5a5",
      marginBottom: 16,
    } as React.CSSProperties,

    primaryBtn: {
      width: "100%",
      borderRadius: 14,
      border: "1px solid rgba(182,255,0,0.15)",
      background: "#b6ff00",
      color: "#0a0e05",
      padding: "15px 0",
      fontSize: 13,
      fontWeight: 900,
      letterSpacing: "0.16em",
      textTransform: "uppercase" as const,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      transition: "filter 0.2s, transform 0.15s",
      boxShadow: "0 0 32px rgba(182,255,0,0.18)",
    } as React.CSSProperties,

    divider: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      margin: "24px 0",
    } as React.CSSProperties,

    dividerLine: {
      flex: 1,
      height: 1,
      background: "rgba(255,255,255,0.07)",
    } as React.CSSProperties,

    dividerText: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.14em",
      textTransform: "uppercase" as const,
      color: "#3f3f46",
    } as React.CSSProperties,

    oauthBtn: {
      width: "100%",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.1)",
      background: "rgba(255,255,255,0.04)",
      color: "#a1a1aa",
      padding: "13px 0",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      transition: "background 0.2s",
    } as React.CSSProperties,

    switchRow: {
      textAlign: "center" as const,
      marginTop: 28,
      fontSize: 13,
      color: "#52525b",
    } as React.CSSProperties,

    switchLink: {
      color: "#b6ff00",
      fontWeight: 700,
      cursor: "pointer",
      background: "none",
      border: "none",
      padding: 0,
      fontSize: 13,
    } as React.CSSProperties,

    spinner: {
      width: 18,
      height: 18,
      borderRadius: "50%",
      border: "2px solid rgba(10,14,5,0.3)",
      borderTopColor: "#0a0e05",
      animation: "nlspin 0.7s linear infinite",
    } as React.CSSProperties,
  };

  const isLogin = !isRegisterView;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes nlspin { to { transform: rotate(360deg); } }
        @keyframes nlfadein { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .nl-page { font-family: 'DM Sans', 'Inter', system-ui, sans-serif; }
        .nl-right-panel { animation: nlfadein 0.5s ease both; }
        .nl-field:focus { border-color: rgba(182,255,0,0.5) !important; box-shadow: 0 0 0 3px rgba(182,255,0,0.08) !important; }
        .nl-primary-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
        .nl-primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .nl-oauth-btn:hover { background: rgba(255,255,255,0.07) !important; }
        .nl-forgot:hover { color: #b6ff00 !important; }
        @media (min-width: 1024px) {
          .nl-left-panel { display: flex !important; }
          .nl-right-panel { margin: 0 !important; max-width: 480px !important; }
          .nl-page-inner { display: flex !important; }
        }
      `}</style>

      <div className="nl-page" style={s.page}>
        <div className="nl-page-inner" style={{ display: "flex", width: "100%", minHeight: "100vh" }}>

          {/* ── Left decorative panel ── */}
          <div className="nl-left-panel" style={s.leftPanel}>
            <div style={s.gridPattern} />
            <div style={s.glowBlob} />
            <div style={s.glowBlobBottom} />

            <div style={s.leftContent}>
              <NLLogo />

              <div style={s.heroText}>
                <p style={s.eyebrow}>Operacao tatica · Margem real</p>
                <h1 style={s.headline}>
                  A linha que separa<br />
                  sua empresa do{" "}
                  <span style={s.headlineAccent}>lucro real</span><br />
                  ou do colapso.
                </h1>
                <p style={s.subtext}>
                  Sem a Next Level, voce opera cego. Automatize vendas,
                  conecte canais e enxergue margem verdadeira antes de
                  perder dinheiro.
                </p>

                <div style={s.statsRow}>
                  {[
                    { value: "+18,4%", label: "Margem recuperada" },
                    { value: "1 clique", label: "Conexoes criticas" },
                    { value: "360°", label: "Visao operacional" },
                  ].map((stat) => (
                    <div key={stat.label} style={s.statCard}>
                      <div style={s.statValue}>{stat.value}</div>
                      <div style={s.statLabel}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={s.pillsRow}>
                  {["WhatsApp", "Instagram", "Mercado Livre", "Shopee", "Mercado Pago"].map((p) => (
                    <span key={p} style={s.pill}>{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right form panel ── */}
          <div className="nl-right-panel" style={s.rightPanel}>
            <div style={s.formWrap}>

              {/* Logo (shown on mobile only) */}
              <div style={{ marginBottom: 0 }} className="nl-mobile-logo">
                <NLLogo />
              </div>

              <div style={s.formHeader}>
                <h2 style={s.formTitle}>
                  {isLogin ? "Acesse o painel" : "Comece de graca"}
                </h2>
                <p style={s.formSubtitle}>
                  {isLogin
                    ? "Entre com sua conta para continuar."
                    : "7 dias de trial. Sem pegadinha."}
                </p>
              </div>

              {/* Tab switcher */}
              <div style={s.tabRow}>
                <button
                  style={s.tab(!isRegisterView)}
                  onClick={() => { setIsRegisterView(false); resetForm(); }}
                  type="button"
                >
                  Entrar
                </button>
                <button
                  style={s.tab(isRegisterView)}
                  onClick={() => { setIsRegisterView(true); resetForm(); }}
                  type="button"
                >
                  Criar conta
                </button>
              </div>

              {/* OAuth */}
              <button
                type="button"
                className="nl-oauth-btn"
                style={s.oauthBtn}
                onClick={() => {/* OAuth handler */}}
              >
                <GoogleIcon style={{ width: 18, height: 18 }} />
                Continuar com Google
              </button>

              <div style={s.divider}>
                <div style={s.dividerLine} />
                <span style={s.dividerText}>ou</span>
                <div style={s.dividerLine} />
              </div>

              {/* Form */}
              <form onSubmit={isLogin ? handleLogin : handleRegister} noValidate>
                <div style={s.fieldGroup}>

                  {isRegisterView && (
                    <div>
                      <label style={s.fieldLabel} htmlFor="nl-name">Nome completo</label>
                      <input
                        id="nl-name"
                        className="nl-field"
                        style={s.fieldInput}
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label style={s.fieldLabel} htmlFor="nl-email">Endereco de e-mail</label>
                    <input
                      id="nl-email"
                      className="nl-field"
                      style={s.fieldInput}
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={s.fieldLabel} htmlFor="nl-password">Senha</label>
                    <div style={s.passwordWrap}>
                      <input
                        id="nl-password"
                        className="nl-field"
                        style={{ ...s.fieldInput, ...s.fieldInputPassword }}
                        type={showPassword ? "text" : "password"}
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        style={s.eyeBtn}
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword
                          ? <EyeOffIcon className="h-4 w-4" />
                          : <EyeIcon className="h-4 w-4" />
                        }
                      </button>
                    </div>

                    {isLogin && (
                      <div style={s.forgotRow}>
                        <a
                          href="/forgot-password"
                          className="nl-forgot"
                          style={s.forgotLink}
                        >
                          Esqueceu a senha?
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {error && <div style={s.errorBox}>{error}</div>}

                <button
                  type="submit"
                  className="nl-primary-btn"
                  style={s.primaryBtn}
                  disabled={loading}
                >
                  {loading && <span style={s.spinner} />}
                  {loading
                    ? "Processando..."
                    : isLogin
                      ? "Entrar no painel"
                      : "Ativar trial gratis"}
                </button>
              </form>

              <div style={s.switchRow}>
                {isLogin ? (
                  <>
                    Nao tem conta?{" "}
                    <button
                      type="button"
                      style={s.switchLink}
                      onClick={() => { setIsRegisterView(true); resetForm(); }}
                    >
                      Criar gratis
                    </button>
                  </>
                ) : (
                  <>
                    Ja tem conta?{" "}
                    <button
                      type="button"
                      style={s.switchLink}
                      onClick={() => { setIsRegisterView(false); resetForm(); }}
                    >
                      Entrar
                    </button>
                  </>
                )}
              </div>

              <p style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: "#3f3f46", letterSpacing: "0.08em" }}>
                Ao continuar, voce concorda com os{" "}
                <a href="/terms" style={{ color: "#52525b", textDecoration: "underline" }}>Termos de Uso</a>
                {" "}e{" "}
                <a href="/privacy" style={{ color: "#52525b", textDecoration: "underline" }}>Privacidade</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
