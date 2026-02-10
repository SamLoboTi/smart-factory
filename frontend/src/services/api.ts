const API_URL = 'http://localhost:3000'; // Ajuste conforme porta do NestJS

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

    getKPIs: async (): Promise<KPIResponse | null> => {
        try {
            const res = await fetch(`${API_URL}/kpis`);
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
    }
};
