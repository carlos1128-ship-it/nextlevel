import React, { useEffect, useState } from "react";
import { useAuth } from "../App";
import { useToast } from "../components/Toast";
import { getErrorMessage } from "../src/services/error";
import { changePassword, getUserProfile, updateUserProfile } from "../src/services/endpoints";
import DashboardPersonalizationPanel from "../src/components/dashboard/DashboardPersonalizationPanel";
import CompanyPersonalizationPanel from "../src/components/personalization/CompanyPersonalizationPanel";
import type { DetailLevel } from "../src/types/domain";

const Settings = () => {
  const { detailLevel, setDetailLevel, theme, setTheme, logout, selectedCompanyId } = useAuth();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    getUserProfile()
      .then((profile) => setName(profile?.name || ""))
      .catch(() => {
        // ignore bootstrap error here, page still usable
      });
  }, []);

  const handleThemeToggle = async () => {
    const previousTheme = theme;
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);

    try {
      setSaving(true);
      addToast("Tema atualizado localmente.", "success");
    } catch (error) {
      setTheme(previousTheme);
      addToast(getErrorMessage(error, "Falha ao salvar tema."), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDetailChange = async (value: DetailLevel) => {
    const previous = detailLevel;
    setDetailLevel(value);
    try {
      setSaving(true);
      await updateUserProfile({ detailLevel: value });
      addToast("Nível de detalhamento atualizado.", "success");
    } catch (error) {
      setDetailLevel(previous);
      addToast(getErrorMessage(error, "Falha ao salvar nível de detalhamento."), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateName = async () => {
    if (!name.trim()) {
      addToast("Informe um nome válido.", "info");
      return;
    }

    try {
      setSaving(true);
      await updateUserProfile({ name: name.trim() });
      addToast("Nome atualizado com sucesso.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Falha ao atualizar nome."), "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) {
      addToast("Preencha senha atual e nova senha.", "info");
      return;
    }

    try {
      setSaving(true);
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      addToast("Senha alterada com sucesso.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Falha ao alterar senha."), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    addToast("Logout realizado.", "success");
  };

  return (
    <div className="nl-page max-w-5xl mx-auto space-y-10">
      <header className="nl-page-header border-b border-white/5 pb-10 mb-2">
        <div className="nl-page-header__meta">
          <p className="nl-eyebrow text-amber-400">Preferências Globais</p>
          <h1 className="nl-page-title text-4xl">Configurações de Workspace</h1>
          <p className="nl-page-subtitle">Ajuste o comportamento do sistema, níveis de abstração da IA e parâmetros visuais.</p>
        </div>
      </header>

      <CompanyPersonalizationPanel companyId={selectedCompanyId} onToast={addToast} />

      <DashboardPersonalizationPanel companyId={selectedCompanyId} onToast={addToast} />

      <section className="nl-card-glass p-8 space-y-8">
        <div className="flex items-center gap-2 mb-2">
           <div className="h-1.5 w-1.5 rounded-full bg-[var(--nl-neon)]" />
           <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--nl-text-muted)]">Parâmetros de Identidade</h2>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-[1fr_auto] items-end">
          <div className="flex flex-col gap-2.5">
             <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--nl-text-muted)] px-1">Nome de Exibição</span>
             <input
               value={name}
               onChange={(e) => setName(e.target.value)}
               className="nl-input h-12 bg-black border-white/10"
               placeholder="Seu nome operacional"
             />
          </div>
          <button
            onClick={handleUpdateName}
            disabled={saving}
            className="nl-button-primary h-12 px-8 text-[10px] font-black uppercase tracking-widest"
          >
            {saving ? "Salvando..." : "Sincronizar"}
          </button>
        </div>

        <div className="pt-8 border-t border-white/5">
           <div className="flex items-center gap-2 mb-6">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--nl-text-muted)]">Criptografia de Acesso</h2>
           </div>
           <div className="grid gap-6 md:grid-cols-2">
             <div className="flex flex-col gap-2.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--nl-text-muted)] px-1">Senha Atual</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="nl-input h-12 bg-black border-white/10"
                />
             </div>
             <div className="flex flex-col gap-2.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--nl-text-muted)] px-1">Novo Código</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="nl-input h-12 bg-black border-white/10"
                />
             </div>
           </div>
           <button
             onClick={handlePasswordChange}
             disabled={saving}
             className="mt-6 nl-button-secondary border-white/10 text-white h-11 px-8 text-[10px] font-black uppercase tracking-widest hover:border-white/20"
           >
             Redefinir Credencial
           </button>
        </div>
      </section>

      <section className="nl-card-glass p-8 space-y-8 mb-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500 opacity-[0.03] blur-[80px] pointer-events-none" />
        <div className="flex items-center gap-2 mb-2">
           <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
           <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--nl-text-muted)]">Preferências UX/AI</h2>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex-1">
             <p className="text-[13px] font-black text-white uppercase tracking-widest mb-1">Engenharia de Temas</p>
             <p className="text-[11px] font-bold text-[var(--nl-text-muted)]">Atualmente operando em interface <span className="text-[var(--nl-neon)]">{theme === "dark" ? "Black Mode" : "Light Aura"}</span>.</p>
          </div>
          <button
            onClick={handleThemeToggle}
            disabled={saving}
            className="nl-button-secondary border-white/10 text-white min-w-[160px] h-10 text-[9px] font-black uppercase tracking-widest hover:border-[var(--nl-neon)]/50"
          >
            Alternar Visão
          </button>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex-1">
             <p className="text-[13px] font-black text-white uppercase tracking-widest mb-1">Abstração Cognitiva</p>
             <p className="text-[11px] font-bold text-[var(--nl-text-muted)]">Ajuste o nível de verbosidade e profundidade técnica das análises da IA.</p>
          </div>
          <select
            value={detailLevel}
            onChange={(e) => handleDetailChange(e.target.value as DetailLevel)}
            disabled={saving}
            className="nl-input h-10 min-w-[160px] text-[10px] font-black uppercase tracking-widest bg-black border-white/10 text-center cursor-pointer hover:border-[var(--nl-neon)]/30 transition-all focus:outline-none"
          >
            <option value="low">Síntese (Baixo)</option>
            <option value="medium">Equilibrado (Médio)</option>
            <option value="high">Exaustivo (Alto)</option>
          </select>
        </div>
      </section>

      <div className="pt-6">
        <button
          onClick={handleLogout}
          className="w-full h-14 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/30 text-[10px] font-black uppercase tracking-[0.4em] text-red-500 transition-all shadow-[0_4px_30px_rgba(239,68,68,0.05)]"
        >
          Encerrar Sessão Segura
        </button>
        <p className="text-center mt-6 text-[9px] font-black uppercase tracking-[0.3em] text-[var(--nl-text-muted)] opacity-30">
          Node Instance: {window.location.hostname} • Protocol v2.5.4
        </p>
      </div>
    </div>
  );
};

export default Settings;
