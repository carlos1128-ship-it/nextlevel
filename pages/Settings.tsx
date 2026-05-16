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
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="nl-page-header">
        <p className="nl-page-eyebrow">Conta e operação</p>
        <h1 className="nl-page-title">Configurações</h1>
      </section>

      <CompanyPersonalizationPanel companyId={selectedCompanyId} onToast={addToast} />

      <DashboardPersonalizationPanel companyId={selectedCompanyId} onToast={addToast} />

      <section className="nl-card space-y-5 p-6">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Perfil</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="nl-input"
            placeholder="Nome"
          />
          <button
            onClick={handleUpdateName}
            disabled={saving}
            className="nl-button-primary disabled:opacity-50"
          >
            Salvar nome
          </button>
        </div>
      </section>

      <section className="nl-card space-y-5 p-6">
        <h2 className="text-lg font-bold text-zinc-100">Segurança</h2>
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
        <button
          onClick={handlePasswordChange}
          disabled={saving}
          className="nl-button-secondary disabled:opacity-50"
        >
          Alterar senha
        </button>
      </section>

      <section className="nl-card space-y-5 p-6">
        <h2 className="text-lg font-bold text-zinc-100">Preferências</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Tema atual: {theme === "dark" ? "Escuro" : "Claro"}</p>
          <button
            onClick={handleThemeToggle}
            disabled={saving}
            className="nl-button-secondary disabled:opacity-50"
          >
            {theme === "dark" ? "Mudar para Claro" : "Mudar para Escuro"}
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Nível de detalhamento da IA</p>
          <select
            value={detailLevel}
            onChange={(e) => handleDetailChange(e.target.value as DetailLevel)}
            disabled={saving}
            className="nl-input font-bold"
          >
            <option value="low">Baixo</option>
            <option value="medium">Médio</option>
            <option value="high">Alto</option>
          </select>
        </div>
      </section>

      <button
        onClick={handleLogout}
        className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  );
};

export default Settings;

