
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

interface AlertToastProps {
    message: string;
    type?: 'warning' | 'critical' | 'preventive';
    onClose: () => void;
}

export const AlertToast = ({ message, type = 'critical', onClose }: AlertToastProps) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    // Determine colors based on type
    const bgColor = type === 'critical'
        ? 'bg-red-900/80 border-red-500'
        : type === 'preventive'
            ? 'bg-amber-900/80 border-amber-500'
            : 'bg-amber-900/80 border-amber-500';

    const iconBg = type === 'critical'
        ? 'bg-red-500/20'
        : type === 'preventive'
            ? 'bg-amber-500/20'
            : 'bg-amber-500/20';

    const title = type === 'critical'
        ? 'Risco Crítico'
        : type === 'preventive'
            ? 'Pré-Alerta / Preventivo'
            : 'Atenção';

    return (
        <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg shadow-2xl border-l-4 backdrop-blur-md text-white ${bgColor}`}
        >
            <div className={`p-2 rounded-full ${iconBg}`}>
                <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-sm uppercase tracking-wider">{title}</span>
                <span className="text-sm font-light opacity-90">{message}</span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors ml-4">
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};
