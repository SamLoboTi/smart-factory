import { motion } from 'framer-motion';

export const StatusFooter = () => {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-panel p-3 flex items-center gap-4 mt-auto overflow-x-auto scrollbar-hide"
        >
            <h3 className="text-sm font-medium text-white px-2 whitespace-nowrap">Status dos Equipamentos</h3>

            <div className="flex gap-2">
                <div className="px-4 py-1.5 rounded bg-success/20 border border-success/30 flex items-center gap-2 whitespace-nowrap">
                    <div className="w-2 h-2 rounded-full bg-success shadow-glow-success animate-pulse"></div>
                    <span className="text-xs font-bold text-white">RODANDO</span>
                    <span className="text-xs font-bold text-white ml-2 bg-black/20 px-1.5 rounded">12</span>
                </div>

                <div className="px-4 py-1.5 rounded bg-danger/20 border border-danger/30 flex items-center gap-2 whitespace-nowrap">
                    <div className="w-2 h-2 rounded-full bg-danger shadow-glow-danger"></div>
                    <span className="text-xs font-bold text-white">PARADA NÃO PLANEJADA</span>
                    <span className="text-xs font-bold text-white ml-2 bg-black/20 px-1.5 rounded">2</span>
                </div>

                <div className="px-4 py-1.5 rounded bg-red-500/20 border border-red-500/30 flex items-center gap-2 whitespace-nowrap">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-xs font-bold text-white">PARADA PLANEJADA</span>
                    <span className="text-xs font-bold text-white ml-2 bg-black/20 px-1.5 rounded">3</span>
                </div>

                <div className="px-4 py-1.5 rounded bg-accent/20 border border-accent/30 flex items-center gap-2 whitespace-nowrap">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                    <span className="text-xs font-bold text-white">EM MANUTENÇÃO</span>
                    <span className="text-xs font-bold text-white ml-2 bg-black/20 px-1.5 rounded">1</span>
                </div>
            </div>
        </motion.div>
    );
};
