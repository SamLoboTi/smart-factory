import { KPICards } from '../components/KPICards';
import { OperationsChart } from '../components/OperationsChart';
import { RiskGauge } from '../components/RiskGauge';
import { AlertToast } from '../components/AlertToast';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AnimatePresence } from 'framer-motion';

export const Dashboard = () => {
    const [alert, setAlert] = useState<{ message: string; type: 'critical' | 'warning' } | null>(null);

    useEffect(() => {
        const checkRisks = async () => {
            try {
                // Checa KPIs para status geral
                const kpis = await api.getKPIs();
                if (kpis && kpis.status_geral === 'Crítico') {
                    setAlert({
                        message: 'KPIs indicam estado CRÍTICO da operação!',
                        type: 'critical'
                    });
                    return; // Prioridade para status geral
                }

                // Checa alertas específicos (ML Risk)
                const alerts = await api.getAlerts();
                if (alerts.risco_alto && alerts.risco_alto.length > 0) {
                    setAlert({
                        message: `Detectados ${alerts.risco_alto.length} dispositivos com alto risco de falha (ML).`,
                        type: 'warning'
                    });
                } else {
                    // Limpa se não houver nada crítico (opcional, mas bom UI)
                    // setAlert(null); // Descomente se quiser auto-dismiss quando resolver
                }

            } catch (e) {
                console.error("Erro ao verificar riscos:", e);
            }
        };

        const interval = setInterval(checkRisks, 5000); // Verifica a cada 5s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden relative">
            <AnimatePresence>
                {alert && (
                    <AlertToast
                        message={alert.message}
                        type={alert.type}
                        onClose={() => setAlert(null)}
                    />
                )}
            </AnimatePresence>

            {/* Center Content */}
            <div className="flex-[3] flex flex-col gap-4">
                <KPICards />
                <div className="flex-1 flex gap-4 min-h-0">
                    <OperationsChart />
                    <RiskGauge />
                </div>
            </div>
        </div>
    );
};
