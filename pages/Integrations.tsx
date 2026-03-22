import React, { useEffect, useMemo, useState } from 'react';
import { LightbulbIcon } from '../components/icons';
import { useAuth } from '../App';
import { useToast } from '../components/Toast';
import {
  connectIntegration,
  getIntegrationDiagnostic,
  getIntegrationStatuses,
} from '../src/services/endpoints';
import type {
  IntegrationDiagnostic,
  IntegrationProvider,
  IntegrationStatus,
} from '../src/types/domain';

const PROVIDERS: Record<
  IntegrationProvider,
  { name: string; description: string; logo: string; hint: string; diagnosticKey: string }
> = {
  WHATSAPP: {
    name: 'WhatsApp Business',
    description: 'Envie mensagens e templates via Cloud API.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/2044px-WhatsApp.svg.png',
    hint: 'Cole apenas o Access Token. O Phone Number ID e o WABA ID serao descobertos automaticamente.',
    diagnosticKey: 'meta',
  },
  INSTAGRAM: {
    name: 'Instagram',
    description: 'Capture DMs e mencoes para engajar clientes.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/512px-Instagram_logo_2016.svg.png',
    hint: 'Use o instagram_business_account_id e a token da Graph API.',
    diagnosticKey: 'instagram',
  },
  MERCADOLIVRE: {
    name: 'Mercado Livre',
    description: 'Receba notificacoes de vendas e mensagens.',
    logo: 'https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/5.21.2/mercadolibre/logo__large_plus.png',
    hint: 'Use o seller_id da conta e a access token do app Mercado Livre.',
    diagnosticKey: 'mercadolivre',
  },
};

type StatusMap = Record<IntegrationProvider, IntegrationStatus>;
type DiagnosticMap = Partial<Record<IntegrationProvider, IntegrationDiagnostic>>;

const emptyStatus = (provider: IntegrationProvider): IntegrationStatus => ({
  provider,
  status: 'disconnected',
  connected: false,
  externalId: null,
  updatedAt: null,
});

const buildEmptyMap = (): StatusMap => ({
  WHATSAPP: emptyStatus('WHATSAPP'),
  INSTAGRAM: emptyStatus('INSTAGRAM'),
  MERCADOLIVRE: emptyStatus('MERCADOLIVRE'),
});

function formatDiagnosticMessage(provider: IntegrationProvider, diagnostic?: IntegrationDiagnostic | null) {
  if (!diagnostic) return null;

  const providerName = PROVIDERS[provider].name;
  if (diagnostic.status === 'ACTIVE') {
    return `✅ Conexao Ativa: Recebemos dados do ${providerName} em ${formatRelative(diagnostic.lastEventReceived)}.`;
  }
  if (diagnostic.status === 'DORMANT') {
    return `⚠️ Atencao: Nao recebemos novos dados do ${providerName} ha mais de uma hora. Verifique se ha atividade em sua conta.`;
  }
  return `❌ Conexao Inativa: Verifique sua URL de Webhook no painel da Meta ou entre em contato com o suporte.`;
}

function formatRelative(value: string | null) {
  if (!value) return 'momento desconhecido';
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `ha ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
  const diffHours = Math.round(diffMinutes / 60);
  return `ha ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
}

