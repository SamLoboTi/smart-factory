import { Thermometer, Activity, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export const Sidebar = () => {
    return (
        <aside className="w-80 flex flex-col gap-4 h-full">
            {/* Equipment Card */}
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="glass-panel p-4"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        Equipamentos
                        <div className="w-2 h-2 rounded-full bg-success translate-y-[1px]"></div>
                    </h2>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                    </div>
                </div>

                <div className="bg-surface/50 rounded-lg p-3 mb-4 border border-white/5">
                    <select className="w-full bg-transparent text-white text-sm outline-none cursor-pointer">
                        <option>Linha 3 - Máquina 7</option>
                        <option>Linha 3 - Máquina 8</option>
                    </select>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                        <span className="text-gray-400 text-sm flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-primary" /> Temperatura
                        </span>
                        <span className="text-xl font-bold font-mono text-white">78.6 <span className="text-sm text-gray-500">°C</span></span>
                    </div>
                    <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                        <span className="text-gray-400 text-sm flex items-center gap-2">
                            <Activity className="w-4 h-4 text-accent" /> Vibração
                        </span>
                        <span className="text-xl font-bold font-mono text-white">2.8 <span className="text-sm text-gray-500">g</span></span>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between bg-success/10 border border-success/20 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-300">Status</span>
                    <div className="flex items-center gap-2 text-success font-bold tracking-wider">
                        RODANDO
                        <CheckCircle className="w-5 h-5 fill-success text-black" />
                    </div>
                </div>
            </motion.div>

            {/* Events Card */}
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-panel p-4 flex-1 overflow-hidden"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-semibold">Eventos Recentes</h2>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                    </div>
                </div>

                <div className="space-y-3">
                    {[
                        { time: '08:42', title: 'Parada Não Planejada', type: 'error' },
                        { time: 'Ontem', title: 'Manutenção Concluída', type: 'success' },
                        { time: 'Ontem', title: 'Alerta de Vibração', type: 'warning' },
                    ].map((event, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border-l-2 border-transparent hover:border-primary cursor-pointer group">
                            <div className={`w-2 h-2 rounded-full ${event.type === 'error' ? 'bg-danger shadow-glow-danger' : event.type === 'warning' ? 'bg-accent' : 'bg-success'}`}></div>
                            <div>
                                <p className={`text-xs font-bold ${event.type === 'error' ? 'text-white' : 'text-gray-400'}`}>{event.time}</p>
                                <p className="text-sm text-gray-200 group-hover:text-white transition-colors">{event.title}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </aside>
    );
};
