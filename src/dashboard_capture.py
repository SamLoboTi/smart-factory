"""
Dashboard Capture - Geração de Imagens do Estado do Sistema
Cria visualizações gráficas para anexar aos alertas
"""

import os
from datetime import datetime
from typing import Dict, Optional
import matplotlib
matplotlib.use('Agg')  # Backend sem GUI
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import Wedge
import numpy as np

class DashboardCapture:
    """
    Gera imagens do dashboard com estado atual do sistema.
    Inclui gráficos de tendência, gauge de risco e KPIs.
    """
    
    def __init__(self, output_dir: str = "alert_snapshots"):
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
    
    def generate_alert_image(self, alert_data: Dict, readings_history) -> str:
        """
        Gera imagem completa do dashboard para o alerta.
        
        Args:
            alert_data: Dados do alerta
            readings_history: DataFrame com histórico de leituras
        
        Returns:
            Caminho para a imagem gerada
        """
        # Criar figura com múltiplos subplots
        fig = plt.figure(figsize=(14, 10))
        fig.patch.set_facecolor('#0a0e27')
        
        # Grid layout
        gs = fig.add_gridspec(3, 3, hspace=0.4, wspace=0.3)
        
        # 1. Header com informações do alerta
        ax_header = fig.add_subplot(gs[0, :])
        self._draw_header(ax_header, alert_data)
        
        # 2. Gauge de Risco
        ax_gauge = fig.add_subplot(gs[1, 0])
        self._draw_risk_gauge(ax_gauge, alert_data['risk_score'])
        
        # 3. KPIs
        ax_kpis = fig.add_subplot(gs[1, 1:])
        self._draw_kpis(ax_kpis, alert_data)
        
        # 4. Gráfico de Tendência - Temperatura
        ax_temp = fig.add_subplot(gs[2, :2])
        self._draw_trend_chart(ax_temp, readings_history, 'temperature', 
                               'Temperatura (°C)', alert_data['temp_limit'])
        
        # 5. Gráfico de Tendência - Vibração
        ax_vib = fig.add_subplot(gs[2, 2])
        self._draw_trend_chart(ax_vib, readings_history, 'vibration', 
                              'Vibração (mm/s)', alert_data['vib_limit'])
        
        # Salvar imagem
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"alert_{alert_data['device_id']}_{timestamp}.png"
        filepath = os.path.join(self.output_dir, filename)
        
        plt.savefig(filepath, dpi=150, bbox_inches='tight', facecolor='#0a0e27')
        plt.close()
        
        print(f"📸 Dashboard capturado: {filepath}")
        return filepath
    
    def _draw_header(self, ax, alert_data: Dict):
        """Desenha cabeçalho com informações do alerta"""
        ax.axis('off')
        
        is_critical = alert_data['alert_level'] == 'critical'
        color = '#ef4444' if is_critical else '#f59e0b'
        title = '🚨 ALERTA CRÍTICO' if is_critical else '⚠️ PRÉ-ALERTA'
        
        # Título
        ax.text(0.5, 0.7, title, 
                fontsize=24, fontweight='bold', color=color,
                ha='center', va='center')
        
        # Informações
        dt = datetime.fromisoformat(alert_data['timestamp'])
        info_text = f"{alert_data['device_name']} | {dt.strftime('%d/%m/%Y %H:%M')}"
        ax.text(0.5, 0.3, info_text,
                fontsize=14, color='white', ha='center', va='center')
        
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
    
    def _draw_risk_gauge(self, ax, risk_score: float):
        """Desenha gauge de risco"""
        ax.set_aspect('equal')
        ax.axis('off')
        
        # Determinar cor baseado no risco
        if risk_score >= 0.80:
            color = '#ef4444'  # Vermelho
            label = 'ALTO'
        elif risk_score >= 0.60:
            color = '#f59e0b'  # Laranja
            label = 'MÉDIO'
        else:
            color = '#10b981'  # Verde
            label = 'BAIXO'
        
        # Desenhar arco de fundo
        theta = np.linspace(0, 180, 100)
        x = np.cos(np.radians(theta))
        y = np.sin(np.radians(theta))
        
        # Fundo do gauge
        ax.fill_between(x, 0, y, color='#1e293b', alpha=0.3)
        
        # Arco de risco
        risk_angle = risk_score * 180
        theta_risk = np.linspace(0, risk_angle, 100)
        x_risk = np.cos(np.radians(theta_risk))
        y_risk = np.sin(np.radians(theta_risk))
        ax.fill_between(x_risk, 0, y_risk, color=color, alpha=0.8)
        
        # Ponteiro
        needle_angle = np.radians(risk_angle)
        ax.plot([0, np.cos(needle_angle)*0.8], [0, np.sin(needle_angle)*0.8],
                color='white', linewidth=3)
        ax.plot(0, 0, 'o', color='white', markersize=10)
        
        # Texto
        ax.text(0, -0.3, f'{risk_score*100:.0f}%',
                fontsize=28, fontweight='bold', color=color,
                ha='center', va='center')
        ax.text(0, -0.5, label,
                fontsize=16, color='white', ha='center', va='center')
        ax.text(0, -0.7, 'RISCO',
                fontsize=12, color='#94a3b8', ha='center', va='center')
        
        ax.set_xlim(-1.2, 1.2)
        ax.set_ylim(-0.8, 1.2)
    
    def _draw_kpis(self, ax, alert_data: Dict):
        """Desenha KPIs principais"""
        ax.axis('off')
        
        kpis = [
            ('TEMPERATURA', f"{alert_data['temperature']:.1f}°C", 
             f"Limite: {alert_data['temp_limit']:.1f}°C", '#ef4444'),
            ('VIBRAÇÃO', f"{alert_data['vibration']:.2f} mm/s",
             f"Limite: {alert_data['vib_limit']:.2f} mm/s", '#f59e0b'),
            ('PRESSÃO', f"{alert_data['pressure']:.1f} bar",
             'Normal', '#10b981'),
            ('VIDA ÚTIL', f"{alert_data['rul_hours']:.1f}h",
             'Estimada', '#3b82f6')
        ]
        
        x_positions = [0.15, 0.4, 0.65, 0.9]
        
        for i, (label, value, subtitle, color) in enumerate(kpis):
            x = x_positions[i]
            
            # Valor principal
            ax.text(x, 0.7, value,
                    fontsize=18, fontweight='bold', color=color,
                    ha='center', va='center')
            
            # Label
            ax.text(x, 0.45, label,
                    fontsize=10, color='#94a3b8',
                    ha='center', va='center')
            
            # Subtitle
            ax.text(x, 0.25, subtitle,
                    fontsize=8, color='#64748b',
                    ha='center', va='center')
        
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
    
    def _draw_trend_chart(self, ax, readings, column: str, ylabel: str, limit: float):
        """Desenha gráfico de tendência"""
        ax.set_facecolor('#0f172a')
        
        if readings.empty or len(readings) < 2:
            ax.text(0.5, 0.5, 'Dados insuficientes',
                    transform=ax.transAxes, ha='center', va='center',
                    color='#64748b', fontsize=12)
            return
        
        # Inverter ordem (estava DESC)
        data = readings[::-1].tail(20)
        
        # Plotar linha de tendência
        x = range(len(data))
        y = data[column].values
        
        ax.plot(x, y, color='#3b82f6', linewidth=2, marker='o', 
                markersize=4, label='Atual')
        
        # Linha de limite
        ax.axhline(y=limit, color='#ef4444', linestyle='--', 
                   linewidth=1.5, label=f'Limite ({limit})')
        
        # Área de perigo (acima de 85% do limite)
        warning_level = limit * 0.85
        ax.axhspan(warning_level, limit * 1.1, alpha=0.2, color='#f59e0b')
        ax.axhspan(limit, limit * 1.1, alpha=0.3, color='#ef4444')
        
        # Estilo
        ax.set_xlabel('Leituras Recentes', color='#94a3b8', fontsize=10)
        ax.set_ylabel(ylabel, color='#94a3b8', fontsize=10)
        ax.tick_params(colors='#64748b', labelsize=8)
        ax.grid(True, alpha=0.1, color='white')
        ax.legend(loc='upper left', fontsize=8, facecolor='#1e293b', 
                 edgecolor='#334155', labelcolor='white')
        
        # Spines
        for spine in ax.spines.values():
            spine.set_color('#334155')
    
    def cleanup_old_snapshots(self, days: int = 7):
        """Remove snapshots antigos"""
        if not os.path.exists(self.output_dir):
            return
        
        cutoff_time = datetime.now().timestamp() - (days * 24 * 3600)
        
        for filename in os.listdir(self.output_dir):
            filepath = os.path.join(self.output_dir, filename)
            if os.path.isfile(filepath):
                if os.path.getmtime(filepath) < cutoff_time:
                    os.remove(filepath)
                    print(f"🗑️ Snapshot antigo removido: {filename}")
