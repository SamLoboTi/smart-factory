import { motion } from 'framer-motion';
import { HelpCircle, Mail, Phone } from 'lucide-react';

export const Suporte = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 p-6 glass-panel overflow-y-auto"
        >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <HelpCircle className="text-primary" />
                Central de Ajuda e Suporte
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface/40 p-6 rounded-xl border border-white/5 space-y-4">
                    <h3 className="text-xl font-bold text-white border-b border-white/10 pb-4">Canais de Atendimento</h3>
                    <div className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors cursor-pointer">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                            <Mail />
                        </div>
                        <div>
                            <p className="font-semibold">Email</p>
                            <p className="text-sm">suporte@smartfactory.com</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors cursor-pointer">
                        <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center text-success">
                            <Phone />
                        </div>
                        <div>
                            <p className="font-semibold">Telefone (24h)</p>
                            <p className="text-sm">0800 123 4567</p>
                        </div>
                    </div>
                </div>

                <div className="bg-surface/40 p-6 rounded-xl border border-white/5">
                    <h3 className="text-xl font-bold text-white mb-4">Enviar Chamado</h3>
                    <form className="space-y-4">
                        <input className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary outline-none" placeholder="Assunto" />
                        <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary outline-none">
                            <option>Problema Técnico</option>
                            <option>Dúvida sobre KPIs</option>
                            <option>Solicitação de Acesso</option>
                        </select>
                        <textarea className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary outline-none h-32 resize-none" placeholder="Descreva seu problema..."></textarea>
                        <button className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors">
                            Enviar Solicitação
                        </button>
                    </form>
                </div>
            </div>
        </motion.div>
    );
};
