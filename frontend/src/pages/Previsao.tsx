import { motion } from 'framer-motion';
import { Brain, Search, AlertOctagon } from 'lucide-react';

export const Previsao = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 p-6 glass-panel overflow-y-auto"
        >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Brain className="text-purple-500" />
                Manutenção Preditiva (IA)
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-6 rounded-xl border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Brain size={120} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Análise de Risco Atual</h3>
                        <p className="text-gray-300 max-w-lg mb-6">
                            Nossa IA detectou um padrão de vibração anômalo na **Linha de Montagem 3**.
                            Recomendamos inspeção preventiva nas próximas 48 horas.
                        </p>
                        <button className="bg-white text-purple-900 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                            Gerar Relatório Completo
                        </button>
                    </div>

                    <div className="glass-panel p-4">
                        <h4 className="text-white font-semibold mb-4">Próximas Previsões</h4>
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-gray-400 border-b border-white/10">
                                    <th className="pb-3">Equipamento</th>
                                    <th className="pb-3">Probabilidade de Falha</th>
                                    <th className="pb-3">Tempo Estimado</th>
                                    <th className="pb-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-white">
                                <tr className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-3">Motor Esteira A</td>
                                    <td className="py-3 text-success">12% (Baixa)</td>
                                    <td className="py-3">4500h</td>
                                    <td className="py-3"><span className="bg-success/20 text-success px-2 py-1 rounded text-xs">OK</span></td>
                                </tr>
                                <tr className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-3">Braço Robótico #4</td>
                                    <td className="py-3 text-warning">45% (Média)</td>
                                    <td className="py-3">120h</td>
                                    <td className="py-3"><span className="bg-warning/20 text-warning px-2 py-1 rounded text-xs">Atenção</span></td>
                                </tr>
                                <tr className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-3">Bomba Hidráulica 2</td>
                                    <td className="py-3 text-danger font-bold">89% (Crítica)</td>
                                    <td className="py-3">12h</td>
                                    <td className="py-3"><span className="bg-danger/20 text-danger px-2 py-1 rounded text-xs animate-pulse">Perigo</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="glass-panel p-4 flex flex-col gap-4">
                    <h3 className="text-white font-semibold">Diagnóstico Rápido</h3>

                    <div className="relative">
                        <input className="w-full bg-black/40 border border-white/10 rounded-lg p-3 pl-10 text-white focus:border-purple-500 outline-none" placeholder="Buscar código de erro..." />
                        <Search className="absolute left-3 top-3 text-gray-500" size={18} />
                    </div>

                    <div className="flex-1 bg-black/20 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-4">
                            <AlertOctagon className="text-purple-400 shrink-0" />
                            <div>
                                <h5 className="text-purple-300 font-bold text-sm">Dica do Dia</h5>
                                <p className="text-gray-400 text-xs mt-1">Manter a temperatura dos rolamentos abaixo de 60°C aumenta a vida útil em 40%.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
