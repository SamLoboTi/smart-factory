// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const config = {
    apiUrl: API_URL,
    apiEndpoints: {
        sensors: `${API_URL}/api/sensors`,
        kpis: `${API_URL}/api/kpis`,
        devices: `${API_URL}/api/devices`,
        alerts: `${API_URL}/api/alerts`,
    },
    refreshInterval: 5000, // 5 seconds
};
