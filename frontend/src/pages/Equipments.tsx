import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

export const Equipments = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 p-6 glass-panel overflow-y-auto"
        >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Settings className="text-primary" />
                Gestão de Equipamentos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Mock Equipment Cards */}
                {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="bg-surface/50 p-4 rounded-xl border border-white/5 hover:border-primary/50 transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                M{item}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${item === 3 ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'}`}>
                                {item === 3 ? 'PARADO' : 'RODANDO'}
                            </span>
                        </div>
                        <h3 className="text-white font-semibold mb-1">Máquina CNC 0{item}</h3>
                        <p className="text-gray-400 text-sm mb-4">Linha de Montagem A</p>

                        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-white/5 pt-3">
                            <span>OEE: <span className="text-white font-mono">8{item}%</span></span>
                            <span>Temp: <span className="text-white font-mono">6{item}°C</span></span>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
