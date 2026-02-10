const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface SensorReading {
    id: number;
    timestamp: string;
    device_id: string;
    temperatura: number;
    vibracao: number;
    pressure: number;
    status: string;
}

export interface KPIResponse {
    oee: number;
    mtbf: number;
    mttr: number;
    disponibilidade: number;
    leituras_totais: number;
    tempo_parado_registros: number;
    vibracao_media_operacao: number;
    status_geral: string;
}

export const api = {
    getLatestReadings: async (): Promise<SensorReading[]> => {
        try {
            const res = await fetch(`${API_URL}/sensores`);
            if (!res.ok) throw new Error('Falha ao buscar sensores');
            return await res.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    getKPIs: async (params?: { start?: string; end?: string }): Promise<KPIResponse | null> => {
        try {
            const query = new URLSearchParams(params as any).toString();
            const res = await fetch(`${API_URL}/kpis?${query}`);
            if (!res.ok) throw new Error('Falha ao buscar KPIs');
            return await res.json();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    getAlerts: async () => {
        try {
            const res = await fetch(`${API_URL}/alertas`);
            if (!res.ok) throw new Error('Falha ao buscar alertas');
            return await res.json();
        } catch (error) {
            console.error(error);
            return { vibracao_alta: [], ultimas_paradas: [] };
        }
    },

    sendChat: async (message: string) => {
        try {
            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            if (!res.ok) throw new Error('Falha no chat');
            return await res.json();
        } catch (error) {
            console.error(error);
            return { reply: "Erro de conexão com o assistente." };
        }
    }
};