const IntegrationCard = ({
  provider,
  status,
  diagnostic,
  onConnect,
  onVerify,
  disabled,
  checking,
}: {
  provider: IntegrationProvider;
  status: IntegrationStatus;
  diagnostic?: IntegrationDiagnostic | null;
  onConnect: (provider: IntegrationProvider) => void;
  onVerify: (provider: IntegrationProvider) => void;
  disabled: boolean;
  checking: boolean;
}) => {
  const card = PROVIDERS[provider];
  const badgeClass = status.connected
    ? 'bg-lime-400/10 text-lime-400 border border-lime-400/30'
    : 'bg-zinc-800 text-zinc-300 border border-zinc-700';
  const diagnosticMessage = formatDiagnosticMessage(provider, diagnostic);
  const diagnosticClass =
    diagnostic?.status === 'ACTIVE'
      ? 'border-lime-400/30 bg-lime-400/5 text-lime-300'
      : diagnostic?.status === 'DORMANT'
        ? 'border-amber-400/30 bg-amber-400/5 text-amber-200'
        : 'border-red-500/30 bg-red-500/5 text-red-200';

  return (
    <article className="rounded-2xl border border-zinc-800 bg-[#0f0f0f] p-6 shadow-2xl transition-all duration-200 hover:-translate-y-1 hover:border-[#C5FF00]/40">
      <div className="flex items-center gap-3">
        <img src={card.logo} alt={`${card.name} logo`} className="h-12 w-12 rounded-md bg-white/5 p-1 object-contain" />
        <div className="flex-1">
          <h2 className="text-xl font-bold tracking-tight">{card.name}</h2>
          <p className="text-sm text-zinc-500">{card.description}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
          {status.connected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      <div className="mt-4 space-y-1 text-sm text-zinc-400">
        <p>
          <span className="text-zinc-500">External ID:</span>{' '}
          {status.externalId || '—'}
        </p>
        <p>
          <span className="text-zinc-500">Atualizado:</span>{' '}
          {status.updatedAt ? new Date(status.updatedAt).toLocaleString('pt-BR') : '—'}
        </p>
      </div>

      {diagnosticMessage ? (
        <div className={`mt-4 rounded-xl border p-3 text-sm ${diagnosticClass}`}>
          {diagnosticMessage}
        </div>
      ) : null}

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onConnect(provider)}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            disabled
              ? 'cursor-not-allowed bg-zinc-800 text-zinc-500'
              : 'bg-[#C5FF00] text-black hover:opacity-90'
          }`}
        >
          {status.connected ? 'Gerenciar credenciais' : 'Conectar'}
        </button>
        <button
          type="button"
          disabled={disabled || checking}
          onClick={() => onVerify(provider)}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-lime-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checking ? 'Verificando...' : 'Verificar conexao'}
        </button>
      </div>
    </article>
  );
};

const Integrations = () => {
  const { selectedCompanyId } = useAuth();
  const { addToast } = useToast();
  const [statuses, setStatuses] = useState<StatusMap>(buildEmptyMap);
  const [diagnostics, setDiagnostics] = useState<DiagnosticMap>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkingProvider, setCheckingProvider] = useState<IntegrationProvider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState<IntegrationProvider | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [externalId, setExternalId] = useState('');

  const hasCompany = Boolean(selectedCompanyId);

  const loadStatuses = async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const data = await getIntegrationStatuses(selectedCompanyId);
      const next = buildEmptyMap();
      data.forEach((item) => {
        next[item.provider] = {
          ...emptyStatus(item.provider),
          ...item,
          updatedAt: item.updatedAt || item['updated_at'] || null,
        };
      });
      setStatuses(next);
    } catch {
      addToast('Nao foi possivel carregar o status das integracoes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStatuses();
  }, [selectedCompanyId]);

  const handleOpenModal = (provider: IntegrationProvider) => {
    setActiveProvider(provider);
    setExternalId(statuses[provider]?.externalId || '');
    setAccessToken('');
    setIsModalOpen(true);
  };

  const handleVerify = async (provider: IntegrationProvider) => {
    if (!selectedCompanyId) {
      addToast('Selecione uma empresa para verificar a conexao.', 'info');
      return;
    }

    setCheckingProvider(provider);
    try {
      const diagnostic = await getIntegrationDiagnostic(PROVIDERS[provider].diagnosticKey, selectedCompanyId);
      setDiagnostics((current) => ({ ...current, [provider]: diagnostic }));
      addToast('Diagnostico atualizado.', 'success');
    } catch {
      addToast('Falha ao verificar a conexao.', 'error');
    } finally {
      setCheckingProvider(null);
    }
  };

  const handleSave = async () => {
    if (!selectedCompanyId || !activeProvider) {
      addToast('Selecione uma empresa para conectar', 'error');
      return;
    }

    if (!accessToken.trim()) {
      addToast('Preencha o Access Token', 'error');
      return;
    }

    if (activeProvider !== 'WHATSAPP' && !externalId.trim()) {
      addToast('Preencha o External ID', 'error');
      return;
    }

    setSaving(true);
    try {
      await connectIntegration(selectedCompanyId, {
        provider: activeProvider,
        externalId: activeProvider === 'WHATSAPP' ? undefined : externalId.trim(),
        accessToken: accessToken.trim(),
        status: 'connected',
      });
      addToast('Integracao salva com sucesso', 'success');
      setIsModalOpen(false);
      await loadStatuses();
      await handleVerify(activeProvider);
    } catch {
      addToast('Falha ao salvar integracao', 'error');
    } finally {
      setSaving(false);
    }
  };

  const modalTitle = useMemo(
    () => (activeProvider ? `Conectar ${PROVIDERS[activeProvider].name}` : ''),
    [activeProvider],
  );

  return (
    <main className="space-y-6">
      <section>
        <h1 className="mb-2 text-3xl font-bold">Integracoes</h1>
        <p className="text-zinc-500">
          Conecte canais externos para ingestao, disparo e diagnostico de webhooks.
        </p>
      </section>

      {!hasCompany && (
        <section className="rounded-xl border border-orange-400/30 bg-orange-500/5 p-4 text-sm text-orange-200">
          Selecione ou crie uma empresa para habilitar as integracoes.
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.keys(PROVIDERS).map((key) => {
          const provider = key as IntegrationProvider;
          const status = statuses[provider] || emptyStatus(provider);
          return (
            <IntegrationCard
              key={provider}
              provider={provider}
              status={status}
              diagnostic={diagnostics[provider]}
              onConnect={handleOpenModal}
              onVerify={handleVerify}
              disabled={!hasCompany || loading}
              checking={checkingProvider === provider}
            />
          );
        })}
      </section>

      <section className="mt-6 flex items-center gap-4 rounded-lg border border-dashed border-zinc-800 bg-[#0f0f0f] p-4">
        <LightbulbIcon className="h-8 w-8 text-[#C5FF00]" />
        <p className="text-sm text-zinc-400">
          Dica: no WhatsApp basta o token. O backend consulta a Meta em background e salva
          automaticamente o <span className="font-semibold">Phone Number ID</span> e o{' '}
          <span className="font-semibold">WABA ID</span>.
        </p>
      </section>

      {isModalOpen && activeProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <section className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-[#0b0b0b] p-6 shadow-2xl" aria-label={modalTitle}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Integracao</p>
                <h2 className="mt-1 text-2xl font-bold">{modalTitle}</h2>
                <p className="mt-2 text-sm text-zinc-500">{PROVIDERS[activeProvider].hint}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-sm text-zinc-400 transition hover:text-white"
                aria-label="Fechar modal de integracao"
              >
                fechar
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-zinc-400">
                  External ID {activeProvider === 'WHATSAPP' ? '(opcional)' : ''}
                </label>
                <input
                  value={externalId}
                  onChange={(e) => setExternalId(e.target.value)}
                  placeholder={
                    activeProvider === 'WHATSAPP'
                      ? 'Opcional no WhatsApp'
                      : 'phone_number_id / seller_id / instagram_business_account_id'
                  }
                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-[#C5FF00] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400">Access Token</label>
                <textarea
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Cole aqui o token de acesso"
                  className="mt-2 min-h-[90px] w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-[#C5FF00] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  saving
                    ? 'cursor-not-allowed bg-zinc-800 text-zinc-500'
                    : 'bg-[#C5FF00] text-black hover:opacity-90'
                }`}
              >
                {saving ? 'Salvando...' : 'Salvar integracao'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default Integrations;
