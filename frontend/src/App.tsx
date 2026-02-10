import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { StatusFooter } from './components/StatusFooter';
import { Dashboard } from './pages/Dashboard';
import { Equipments } from './pages/Equipments';
import { Paradas } from './pages/Paradas';
import { PageKPIs } from './pages/KPIs';
import { Previsao } from './pages/Previsao';
import { Suporte } from './pages/Suporte';

import { ChatAssistant } from './components/ChatAssistant';
import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [criticalAlert, setCriticalAlert] = useState(false);

  // Poll for Critical Alerts
  useState(() => {
    const checkAlerts = async () => {
      try {
        const res = await fetch('http://localhost:3000/alertas');
        const data = await res.json();
        if (data.critical_state) {
          setCriticalAlert(true);
        } else {
          setCriticalAlert(false);
        }
      } catch (e) {
        console.error("Failed to check alerts", e);
      }
    };

    checkAlerts(); // Initial check
    const interval = setInterval(checkAlerts, 5000); // Check every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col p-4 gap-4 overflow-hidden h-screen bg-background text-white selection:bg-primary/30">

        {/* CRITICAL ALERT BANNER */}
        <AnimatePresence>
          {criticalAlert && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-600 text-white font-bold text-center py-2 px-4 rounded-md shadow-[0_0_20px_rgba(255,0,0,0.5)] animate-pulse flex justify-center items-center gap-2"
            >
              <div className="w-3 h-3 bg-white rounded-full animate-ping" />
              ⚠️ ALERTA CRÍTICO: Risco Iminente de Falha ou Vibração Extrema Detectada!
            </motion.div>
          )}
        </AnimatePresence>

        <Header />

        <main className="flex-1 flex gap-4 overflow-hidden">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <section className="flex-[3] flex flex-col gap-4 overflow-hidden relative">
            <div className="flex-1 overflow-hidden flex flex-col relative">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/equipamentos" element={<Equipments />} />
                <Route path="/paradas" element={<Paradas />} />
                <Route path="/kpis" element={<PageKPIs />} />
                <Route path="/previsao" element={<Previsao />} />
                <Route path="/suporte" element={<Suporte />} />
                <Route path="*" element={<div className="flex items-center justify-center h-full text-gray-500">Página em construção</div>} />
              </Routes>
            </div>
            <StatusFooter />
          </section>

          {/* Right Panel - Chat Assistant */}
          <aside className="flex-1 min-w-[320px] max-w-[380px] flex flex-col gap-4">
            <ChatAssistant />
          </aside>
        </main>
        {/* Footer moves inside Main Content optionally or stays at bottom if desired for all. User image showed Footer under Equipments? No, footer logic might need to be inside dashboard or global. Keeping global for now but outside flex-1 if needed. Actually image shows status at bottom. Let's put Footer inside the center section at bottom */}
      </div>
    </Router>
  );
}

export default App;

