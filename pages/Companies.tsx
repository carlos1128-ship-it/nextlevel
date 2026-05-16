import React, { useEffect, useMemo, useState } from "react";
import { PlusIcon, TrashIcon, XIcon } from "../components/icons";
import { useToast } from "../components/Toast";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { getErrorMessage } from "../src/services/error";
import { createCompany, deleteCompany, getCompanies } from "../src/services/endpoints";
import type { Company } from "../src/types/domain";
import { useAuth } from "../App";

const getCompanyId = (company: Partial<Company> | null | undefined) =>
  company?.id || company?._id || null;

const formatDocument = (value: string) => value.replace(/\D/g, "").slice(0, 14);

const formatOpenedAge = (openedAt?: string) => {
  if (!openedAt) return "Não informado";
  const opened = new Date(openedAt);
  if (Number.isNaN(opened.getTime())) return "Não informado";

  const now = new Date();
  const diffMonths =
    (now.getFullYear() - opened.getFullYear()) * 12 +
    (now.getMonth() - opened.getMonth());

  if (diffMonths <= 0) return "Menos de 1 mês";
  if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? "mês" : "meses"}`;

  const years = Math.floor(diffMonths / 12);
  const months = diffMonths % 12;
  return `${years} ${years === 1 ? "ano" : "anos"}${months ? ` e ${months} ${months === 1 ? "mês" : "meses"}` : ""}`;
};

const Companies = () => {
  const { addToast } = useToast();
  const { selectedCompanyId, setSelectedCompanyId } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState({
    name: "",
    sector: "",
    segment: "",
    document: "",
    openedAt: "",
    description: "",
  });
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null);

  const loadCompanies = async () => {
    setLoadingPage(true);
    setLoadError(null);
    try {
      const data = await getCompanies();
      const list = (Array.isArray(data) ? data : []).filter(
        (company): company is Company => Boolean(getCompanyId(company))
      );
      setCompanies(list);

      if (!list.length) {
        setSelectedCompanyId(null);
        return list;
      }

      const activeExists = list.some((company) => getCompanyId(company) === selectedCompanyId);
      if (!activeExists) {
        setSelectedCompanyId(getCompanyId(list[0]));
      }
      return list;
    } catch (error) {
      setCompanies([]);
      const message = getErrorMessage(error, "Não foi possível carregar as empresas.");
      setLoadError(message);
      addToast(message, "error");
      return [];
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    void loadCompanies();
  }, []);

  const onChangeForm = (field: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === "document" ? formatDocument(value) : value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      sector: "",
      segment: "",
      document: "",
      openedAt: "",
      description: "",
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      addToast("Nome da empresa e obrigatorio.", "info");
      return;
    }
    if (!form.sector.trim() && !form.segment.trim()) {
      addToast("Informe pelo menos setor ou segmento.", "info");
      return;
    }
    if (!form.document.trim()) {
      addToast("Informe o CNPJ ou CPF da empresa.", "info");
      return;
    }
    if (!form.openedAt) {
      addToast("Informe desde quando a empresa está aberta.", "info");
      return;
    }
    if (!form.description.trim()) {
      addToast("Adicione uma descrição curta da empresa.", "info");
      return;
    }

    try {
      setLoadingSubmit(true);
      const created = await createCompany({
        name: form.name.trim(),
        sector: form.sector.trim() || undefined,
        segment: form.segment.trim() || undefined,
        document: form.document.trim(),
        openedAt: form.openedAt,
        description: form.description.trim(),
      });
      const createdCompanyId = getCompanyId(created);
      if (!createdCompanyId) {
        throw new Error("Empresa criada sem ID no retorno da API.");
      }

      setSelectedCompanyId(createdCompanyId);
      resetForm();
      setShowForm(false);
      await loadCompanies();
      window.dispatchEvent(new Event("companies:updated"));
      addToast("Empresa criada com sucesso.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível criar a empresa."), "error");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const selectCompany = (companyId: string | null) => {
    if (!companyId) return;
    setSelectedCompanyId(companyId);
    addToast("Empresa ativa atualizada.", "success");
  };

  const askDeleteCompany = (company: Company) => {
    setCompanyToDelete(company);
  };

  const handleDeleteCompany = async () => {
    const targetId = getCompanyId(companyToDelete);
    if (!companyToDelete || !targetId) return;

    const remainingCompanies = companies.filter((company) => getCompanyId(company) !== targetId);
    const nextSelectedCompanyId =
      selectedCompanyId === targetId ? getCompanyId(remainingCompanies[0]) : selectedCompanyId;

    try {
      setDeletingCompanyId(targetId);
      setCompanies(remainingCompanies);
      setCompanyToDelete(null);
      setSelectedCompanyId(nextSelectedCompanyId || null);
      await deleteCompany(targetId);
      window.dispatchEvent(new Event("companies:updated"));
      addToast("Empresa removida com sucesso.", "success");
    } catch (error) {
      setCompanies(companies);
      if (selectedCompanyId) {
        setSelectedCompanyId(selectedCompanyId);
      }
      addToast(getErrorMessage(error, "Não foi possível remover a empresa."), "error");
      await loadCompanies();
    } finally {
      setDeletingCompanyId(null);
    }
  };

  const summaryText = useMemo(() => {
    if (!companies.length) return "Cadastre a primeira empresa para liberar os módulos.";
    return `${companies.length} empresa${companies.length === 1 ? "" : "s"} vinculada${companies.length === 1 ? "" : "s"} ao seu ambiente.`;
  }, [companies.length]);

  return (
    <div className="nl-page">
      <div className="nl-page-header">
        <div className="nl-page-header__meta">
          <p className="nl-eyebrow">Gestão de Ambiente</p>
          <h1 className="nl-page-title">Cerebros Empresariais</h1>
          <p className="nl-page-subtitle">{summaryText}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="nl-button-primary"
        >
          {showForm ? "Fechar Form" : "Nova Empresa"}
        </button>
      </div>

      {showForm ? (
        <section className="nl-card p-6 md:p-8 mb-8 border-[var(--nl-neon)]/30">
          <h2 className="text-[14px] font-bold uppercase tracking-[0.12em] text-[var(--nl-text-muted)] mb-6">Informações da Nova Operação</h2>
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--nl-text-muted)] px-1">Nome Fantasia</span>
              <input
                value={form.name}
                onChange={(e) => onChangeForm("name", e.target.value)}
                placeholder="Ex: Next Level Shop"
                className="nl-input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--nl-text-muted)] px-1">Setor</span>
              <input
                value={form.sector}
                onChange={(e) => onChangeForm("sector", e.target.value)}
                placeholder="Varejo, SaaS..."
                className="nl-input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--nl-text-muted)] px-1">Documento (CNPJ/CPF)</span>
              <input
                value={form.document}
                onChange={(e) => onChangeForm("document", e.target.value)}
                placeholder="00.000.000/0001-00"
                className="nl-input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--nl-text-muted)] px-1">Fundada em</span>
              <input
                type="date"
                value={form.openedAt}
                onChange={(e) => onChangeForm("openedAt", e.target.value)}
                className="nl-input"
              />
            </div>
            <div className="flex flex-col gap-1.5 lg:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--nl-text-muted)] px-1">Descrição Breve</span>
              <input
                value={form.description}
                onChange={(e) => onChangeForm("description", e.target.value)}
                placeholder="Ex: E-commerce de moda masculina..."
                className="nl-input"
              />
            </div>
            <div className="flex flex-col justify-end">
              <button
                type="submit"
                disabled={loadingSubmit}
                className="nl-button-primary w-full"
              >
                {loadingSubmit ? "Processando..." : "Subir Empresa"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {loadingPage ? (
        <div className="py-20 flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--nl-neon)] border-t-transparent" />
        </div>
      ) : loadError ? (
        <section className="nl-card p-10 text-center border-red-900/30">
          <h3 className="text-xl font-bold text-red-200">Falha ao carregar empresas</h3>
          <p className="text-sm text-[var(--nl-text-secondary)] mt-2">{loadError}</p>
          <button onClick={() => void loadCompanies()} className="nl-button-secondary mt-6">Tentar novamente</button>
        </section>
      ) : companies.length === 0 ? (
        <section className="nl-card p-20 text-center border-dashed">
          <p className="text-xl font-bold text-[var(--nl-text-muted)]">Ambiente Vazio</p>
          <p className="text-sm text-[var(--nl-text-secondary)] mt-1">Conecte sua primeira empresa para ativar a inteligência.</p>
          <button onClick={() => setShowForm(true)} className="nl-button-primary mt-8">Começar Agora</button>
        </section>
      ) : (
        <section className="nl-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="nl-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Atuação</th>
                  <th>Documento / Tempo</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(companies) ? companies : []).map((company) => {
                  const isSelected = getCompanyId(company) === selectedCompanyId;
                  return (
                    <tr key={getCompanyId(company) || company.name} className={isSelected ? "bg-[rgba(182,255,0,0.02)]" : ""}>
                      <td>
                        <div className="font-bold text-[var(--nl-text-primary)]">{company.name || "-"}</div>
                        <p className="text-[11px] text-[var(--nl-text-muted)] mt-0.5 max-w-[200px] truncate">{company.description || "Sem descrição"}</p>
                      </td>
                      <td className="text-[13px] text-[var(--nl-text-secondary)]">
                        {[company.sector, company.segment].filter(Boolean).join(" · ") || "Indefinido"}
                      </td>
                      <td>
                        <div className="text-[13px] text-[var(--nl-text-primary)]">{company.document || "—"}</div>
                        <p className="text-[11px] text-[var(--nl-text-muted)] mt-0.5">{formatOpenedAge(company.openedAt)}</p>
                      </td>
                      <td>
                        <span className={`nl-badge-${isSelected ? "success" : "muted"}`}>
                          {isSelected ? "Ativa" : "Disponível"}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          {!isSelected && (
                            <button
                              type="button"
                              onClick={() => selectCompany(getCompanyId(company))}
                              className="nl-button-secondary py-1.5 px-3 text-xs"
                            >
                              Focar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => askDeleteCompany(company)}
                            disabled={deletingCompanyId === getCompanyId(company)}
                            className="p-2 rounded-lg border border-red-900/30 hover:bg-red-950/20 transition text-red-400"
                            title="Remover"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {companyToDelete ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="w-full max-w-md nl-card border-red-900/30 p-6 md:p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-red-950/30 flex items-center justify-center mb-6">
                <TrashIcon className="h-8 w-8 text-red-500" />
              </div>
              <p className="nl-eyebrow text-red-400">Ação Irreversível</p>
              <h2 className="text-xl font-black text-[var(--nl-text-primary)] mt-2">Remover Operação?</h2>
              <p className="text-sm text-[var(--nl-text-secondary)] mt-4 leading-relaxed">
                Você está prestes a excluir permanentemente <span className="text-[var(--nl-text-primary)] font-bold">{companyToDelete.name}</span>. Todos os dados de vendas, produtos e inteligência associados serão perdidos.
              </p>

              <div className="grid grid-cols-2 gap-3 w-full mt-8">
                <button
                  type="button"
                  onClick={() => setCompanyToDelete(null)}
                  className="nl-button-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCompany}
                  disabled={Boolean(deletingCompanyId)}
                  className="nl-button-danger"
                >
                  {deletingCompanyId ? "Excluindo..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Companies;
