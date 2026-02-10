import { BarChart2, Activity, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { api } from '../services/api';

export const KPICards = () => {
    const [metrics, setMetrics] = useState<any>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchMetrics = async () => {
        const params: any = {};
        if (startDate) params.start = startDate;
        if (endDate) params.end = endDate;

        const data = await api.getKPIs(params);
        if (data) {
            setMetrics(data);
        }
    };

    useEffect(() => {
        fetchMetrics(); // Busca inicial
        const interval = setInterval(fetchMetrics, 5000); // Polling a cada 5s
        return () => clearInterval(interval);
    }, [startDate, endDate]);

    const kpis = [
        {
            title: 'OEE',
            subtitle: 'Eficiência Global',
            value: metrics ? `${metrics.oee}%` : '--%',
            trend: metrics ? (metrics.oee > 60 ? '+ OK' : '- Baixo') : '--',
            status: metrics && metrics.oee > 60 ? 'success' : 'danger',
            icon: BarChart2,
            color: 'text-blue-400'
        },
        {
            title: 'MTBF',
            subtitle: 'Tempo Médio Entre Falhas',
            value: metrics ? `${metrics.mtbf} min` : '--',
            trend: 'Estável',
            status: 'success',
            icon: Activity,
            color: 'text-emerald-400'
        },
        {
            title: 'MTTR',
            subtitle: 'Tempo Médio Reparo',
            value: metrics ? `${metrics.mttr} min` : '--',
            trend: '- Otimizado',
            status: 'success',
            icon: Clock,
            color: 'text-amber-400'
        }
    ];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-end items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/10 w-fit self-end">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                />
                <span className="text-gray-500">-</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                />
            </div>

            <div className="grid grid-cols-3 gap-4 h-32">
                {kpis.map((kpi, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-panel p-4 flex flex-col justify-between relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start z-10">
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-gray-400 font-medium text-sm">{kpi.title}</h3>
                                    <span className="text-[10px] text-gray-500 font-light tracking-wide uppercase">{kpi.subtitle}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</span>
                                    {kpi.trend.startsWith('+') ? (
                                        <div className="flex items-center text-success">
                                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-current"></div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-danger">
                                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-current"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={`p-2 rounded-lg bg-white/5 ${kpi.color}`}>
                                <kpi.icon className="w-5 h-5" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
