import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { BellRing, CheckCircle2, Lock, MessageCircle, Save, Send, ShieldCheck, TriangleAlert } from 'lucide-react';
import { api } from '../services/api';
import type { NotificationConfig } from '../services/api';

type Feedback = { type: 'success' | 'error' | 'info'; message: string } | null;

export const Notificacoes = () => {
    const [config, setConfig] = useState<NotificationConfig | null>(null);
    const [enabled, setEnabled] = useState(false);
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [minSeverity, setMinSeverity] = useState<'pre_alert' | 'critical'>('critical');
    const [preAlertThreshold, setPreAlertThreshold] = useState(60);
    const [criticalThreshold, setCriticalThreshold] = useState(80);
    const [cooldownMinutes, setCooldownMinutes] = useState(15);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [feedback, setFeedback] = useState<Feedback>(null);

    useEffect(() => {
        const loadConfig = async () => {
            const current = await api.getNotificationConfig();
            if (current) {
                setConfig(current);
                setEnabled(current.enabled);
                setRecipientName(current.recipientName || '');
                setMinSeverity(current.minSeverity);
                setPreAlertThreshold(Math.round(current.preAlertThreshold * 100));
                setCriticalThreshold(Math.round(current.criticalThreshold * 100));
                setCooldownMinutes(current.cooldownMinutes);
            }
            setLoading(false);
        };

        loadConfig();
    }, []);

    const canSendTest = useMemo(() => Boolean(config?.recipientPhoneMasked), [config]);

    const handleSave = async () => {
        setSaving(true);
        setFeedback(null);

        try {
            const saved = await api.saveNotificationConfig({
                enabled,
                recipientName,
                recipientPhone,
                minSeverity,
                preAlertThreshold: preAlertThreshold / 100,
                criticalThreshold: criticalThreshold / 100,
                cooldownMinutes,
            });
            setConfig(saved);
            setRecipientPhone('');
            setFeedback({ type: 'success', message: 'Configuracao salva com telefone protegido no banco seguro.' });
        } catch (error) {
            setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Falha ao salvar.' });
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setFeedback(null);

        try {
            const result = await api.sendNotificationTest();
            setFeedback({
                type: result.simulated ? 'info' : 'success',
                message: result.simulated
                    ? 'Teste registrado em modo simulacao. Configure Twilio no servidor para envio real.'
                    : 'Mensagem de teste enviada pelo WhatsApp.',
            });
        } catch (error) {
            setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Falha no teste.' });
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 grid place-items-center text-gray-400">
                Carregando configuracao segura...
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto pr-2">
            <div className="max-w-6xl mx-auto space-y-4 pb-4">
                <section className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary/15 border border-secondary/30 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Notificacoes WhatsApp</h2>
                            <p className="text-sm text-gray-400">Configure quem recebe alertas preventivos e criticos da planta.</p>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-4">
                    <div className="glass-panel p-5">
                        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Destinatario operacional</h3>
                                <p className="text-sm text-gray-400">O telefone e criptografado no backend e nunca volta aberto para o navegador.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEnabled((value) => !value)}
                                className={`relative h-8 w-14 rounded-full border transition-colors ${enabled ? 'bg-secondary/80 border-secondary' : 'bg-white/10 border-white/20'}`}
                                aria-label="Ativar notificacoes"
                            >
                                <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="space-y-2">
                                <span className="text-sm text-gray-300">Responsavel</span>
                                <input
                                    value={recipientName}
                                    onChange={(event) => setRecipientName(event.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-primary"
                                    placeholder="Ex: Samantha Operacoes"
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm text-gray-300">WhatsApp com pais e DDD</span>
                                <input
                                    value={recipientPhone}
                                    onChange={(event) => setRecipientPhone(event.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-primary"
                                    placeholder={config?.recipientPhoneMasked || '+5511912345678'}
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm text-gray-300">Severidade minima</span>
                                <select
                                    value={minSeverity}
                                    onChange={(event) => setMinSeverity(event.target.value as 'pre_alert' | 'critical')}
                                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-primary"
                                >
                                    <option value="critical">Somente critico</option>
                                    <option value="pre_alert">Pre-alerta e critico</option>
                                </select>
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm text-gray-300">Cooldown entre envios</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={1440}
                                    value={cooldownMinutes}
                                    onChange={(event) => setCooldownMinutes(Number(event.target.value))}
                                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-primary"
                                />
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <label className="space-y-2">
                                <span className="text-sm text-gray-300">Pre-alerta: {preAlertThreshold}%</span>
                                <input
                                    type="range"
                                    min={10}
                                    max={95}
                                    value={preAlertThreshold}
                                    onChange={(event) => setPreAlertThreshold(Number(event.target.value))}
                                    className="w-full accent-yellow-500"
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm text-gray-300">Critico: {criticalThreshold}%</span>
                                <input
                                    type="range"
                                    min={20}
                                    max={99}
                                    value={criticalThreshold}
                                    onChange={(event) => setCriticalThreshold(Number(event.target.value))}
                                    className="w-full accent-red-500"
                                />
                            </label>
                        </div>

                        {feedback && (
                            <div className={`mt-4 rounded-lg border px-3 py-2 text-sm ${feedback.type === 'success'
                                ? 'border-secondary/30 bg-secondary/10 text-secondary'
                                : feedback.type === 'error'
                                    ? 'border-danger/30 bg-danger/10 text-red-200'
                                    : 'border-primary/30 bg-primary/10 text-blue-200'
                                }`}>
                                {feedback.message}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3 mt-5">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Salvando...' : 'Salvar configuracao'}
                            </button>
                            <button
                                type="button"
                                onClick={handleTest}
                                disabled={testing || !canSendTest}
                                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                            >
                                <Send className="w-4 h-4" />
                                {testing ? 'Enviando...' : 'Enviar teste'}
                            </button>
                        </div>
                    </div>

                    <aside className="space-y-4">
                        <div className="glass-panel p-5">
                            <h3 className="text-lg font-semibold text-white mb-4">Status seguro</h3>
                            <div className="space-y-3 text-sm">
                                <StatusRow icon={<BellRing className="w-4 h-4" />} label="Notificacoes" value={config?.enabled ? 'Ativas' : 'Desativadas'} ok={Boolean(config?.enabled)} />
                                <StatusRow icon={<MessageCircle className="w-4 h-4" />} label="Twilio" value={config?.twilioConfigured ? 'Configurado' : 'Modo simulacao'} ok={Boolean(config?.twilioConfigured)} />
                                <StatusRow icon={<Lock className="w-4 h-4" />} label="Telefone" value={config?.recipientPhoneMasked || 'Nao configurado'} ok={Boolean(config?.recipientPhoneMasked)} />
                                <StatusRow icon={<ShieldCheck className="w-4 h-4" />} label="Banco" value="SQLite isolado" ok />
                                <StatusRow icon={<ShieldCheck className="w-4 h-4" />} label="Criptografia" value={config?.encryptionKeyConfigured ? 'Chave dedicada' : 'Chave dev'} ok={Boolean(config?.encryptionAtRest)} />
                            </div>
                        </div>

                        {!config?.twilioConfigured && (
                            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                                <div className="flex items-center gap-2 font-semibold mb-2">
                                    <TriangleAlert className="w-4 h-4" />
                                    Twilio ainda nao esta ativo
                                </div>
                                Configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_WHATSAPP_NUMBER` no backend para envio real.
                            </div>
                        )}
                    </aside>
                </section>
            </div>
        </div>
    );
};

const StatusRow = ({ icon, label, value, ok }: { icon: ReactNode; label: string; value: string; ok: boolean }) => (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-black/25 border border-white/10 px-3 py-2">
        <div className="flex items-center gap-2 text-gray-300">
            <span className={ok ? 'text-secondary' : 'text-yellow-400'}>{icon}</span>
            {label}
        </div>
        <div className="flex items-center gap-2 text-right text-white">
            {value}
            {ok && <CheckCircle2 className="w-4 h-4 text-secondary" />}
        </div>
    </div>
);
