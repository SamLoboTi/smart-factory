import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const OperationsChart = () => {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const readings = await api.getLatestReadings();
            // Recharts expects array. Reverse to show chronological order left-to-right if API returns DESC
            const chartData = readings.slice(0, 20).reverse().map(r => ({
                time: new Date(r.timestamp).toLocaleTimeString('pt-BR', { hour12: false }),
                temp: r.temperatura,
                vib: r.vibracao
            }));
            setData(chartData);
        };

        fetchData();
        const interval = setInterval(fetchData, 2000); // Atualiza a cada 2s
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="glass-panel p-4 flex-[2] flex flex-col"
        >
            <h3 className="text-white font-semibold mb-4">Monitoramento em Tempo Real</h3>
            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="#94a3b8"
                            tick={{ fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke="#ef4444"
                            domain={[40, 110]}
                            tick={{ fontSize: 12, fill: '#ef4444' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#3b82f6"
                            domain={[0, 5]}
                            tick={{ fontSize: 12, fill: '#3b82f6' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="temp"
                            name="Temperatura (°C)"
                            stroke="#ef4444"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 0, fill: '#ef4444' }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="vib"
                            name="Vibração (mm/s)"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 0, fill: '#3b82f6' }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};
