import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

export const Paradas = () => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 p-6 glass-panel overflow-y-auto"
        >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <AlertCircle className="text-danger" />
                Histórico de Paradas
            </h2>

            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-surface/40 p-4 rounded-lg border border-white/5 hover:bg-surface/60 transition-colors">
                        <div className="flex items-center gap-4 mb-2 md:mb-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 1 ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'}`}>
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Falha no Motor Principal - Linha {i}</h3>
                                <p className="text-sm text-gray-400">Máquina CNC 0{i + 2}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-gray-300">
                                <Clock size={16} />
                                <span>{i * 45} min de parada</span>
                            </div>
                            <button className="px-4 py-2 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm font-medium">
                                Ver Detalhes
                            </button>
                        </div>
                    </div>
                ))}

                {/* Completed */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-surface/20 p-4 rounded-lg border border-white/5 opacity-70">
                    <div className="flex items-center gap-4 mb-2 md:mb-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-success/20 text-success">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-300">Manutenção Preventiva Concluída</h3>
                            <p className="text-sm text-gray-500">Esteira 01</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Clock size={16} />
                            <span>120 min</span>
                        </div>
                        <span className="text-success text-sm font-medium flex items-center gap-1">
                            Resolvido <CheckCircle size={14} />
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
