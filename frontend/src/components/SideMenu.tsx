import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutDashboard, Settings, AlertOctagon, BarChart2, Brain, HelpCircle, User, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface MenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SideMenu = ({ isOpen, onClose }: MenuProps) => {
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Settings, label: 'Equipamentos', path: '/equipamentos' },
        { icon: AlertOctagon, label: 'Paradas', path: '/paradas' },
        { icon: BarChart2, label: 'KPIs', path: '/kpis' },
        { icon: Brain, label: 'Previsão (IA)', path: '/previsao' },
        { icon: HelpCircle, label: 'Suporte', path: '/suporte' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 w-72 bg-surface border-r border-white/10 z-50 shadow-2xl flex flex-col"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white tracking-wider">MENU</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <nav className="flex-1 p-4 space-y-2">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={onClose}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path
                                            ? 'bg-primary/20 text-primary border border-primary/20'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <item.icon size={20} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            ))}
                        </nav>

                        <div className="p-4 border-t border-white/10 space-y-2">
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors text-left">
                                <User size={20} />
                                <span className="font-medium">Minha Conta</span>
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-danger hover:bg-danger/10 transition-colors text-left">
                                <LogOut size={20} />
                                <span className="font-medium">Sair</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
