import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../App";
import { useToast } from "../components/Toast";
import { getErrorMessage } from "../src/services/error";
import {
  changePassword,
  deleteMyAccount,
  getUserProfile,
  updateUserProfile,
} from "../src/services/endpoints";

const Profile = () => {
  const { username, logout } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyCount, setCompanyCount] = useState(0);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getUserProfile()
      .then((profile) => {
        setName(profile.name || "");
        setEmail(profile.email || "");
        setCompanyCount(Number(profile.companyCount || 0));
      })
      .catch((error) => {
        addToast(getErrorMessage(error, "Falha ao carregar perfil."), "error");
      });
  }, []);

  const avatarLabel = useMemo(() => {
    const source = name || username || email || "U";
    return source.charAt(0).toUpperCase();
  }, [name, username, email]);

  const onSaveProfile = async () => {
    try {
      setSavingProfile(true);
      await updateUserProfile({ name });
      addToast("Perfil atualizado com sucesso.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível atualizar o perfil."), "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      addToast("Preencha senha atual e nova senha.", "info");
      return;
    }
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      addToast("A nova senha precisa ter pelo menos 8 caracteres, com letras e números.", "info");
      return;
    }
    try {
      setSavingPassword(true);
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      addToast("Senha alterada com sucesso.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível alterar a senha."), "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const onDeleteAccount = async () => {
    if (!window.confirm("Deseja excluir a conta permanentemente?")) return;
    try {
      setDeleting(true);
      await deleteMyAccount();
      addToast("Conta excluída com sucesso.", "success");
      logout();
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível excluir a conta."), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="nl-page max-w-5xl mx-auto">
      <div className="nl-page-header border-b border-white/5 pb-10 mb-10">
        <div className="nl-page-header__meta">
          <p className="nl-eyebrow text-[var(--nl-neon)] mb-3">Gerenciamento de Identidade</p>
          <h1 className="nl-page-title text-4xl">Meu Perfil Estratégico</h1>
          <p className="nl-page-subtitle">Configure suas credenciais de acesso e parâmetros de segurança da conta.</p>
        </div>
      </div>

      <section className="nl-card-glass p-8 mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--nl-neon)] opacity-[0.02] blur-[100px] pointer-events-none group-hover:opacity-[0.04] transition-opacity" />
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between relative z-10">
          <div className="flex items-center gap-6">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-[var(--nl-neon)] text-4xl font-black text-black shadow-[0_10px_40px_rgba(182,255,0,0.2)] transform hover:scale-105 transition-transform">
              {avatarLabel}
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-[#080A0E] animate-pulse" />
            </div>
            <div>
              <p className="text-3xl font-black text-white tracking-tight leading-none mb-2">{name || username || "Operador"}</p>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--nl-text-muted)] bg-white/5 px-2 py-0.5 rounded border border-white/5">Nível Operacional Ativo</span>
                <p className="text-sm font-bold text-[var(--nl-text-secondary)] opacity-60 tracking-tight">{email || "Sem e-mail"}</p>
              </div>
            </div>
          </div>
          <div className="nl-card p-6 border-white/5 bg-black/40 flex flex-col items-center min-w-[140px] rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--nl-text-muted)] mb-2">Perímetros</p>
            <p className="text-4xl font-black text-[var(--nl-neon)] leading-none">{companyCount}</p>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-2">{companyCount === 1 ? "Empresa Ativa" : "Empresas Ativas"}</p>
          </div>
        </div>
      </section>

      <section className="nl-card-glass p-8 mb-8 border-white/5">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--nl-text-muted)] mb-8">Dados da Identidade Digital</h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--nl-text-muted)] px-1">Nome Completo do Portador</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="nl-input h-12 bg-black border-white/10 focus:border-[var(--nl-neon)]/50"
              placeholder="Ex: João Silva"
            />
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--nl-text-muted)] px-1">Credencial de Acesso Principle</span>
            <input
              disabled
              value={email}
              className="nl-input h-12 opacity-30 cursor-not-allowed border-white/5 bg-transparent"
              placeholder="contato@empresa.com"
            />
          </div>
        </div>
        <div className="flex justify-end mt-10 pt-8 border-t border-white/5">
          <button
            onClick={onSaveProfile}
            disabled={savingProfile}
            className="nl-button-primary min-w-[180px] h-12 rounded-xl text-[11px] font-black uppercase tracking-widest"
          >
            {savingProfile ? "Processando..." : "Sincronizar Perfil"}
          </button>
        </div>
      </section>

      <section className="nl-card-glass p-8 border-white/5">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--nl-text-muted)] mb-8">Criptografia e Segurança</h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--nl-text-muted)] px-1">Senha Estratégica Atual</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="nl-input h-12 bg-black border-white/10 focus:border-[var(--nl-neon)]/50"
            />
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--nl-text-muted)] px-1">Novo Código Secreto</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Sugerido: 8+ caracteres"
              className="nl-input h-12 bg-black border-white/10 focus:border-[var(--nl-neon)]/50"
            />
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-white/5 flex flex-wrap items-center justify-between gap-6">
          <button
            onClick={onChangePassword}
            disabled={savingPassword}
            className="nl-button-secondary border-white/10 hover:border-white/20 px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-white"
          >
            {savingPassword ? "Validando..." : "Redefinir Senha"}
          </button>
          <button
            onClick={onDeleteAccount}
            disabled={deleting}
            className="text-[10px] font-black text-red-500/60 hover:text-red-400 transition-all uppercase tracking-[0.2em] px-5 py-3 border border-red-500/10 rounded-xl hover:bg-red-500/5"
          >
            {deleting ? "Excluíndo Sistema..." : "Deletar Conta Permanentemente"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default Profile;
