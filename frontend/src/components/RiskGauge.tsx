import { XCircle, Gauge } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell } from 'recharts';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

const RADIAN = Math.PI / 180;
const data = [
    { name: 'Excellent', value: 20, color: '#15803d' }, // Dark Green
    { name: 'Good', value: 20, color: '#22c55e' }, // Light Green
    { name: 'Warning', value: 20, color: '#facc15' }, // Yellow
    { name: 'Alert', value: 20, color: '#f97316' }, // Orange
    { name: 'Critical', value: 20, color: '#ef4444' }, // Red
];

const needle = (value: number, data: any[], cx: number, cy: number, iR: number, oR: number, color: string) => {
    let total = 0;
    data.forEach((v) => {
        total += v.value;
    });
    const ang = 180.0 * (1 - value / total);
    const length = (iR + 2 * oR) / 3;
    const sin = Math.sin(-RADIAN * ang);
    const cos = Math.cos(-RADIAN * ang);
    const r = 3.5; // Reduced from 5 for a finer look
    const x0 = cx + 5; // Offset logic might need adjustment if logic was purely x0=cx. Actually original code had x0=cx+5? Wait.
    // Original: const x0 = cx + 5; const y0 = cy + 5; This seems like an offset bug in original or intentional drift?
    // Standard implementation usually centers at cx, cy. I will stick to existing logic but reduce r.
    const y0 = cy + 5;
    const xba = x0 + r * sin;
    const yba = y0 - r * cos;
    const xbb = x0 - r * sin;
    const ybb = y0 + r * cos;
    const xp = x0 + length * cos;
    const yp = y0 + length * sin;

    return [
        <circle cx={x0} cy={y0} r={r} fill={color} stroke="none" key="dot" />,
        <path d={`M${xba} ${yba}L${xbb} ${ybb} L${xp} ${yp} L${xba} ${yba}`} stroke="none" fill={color} key="needle" />,
    ];
};

export const RiskGauge = () => {
    const [riskInfo, setRiskInfo] = useState({ label: '--', value: 0 });

    useEffect(() => {
        const fetchStatus = async () => {
            // Em um app real, o backend retornaria o "risco" calculado.
            // Aqui vamos inferir baseado no status dos KPIs.
            const kpis = await api.getKPIs();
            if (kpis) {
                if (kpis.status_geral === 'Crítico') {
                    setRiskInfo({ label: 'CRÍTICO', value: 90 });
                } else if (kpis.status_geral === 'Alerta') {
                    setRiskInfo({ label: 'ALERTA', value: 50 });
                } else {
                    setRiskInfo({ label: 'NORMAL', value: 15 });
                }
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="glass-panel p-4 flex-1 flex flex-col"
        >
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-primary" />
                    <h3 className="text-white font-medium">Previsão de Risco</h3>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative min-h-[160px]">
                <PieChart width={300} height={160}>
                    <Pie
                        dataKey="value"
                        startAngle={180}
                        endAngle={0}
                        data={data}
                        cx={145}
                        cy={140}
                        innerRadius={80}
                        outerRadius={130}
                        fill="#8884d8"
                        stroke="none"
                        paddingAngle={2}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    {needle(riskInfo.value, data, 145, 140, 80, 130, '#ffffff')}
                </PieChart>

                <div className="text-center mt-2 relative z-10">
                    <p className="text-gray-400 text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">Status Atual</p>
                    <h4 className={`font-black text-4xl tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] ${riskInfo.label === 'CRÍTICO' ? 'text-red-500' :
                        riskInfo.label === 'ALERTA' ? 'text-yellow-400' : 'text-green-500'
                        }`}>{riskInfo.label}</h4>
                </div>
            </div>

            <div className="space-y-4 mt-6 px-2">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-danger flex items-center justify-center shrink-0 shadow-lg shadow-red-900/50">
                        <span className="text-sm font-bold text-white">1</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">Alerta: Alta Vibração</span>
                        <span className="text-xs text-gray-400">Detectado no Motor 3</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-900/50">
                        <XCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">Revisar: Manutenção</span>
                        <span className="text-xs text-gray-400">Preventiva Vencida</span>
                    </div>
                </div>
            </div>

        </motion.div>
    );
};
