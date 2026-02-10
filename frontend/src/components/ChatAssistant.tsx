import { Send, User, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

interface Message {
    type: 'user' | 'ai';
    text: string;
}

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

    const handleSend = () => {
        if (!inputText.trim() || isLoading) return;

        const userText = inputText;
        const lowerText = userText.toLowerCase();
        setInputText('');
        setMessages(prev => [...prev, { type: 'user', text: userText }]);
        setIsLoading(true);

        // Simulate AI "Thinking" and "Analyzing"
        setTimeout(() => {
            setIsLoading(false);

            let response = "";

            // Regex for time detection (e.g., 14:00, 14h, 14 as 15)
            const timeMatch = lowerText.match(/(\d{1,2})([:h.]\d{0,2})?(\s*(até|as|às|-)\s*(\d{1,2})([:h.]\d{0,2})?)?/);
            const detectedTime = timeMatch ? timeMatch[0] : null;

            // Greeting Logic
            if (lowerText.match(/^(ola|oi|olá|bom dia|boa tarde|boa noite)/)) {
                response = "Olá! Sou a IA da Smart Factory. Monitoro a planta 24h. Posso gerar relatórios, checar status de máquinas ou explicar siglas. Como posso ajudar?";
            }

            // --- CONCEPTS (Knowledge Base) ---
            else if (lowerText.includes('o que é') || lowerText.includes('significa') || lowerText.includes('definição')) {
                if (lowerText.includes('oee')) {
                    response = `📚 **OEE (Overall Equipment Effectiveness)**\n\nÉ a **Eficiência Global do Equipamento**. Mede o quão produtiva é sua fabricação.\n\n• **Cálculo**: Disponibilidade × Performance × Qualidade\n• **Meta**: > 85% (Classe Mundial)`;
                } else if (lowerText.includes('mtbf')) {
                    response = `📚 **MTBF (Mean Time Between Failures)**\n\nÉ o **Tempo Médio Entre Falhas**. Indica a confiabilidade da máquina.\n\nQuanto **maior**, melhor. Significa que o equipamento roda mais tempo sem quebrar.`;
                } else if (lowerText.includes('mttr')) {
                    response = `📚 **MTTR (Mean Time To Repair)**\n\nÉ o **Tempo Médio de Reparo**. Mede a agilidade da manutenção.\n\nQuanto **menor**, melhor. O objetivo é consertar rápido para voltar a produzir.`;
                } else if (lowerText.includes('kpi')) {
                    response = `📚 **KPIs da Planta**\n\nMonitoramos:\n• **OEE**: 82% (Eficiência)\n• **MTBF**: 320h (Confiabilidade)\n• **MTTR**: 45m (Agilidade)\n• **Disponibilidade**: 94%`;
                } else {
                    response = "Posso explicar sobre OEE, MTBF, MTTR, KPIs e outros termos. O que você gostaria de saber?";
                }
            }

            // --- STATUS & MONITORING (New Block for "Status") ---
            else if (lowerText.includes('status') || lowerText.includes('como está') || lowerText.includes('situação')) {
                const timeCtx = detectedTime ? `em ${detectedTime}` : "agora";

                if (lowerText.includes('14:00') || lowerText.includes('14h')) {
                    // Specific mocked response for the user example
                    response = `🕒 **Status às 14:00**\n` +
                        `• 🏭 **Produção**: Pico de carga (98% cap.)\n` +
                        `• 🌡️ **Temperatura**: 72°C (Leve aumento)\n` +
                        `• ✅ **Equipamentos**: Todos Operacionais`;
                } else {
                    response = `🔎 **Status Geral da Planta (${timeCtx})**\n` +
                        `• 🟢 **Operação**: Normal\n` +
                        `• 📉 **Perda Acumulada**: 2.1%\n` +
                        `• ⚡ **Consumo**: Dentro da meta\n\nTodos os sensores indicam estabilidade no momento.`;
                }
            }

            // --- REPORTS (Simple & Complex) ---
            else if (lowerText.includes('relatório') || lowerText.includes('relatorio')) {
                const timeStr = detectedTime || "do Turno Atual";

                if (lowerText.includes('complexo') || lowerText.includes('detalhado')) {
                    response = `📑 **Relatório Detalhado (${timeStr})**\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                        `🏭 **Performance**\n` +
                        `• OEE: 82% (Meta: 85%) ⚠️\n` +
                        `• Produção: 1.250 un 🟢\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                        `🔧 **Diagnóstico**\n` +
                        `• CNC-01: Vibração em 4.5mm/s (Alerta)\n` +
                        `• Caldeira: Estável em 65°C\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                        `💡 **Ação Recomendada**: Agendar lubrificação da CNC-01 no próximo intervalo.`;
                } else {
                    // Simple Report
                    response = `📄 **Relatório Rápido (${timeStr})**\n` +
                        `• 🔥 **Temp. Média**: 68°C\n` +
                        `• 〰️ **Vibração Média**: 2.3 mm/s\n` +
                        `• 🛑 **Paradas**: 2 microparadas\n` +
                        `• ✅ **Conculsão**: Operação Estável`;
                }
            }

            // --- SPECIFIC INFO (Equipments, Config, Stops) ---
            else if (lowerText.includes('equipamento') || lowerText.includes('maquina')) {
                response = "🏭 **Ativos Monitorados**:\n1. **CNC-01** (⚠️ Vibração Alta)\n2. **Prensa Hidráulica** (✅ Normal)\n3. **Esteira de Montagem** (✅ Normal)\n\nPosso detalhar o status de qualquer uma delas.";
            }
            else if (lowerText.includes('configura') || lowerText.includes('ajuste')) {
                response = "⚙️ **Ajustes de Sistema**: Vá até o ícone de engrenagem (↗️) para definir:\n• Limites de Alerta (Temp/Vib)\n• Metas de OEE\n• Turnos de Operação";
            }
            else if (lowerText.includes('parada') || lowerText.includes('downtime') || lowerText.includes('falha')) {
                // Date handling simulation
                if (lowerText.match(/\d{2}\/\d{2}/)) {
                    response = `🗓️ **Registro de 02/02**:\n• 14:30 | Falha Elétrica (10min)\n• 09:15 | Ajuste Mecânico (5min)\n\nTotal de Downtime: 15 minutos.`;
                } else if (lowerText.includes('22')) { // Range simulation
                    response = `📅 **Histórico (22h - 00h)**\n• Nenhuma falha crítica registrada.\n• Variação de temperatura normal (+/- 2°C).\n• Operação contínua sem paradas.`;
                } else {
                    response = `⚠️ **Últimas Paradas**:\n• 14:30 - Falha de Alimentação (10min)\n• 09:15 - Ajuste de Ferramenta (5min)\n\nO MTTR global está em 45min (Bom).`;
                }
            }

            // --- PREDICTIONS & ALERTS ---
            else if (lowerText.includes('previsão') || lowerText.includes('risco')) {
                if (detectedTime) {
                    response = `🔮 **Previsão às ${detectedTime}**\n• Probabilidade de Falha: Baixa (<3%)\n• Tendência: Estabilidade térmica.\n• Recomendação: Manter operação normal.`;
                } else {
                    response = `🔮 **Análise Preditiva (2h)**\n• ⚠️ **Risco**: MODERADO\n• 〰️ **Fator**: Vibração na CNC-01\n• 📉 **Confiança**: 89%\n\nSugerimos inspeção visual no próximo turno.`;
                }
            }

            // Default Metrics
            else if (lowerText.includes('vibração')) {
                response = `📊 **Vibração Atual**: 4.5 mm/s (Alerta na CNC-01). Nas demais máquinas, a média é 1.2 mm/s (Normal).`;
            }
            else if (lowerText.includes('temperatura')) {
                response = `🌡️ **Temperatura Atual**: 65°C (Média Global). Todos os sensores operando dentro da faixa de segurança (40°C - 90°C).`;
            }

            // Humanized Fallback
            else {
                response = "🤔 Entendi parcialmente. Para que eu seja mais preciso, tente:\n\n• 'Status das 14:00'\n• 'Relatório de ontem'\n• 'O que é MTTR?'\n• 'Houve falha na CNC-01?'\n\nEstou aprendendo constantemente com a operação!";
            }

            setMessages(prev => [...prev, { type: 'ai', text: response }]);
        }, 1500);
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
                            {msg.text.includes('ALTO') ? (
                                <span>Risco <span className="text-danger font-bold">ALTO</span> devido à vibração na Linha 3.</span>
                            ) : (
                                msg.text
                            )}
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
