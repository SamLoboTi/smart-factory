import { Bell, Menu, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { SideMenu } from './SideMenu';
import { Link, useLocation } from 'react-router-dom';

export const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const navItems = [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Equipamentos', path: '/equipamentos' },
        { label: 'Paradas', path: '/paradas' },
        { label: 'KPIs', path: '/kpis' },
        { label: 'Previsão', path: '/previsao' },
        { label: 'Assistente', path: '/suporte' }, // Assistente goes to support or chat? keeping simplified
    ];

    return (
        <>
            <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="h-16 border-b border-white/10 glass-panel flex items-center justify-between px-6 z-40 relative"
            >
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsMenuOpen(true)}>
                        <Menu className="w-6 h-6 text-primary cursor-pointer hover:text-white transition-colors" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                            <span className="font-bold text-white">SF</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-wider text-white">SMART <span className="font-light text-primary">FACTORY</span></h1>
                    </div>
                </div>

                {/* Date & Time Display */}
                <div className="hidden xl:flex flex-col items-center">
                    <span className="text-2xl font-mono font-bold text-white tracking-widest">
                        {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-xs text-gray-400 uppercase tracking-widest">
                        {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </span>
                </div>

                <nav className="hidden md:flex items-center gap-8">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.path}
                            className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === item.path ? 'text-white border-b-2 border-primary pb-1' : 'text-gray-400'
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-6">
                    <button className="relative text-gray-400 hover:text-white transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[10px] flex items-center justify-center text-white min-w-[16px]">3</span>
                    </button>
                    <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Samantha"
                            alt="User"
                            className="w-8 h-8 rounded-full bg-smart-card border border-white/20"
                        />
                        <div className="hidden lg:block text-right">
                            <p className="text-sm font-medium text-white">Samantha</p>
                            <p className="text-xs text-gray-400">Operadora Chefe</p>
                        </div>
                        <Settings className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer" />
                    </div>
                </div>
            </motion.header>
        </>
    );
};
