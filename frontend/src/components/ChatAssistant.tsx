import { Send, User, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

interface Message {
    type: 'user' | 'ai';
    text: string;
}

const formatMessage = (text: string) => {
    // Check if it's a report (contains specific headers)
    if (text.includes('Status:') || text.includes('Risco Estimado')) {
        return text.split('\n').map((line, i) => {
            const keyStyle = "font-bold text-gray-300";
            const valStyle = "text-white";

            if (line.includes('Status:')) {
                const parts = line.split('Status:');
                const updateStatus = parts[1].trim();
                let statusColor = "text-white";
                if (updateStatus.includes('Crítico') || updateStatus.includes('CRÍTICO')) statusColor = "text-red-400 font-bold";
                if (updateStatus.includes('Preventivo')) statusColor = "text-amber-400 font-bold";
                if (updateStatus.includes('Normal')) statusColor = "text-emerald-400 font-bold";

                return <div key={i}><span className={keyStyle}>Status:</span> <span className={statusColor}>{updateStatus}</span></div>;
            }
            if (line.includes('Risco Estimado (IA):')) {
                const parts = line.split('Risco Estimado (IA):');
                return <div key={i}><span className={keyStyle}>Risco Estimado (IA):</span> <span className="text-blue-400 font-bold">{parts[1]}</span></div>;
            }

            // Highlight other keys
            const keys = ['Data/Hora:', 'Equipamento:', 'Sensor:', 'Valor Atual:', 'Limite Operacional:', 'Análise:', 'Recomendação:'];
            for (const key of keys) {
                if (line.startsWith(key) || line.includes(key)) {
                    const parts = line.split(key);
                    return <div key={i}><span className={keyStyle}>{key}</span> <span className={valStyle}>{parts[1]}</span></div>;
                }
            }
            // Headers like "⚠️ PRÉ-ALERTA..."
            if (line.includes('⚠️')) {
                return <div key={i} className="font-bold text-lg mb-2 text-white">{line}</div>;
            }

            return <div key={i} className="min-h-[1.2em]">{line}</div>;
        });
    }
    return text;
};

export const ChatAssistant = () => {
    const [messages, setMessages] = useState<Message[]>([
        { type: 'ai', text: 'Olá! Sou seu assistente inteligente. Monitorando a planta em tempo real. Como posso ajudar você hoje?' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const userText = inputText;
        setInputText('');
        setMessages(prev => [...prev, { type: 'user', text: userText }]);
        setIsLoading(true);

        try {
            const data = await api.sendChat(userText);
            setMessages(prev => [...prev, { type: 'ai', text: data.reply }]);
        } catch (error) {
            setMessages(prev => [...prev, { type: 'ai', text: "Desculpe, não consegui conectar ao servidor." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full glass-panel flex flex-col overflow-hidden bg-[#1e293b]/80 border border-white/10 shadow-xl rounded-2xl w-full">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-400" />
                    <div>
                        <h2 className="font-bold text-white text-base">Assistente Inteligente</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium tracking-wide">ONLINE</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white/10 p-2 rounded-lg">
                    <Loader2 className="w-4 h-4 text-blue-400" />
                </div>
            </div>

            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.type === 'ai' && (
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2 shadow-glow shrink-0">
                                <span className="text-xs font-bold text-white">AI</span>
                            </div>
                        )}

                        <div className={`p-3 rounded-lg max-w-[85%] text-sm whitespace-pre-wrap ${msg.type === 'user'
                            ? 'bg-white/20 text-white rounded-tr-none border border-white/10'
                            : 'bg-primary/20 text-white rounded-tl-none border border-primary/20'
                            }`}>
                            {msg.type === 'ai' ? formatMessage(msg.text) : msg.text}
                        </div>

                        {msg.type === 'user' && (
                            <img
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Samantha"
                                alt="User"
                                className="w-8 h-8 rounded-full ml-2 border border-white/20 shrink-0"
                            />
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2 shadow-glow shrink-0">
                            <span className="text-xs font-bold text-white">AI</span>
                        </div>
                        <div className="bg-primary/20 text-white p-3 rounded-lg rounded-tl-none border border-primary/20 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span className="text-xs text-gray-300">Analisando dados...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/10 bg-black/20">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Digite sua dúvida..."
                        disabled={isLoading}
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg py-3 pl-4 pr-4 text-sm text-white focus:outline-none focus:border-primary focus:bg-white/15 transition-all placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading}
                        className="bg-primary hover:bg-blue-600 text-white p-3 rounded-lg transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
