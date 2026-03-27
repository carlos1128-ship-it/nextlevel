import React from "react";
import type { UserNiche } from "../../types/domain";

export type CompanyStage = "INICIANTE" | "ESCALANDO" | "ENTERPRISE";

type NicheOption = {
  value: UserNiche;
  title: string;
  description: string;
  accentClassName: string;
  Icon: React.ComponentType<{ className?: string }>;
};

type NicheModalProps = {
  selectedNiche: UserNiche | null;
  selectedStage: CompanyStage;
  onSelectNiche: (value: UserNiche) => void;
  onSelectStage: (value: CompanyStage) => void;
  onConfirm: () => void;
  loading?: boolean;
};

const CommerceIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 7H20L18.5 19H5.5L4 7Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9 7V5.5C9 4.12 10.12 3 11.5 3H12.5C13.88 3 15 4.12 15 5.5V7" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const MedicalIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const ServicesIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 19L12 5L18 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.5 14H15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const EducationIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 8L12 4L20 8L12 12L4 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M7 10.5V15.5C7 16.88 9.24 18 12 18C14.76 18 17 16.88 17 15.5V10.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const GenericIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 8V12L14.5 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const nicheOptions: NicheOption[] = [
  {
    value: "ECOMMERCE",
    title: "e-Commerce",
    description: "Foco em catalogo, margem por produto e operacao multicanal.",
    accentClassName: "text-sky-300 border-sky-400/20 bg-sky-400/10",
    Icon: CommerceIcon,
  },
  {
    value: "MEDICINA",
    title: "Medicina",
    description: "Atendimento, consultas e jornada assistida com prioridade no topo.",
    accentClassName: "text-rose-300 border-rose-400/20 bg-rose-400/10",
    Icon: MedicalIcon,
  },
  {
    value: "SERVICOS",
    title: "Servicos",
    description: "Custos, projetos e entregas mais acessiveis desde o primeiro acesso.",
    accentClassName: "text-amber-300 border-amber-400/20 bg-amber-400/10",
    Icon: ServicesIcon,
  },
  {
    value: "EDUCACAO",
    title: "Educacao",
    description: "Fluxo orientado a alunos, agenda e acompanhamento continuo.",
    accentClassName: "text-violet-300 border-violet-400/20 bg-violet-400/10",
    Icon: EducationIcon,
  },
  {
    value: "OUTROS",
    title: "Outros",
    description: "Comece com uma estrutura flexivel e ajuste conforme sua operacao.",
    accentClassName: "text-emerald-300 border-emerald-400/20 bg-emerald-400/10",
    Icon: GenericIcon,
  },
];

const stageOptions: Array<{
  value: CompanyStage;
  title: string;
  description: string;
}> = [
  {
    value: "INICIANTE",
    title: "Iniciante",
    description: "Estrutura enxuta, foco em clareza, caixa e primeiros rituais de crescimento.",
  },
  {
    value: "ESCALANDO",
    title: "Escalando",
    description: "Operacao ganhando volume e precisando de mais velocidade sem perder margem.",
  },
  {
    value: "ENTERPRISE",
    title: "Enterprise",
    description: "Mais previsibilidade, times maiores e padroes mais consistentes de decisao.",
  },
];

const NicheModal = ({
  selectedNiche,
  selectedStage,
  onSelectNiche,
  onSelectStage,
  onConfirm,
  loading = false,
}: NicheModalProps) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,19,0.96),rgba(4,7,11,0.99))] shadow-[0_34px_140px_rgba(0,0,0,0.52)]">
        <div className="border-b border-white/10 px-6 py-6 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/75">
            Personalize sua experiencia
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.03em] text-white sm:text-4xl">
            Ajuste o painel ao contexto real da sua operacao
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
            Vamos priorizar atalhos, linguagem e leitura de oportunidades de acordo com seu nicho e momento da empresa.
          </p>
        </div>

        <div className="space-y-8 p-6 sm:p-8">
          <section>
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-xs font-black text-emerald-200">
                1
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Qual seu nicho?
                </p>
                <p className="text-sm text-zinc-400">
                  Isso reposiciona menus, atalhos e vocabulario do produto.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {nicheOptions.map((option) => {
                const isSelected = selectedNiche === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onSelectNiche(option.value)}
                    className={`rounded-[28px] border p-5 text-left transition duration-200 hover:-translate-y-1 ${
                      isSelected
                        ? "border-emerald-400/50 bg-emerald-400/10 shadow-[0_0_30px_rgba(16,185,129,0.12)]"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className={`inline-flex rounded-2xl border p-3 ${option.accentClassName}`}>
                      <option.Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-xl font-black tracking-tight text-white">{option.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-black text-zinc-200">
                2
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Nivel da empresa
                </p>
                <p className="text-sm text-zinc-400">
                  Vamos guardar isso para modular o onboarding e os proximos ajustes do painel.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {stageOptions.map((option) => {
                const isSelected = selectedStage === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onSelectStage(option.value)}
                    className={`rounded-[24px] border px-5 py-4 text-left transition ${
                      isSelected
                        ? "border-lime-400/40 bg-lime-400/10 shadow-[0_0_24px_rgba(163,230,53,0.08)]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <p className="text-base font-black tracking-tight text-white">{option.title}</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Nicho vai para o backend agora. O nivel fica salvo localmente por enquanto.
          </p>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!selectedNiche || loading}
            className="inline-flex items-center justify-center rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-zinc-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar e continuar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NicheModal;
