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
      addToast("Nivel de detalhamento atualizado.", "success");
    } catch (error) {
      setDetailLevel(previous);
      addToast(getErrorMessage(error, "Falha ao salvar nivel de detalhamento."), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateName = async () => {
    if (!name.trim()) {
      addToast("Informe um nome valido.", "info");
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
      <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">Configuracoes</h1>

      <CompanyPersonalizationPanel companyId={selectedCompanyId} onToast={addToast} />

      <DashboardPersonalizationPanel companyId={selectedCompanyId} onToast={addToast} />

      <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Perfil</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-lime-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            placeholder="Nome"
          />
          <button
            onClick={handleUpdateName}
            disabled={saving}
            className="rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-bold text-zinc-900 disabled:opacity-50"
          >
            Salvar nome
          </button>
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Seguranca</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Senha atual"
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-lime-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nova senha"
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-lime-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>
        <button
          onClick={handlePasswordChange}
          disabled={saving}
          className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-bold text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Alterar senha
        </button>
      </section>

      <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Preferencias</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Tema atual: {theme === "dark" ? "Escuro" : "Claro"}</p>
          <button
            onClick={handleThemeToggle}
            disabled={saving}
            className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-bold text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            {theme === "dark" ? "Mudar para Claro" : "Mudar para Escuro"}
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Nivel de detalhamento da IA</p>
          <select
            value={detailLevel}
            onChange={(e) => handleDetailChange(e.target.value as DetailLevel)}
            disabled={saving}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-lime-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </section>

      <button
        onClick={handleLogout}
        className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  );
};

export default Settings;

