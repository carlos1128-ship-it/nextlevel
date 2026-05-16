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
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="nl-page-header">
        <p className="nl-page-eyebrow">Conta</p>
        <h1 className="nl-page-title">Perfil</h1>
      </section>

      <section className="nl-card p-6">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-lime-300 text-2xl font-black text-zinc-900">
              {avatarLabel}
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-100">{name || username || "Usuário"}</p>
              <p className="text-sm text-zinc-400">{email || "E-mail não informado"}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-zinc-500">Empresas</p>
            <p className="text-2xl font-black text-lime-500">{companyCount}</p>
          </div>
        </div>
      </section>

      <section className="nl-card p-6">
        <h2 className="mb-4 text-lg font-bold text-zinc-100">Dados da conta</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="nl-label">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="nl-input mt-1"
            />
          </div>
          <div>
            <label className="nl-label">E-mail</label>
            <input
              disabled
              value={email}
              className="nl-input mt-1 opacity-70"
            />
          </div>
        </div>
        <button
          onClick={onSaveProfile}
          disabled={savingProfile}
          className="nl-button-primary mt-4 disabled:opacity-50"
        >
          {savingProfile ? "Salvando..." : "Salvar perfil"}
        </button>
      </section>

      <section className="nl-card p-6">
        <h2 className="mb-4 text-lg font-bold text-zinc-100">Segurança</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Senha atual"
            className="nl-input"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nova senha"
            className="nl-input"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={onChangePassword}
            disabled={savingPassword}
            className="nl-button-secondary disabled:opacity-50"
          >
            {savingPassword ? "Atualizando..." : "Alterar senha"}
          </button>
          <button
            onClick={onDeleteAccount}
            disabled={deleting}
            className="rounded-2xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-500 disabled:opacity-50"
          >
            {deleting ? "Excluindo..." : "Excluir conta"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default Profile;
