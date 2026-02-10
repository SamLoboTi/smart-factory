import { motion } from 'framer-motion';
import { BarChart2, PieChart } from 'lucide-react';
import { KPICards } from '../components/KPICards';

export const PageKPIs = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col gap-6"
        >
            {/* Reusing existing KPI cards for summary */}
            <KPICards />

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                <div className="glass-panel p-6 flex flex-col">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <BarChart2 className="text-primary" /> Eficiência por Turno
                    </h3>
                    <div className="flex-1 flex items-end justify-between gap-2 px-4 pb-4">
                        {[65, 80, 45, 90, 75, 88, 92].map((h, i) => (
                            <div key={i} className="w-full bg-primary/20 rounded-t relative group h-full flex flex-col justify-end">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    className="w-full bg-primary relative cursor-pointer hover:bg-blue-400 transition-colors rounded-t"
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {h}%
                                    </div>
                                </motion.div>
                                <span className="text-xs text-gray-400 text-center mt-2">D-{i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel p-6">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <PieChart className="text-accent" /> Distribuição de Perdas
                    </h3>
                    <div className="flex items-center justify-center h-full">
                        <div className="text-gray-400 text-center">
                            <p className="mb-2">Gráfico de Rosca (Simulado)</p>
                            <div className="w-48 h-48 rounded-full border-[16px] border-primary border-r-danger border-b-accent rotate-45 mx-auto"></div>
                            <div className="flex gap-4 justify-center mt-6">
                                <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 bg-primary rounded-full"></div> Operacional</div>
                                <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 bg-danger rounded-full"></div> Mecânico</div>
                                <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 bg-accent rounded-full"></div> Elétrico</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
