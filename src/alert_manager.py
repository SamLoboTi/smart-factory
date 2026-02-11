"""
Alert Manager - Sistema de Alertas em Dois Níveis
Gerencia pré-alertas preventivos e alertas críticos
"""

from enum import Enum
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import os

class AlertLevel(Enum):
    """Níveis de alerta do sistema"""
    NORMAL = "normal"
    PRE_ALERT = "pre_alert"  # 60-79% de risco
    CRITICAL = "critical"     # ≥80% de risco

class AlertManager:
    """
    Gerenciador de alertas preventivos e críticos.
    Monitora sensores e dispara alertas baseado em:
    - Risco estimado pela IA
    - Proximidade aos limites operacionais
    - Tendências anormais
    """
    
    def __init__(self, db_manager, analytics):
        self.db = db_manager
        self.analytics = analytics
        
        # Thresholds configuráveis via env vars
        self.PRE_ALERT_THRESHOLD = float(os.getenv('PRE_ALERT_THRESHOLD', '0.60'))
        self.CRITICAL_THRESHOLD = float(os.getenv('CRITICAL_THRESHOLD', '0.80'))
        self.TEMP_WARNING_PERCENT = float(os.getenv('TEMP_WARNING_PERCENT', '0.85'))
        self.VIB_WARNING_PERCENT = float(os.getenv('VIB_WARNING_PERCENT', '0.85'))
        self.ALERT_COOLDOWN_MINUTES = int(os.getenv('ALERT_COOLDOWN_MINUTES', '15'))
        
        # Rastreamento de alertas ativos para evitar spam
        self.active_alerts: Dict[str, Dict] = {}  # device_id -> {level, timestamp}
    
    def check_alert_conditions(self, device_id: str) -> Tuple[AlertLevel, Optional[Dict]]:
        """
        Verifica condições de alerta para um dispositivo.
        
        Returns:
            (AlertLevel, alert_data): Nível de alerta e dados do alerta (se houver)
        """
        # Buscar leituras recentes
        readings = self.db.get_recent_readings(device_id, limit=20)
        if readings.empty:
            return AlertLevel.NORMAL, None
        
        # Buscar informações do dispositivo
        device_info = self.db.get_device_info(device_id)
        if not device_info:
            return AlertLevel.NORMAL, None
        
        # 1. Calcular risco via IA
        risk_score, rul_hours, energy_waste = self.analytics.predict_failure_risk(readings)
        
        # 2. Calcular proximidade aos limites operacionais
        last_reading = readings.iloc[0]  # Mais recente (ORDER BY DESC)
        temp_limit = device_info.get('operational_limit_temp', 100)
        vib_limit = device_info.get('operational_limit_vibration', 10)
        
        temp_proximity = last_reading['temperature'] / temp_limit
        vib_proximity = last_reading['vibration'] / vib_limit
        
        # 3. Detectar tendências anormais
        trend = self._detect_trend(readings)
        
        # 4. Determinar nível de alerta
        alert_level = AlertLevel.NORMAL
        reasons = []
        
        # Verificar CRÍTICO primeiro
        if risk_score >= self.CRITICAL_THRESHOLD:
            alert_level = AlertLevel.CRITICAL
            reasons.append(f"Risco crítico: {risk_score*100:.1f}%")
        elif temp_proximity >= 0.95 or vib_proximity >= 0.95:
            alert_level = AlertLevel.CRITICAL
            reasons.append("Sensor próximo ao limite crítico")
        
        # Verificar PRÉ-ALERTA
        elif risk_score >= self.PRE_ALERT_THRESHOLD:
            alert_level = AlertLevel.PRE_ALERT
            reasons.append(f"Risco elevado: {risk_score*100:.1f}%")
        elif temp_proximity >= self.TEMP_WARNING_PERCENT or vib_proximity >= self.VIB_WARNING_PERCENT:
            alert_level = AlertLevel.PRE_ALERT
            reasons.append("Sensor se aproximando dos limites operacionais")
        elif trend == "increasing_abnormal":
            alert_level = AlertLevel.PRE_ALERT
            reasons.append("Tendência anormal detectada (crescimento contínuo)")
        
        # 5. Verificar cooldown (evitar spam)
        if alert_level != AlertLevel.NORMAL:
            if self._is_in_cooldown(device_id, alert_level):
                return AlertLevel.NORMAL, None  # Ainda em cooldown
        
        # 6. Preparar dados do alerta
        if alert_level != AlertLevel.NORMAL:
            alert_data = {
                'device_id': device_id,
                'device_name': device_info.get('name', device_id),
                'alert_level': alert_level.value,
                'timestamp': datetime.now().isoformat(),
                'risk_score': risk_score,
                'temperature': float(last_reading['temperature']),
                'vibration': float(last_reading['vibration']),
                'pressure': float(last_reading['pressure']),
                'temp_limit': temp_limit,
                'vib_limit': vib_limit,
                'temp_proximity': temp_proximity,
                'vib_proximity': vib_proximity,
                'trend': trend,
                'reasons': reasons,
                'rul_hours': rul_hours,
                'energy_waste': energy_waste
            }
            
            # Atualizar rastreamento
            self.active_alerts[device_id] = {
                'level': alert_level,
                'timestamp': datetime.now()
            }
            
            return alert_level, alert_data
        
        return AlertLevel.NORMAL, None
    
    def _detect_trend(self, readings) -> str:
        """
        Detecta tendências nos dados dos sensores.
        
        Returns:
            'increasing_abnormal', 'decreasing', 'stable'
        """
        if len(readings) < 5:
            return 'stable'
        
        # Analisar últimas 5 leituras (ordem DESC, então invertemos)
        recent = readings.head(5)[::-1]
        
        # Verificar tendência de vibração (mais crítico)
        vib_values = recent['vibration'].values
        
        # Calcular diferenças consecutivas
        diffs = [vib_values[i+1] - vib_values[i] for i in range(len(vib_values)-1)]
        
        # Se 3+ diferenças consecutivas são positivas e significativas
        positive_diffs = [d for d in diffs if d > 0.1]
        if len(positive_diffs) >= 3:
            return 'increasing_abnormal'
        
        # Verificar tendência de temperatura
        temp_values = recent['temperature'].values
        temp_diffs = [temp_values[i+1] - temp_values[i] for i in range(len(temp_values)-1)]
        positive_temp_diffs = [d for d in temp_diffs if d > 1.0]
        
        if len(positive_temp_diffs) >= 3:
            return 'increasing_abnormal'
        
        return 'stable'
    
    def _is_in_cooldown(self, device_id: str, alert_level: AlertLevel) -> bool:
        """
        Verifica se ainda estamos em período de cooldown para este dispositivo.
        """
        if device_id not in self.active_alerts:
            return False
        
        last_alert = self.active_alerts[device_id]
        time_since_alert = datetime.now() - last_alert['timestamp']
        
        # Se o nível aumentou (PRE_ALERT -> CRITICAL), sempre permitir
        if alert_level == AlertLevel.CRITICAL and last_alert['level'] == AlertLevel.PRE_ALERT:
            return False
        
        # Caso contrário, verificar cooldown
        return time_since_alert < timedelta(minutes=self.ALERT_COOLDOWN_MINUTES)
    
    def generate_report(self, alert_data: Dict) -> str:
        """
        Gera relatório textual detalhado do alerta no formato solicitado.
        """
        level = alert_data['alert_level']
        is_critical = (level == 'critical')
        
        # Prepare Data for Formatter
        # Identify sensor context again (or reuse from alert_data if available)
        if alert_data['temp_proximity'] > alert_data['vib_proximity']:
            sensor = "Temperatura"
            unit = "°C"
        else:
            sensor = "Vibração"
            unit = "mm/s"

        # Analysis Logic
        if alert_data['trend'] == 'increasing_abnormal':
            analysis = "Tendência contínua de aumento acima do padrão histórico."
        elif alert_data['reasons']:
            analysis = f"{alert_data['reasons'][0]}"
        else:
            analysis = "Variação detectada nos parâmetros operacionais."

        # Recommendation Logic
        if is_critical:
            recommendation = "Parada imediata e manutenção corretiva."
            status_text = "CRÍTICO (ação imediata necessária)"
        else:
            recommendation = "Inspeção preventiva e monitoramento reforçado nas próximas horas."
            status_text = "Preventivo (antes do modo crítico)"

        report_data = {
            'status': status_text,
            'timestamp': alert_data['timestamp'],
            'device_name': alert_data['device_name'],
            'sensor': sensor,
            'value': alert_data['temperature'] if sensor == "Temperatura" else alert_data['vibration'],
            'limit': alert_data['temp_limit'] if sensor == "Temperatura" else alert_data['vib_limit'],
            'unit': unit,
            'risk_score': alert_data['risk_score'],
            'analysis': analysis,
            'recommendation': recommendation
        }
        
        from src.report_formatter import ReportFormatter
        return ReportFormatter.format_report(report_data)
    
    def get_alert_history(self, device_id: Optional[str] = None, limit: int = 20) -> List[Dict]:
        """
        Retorna histórico de alertas do banco de dados.
        """
        return self.db.get_alert_history(device_id, limit)
    
    def resolve_alert(self, alert_id: int, resolved_by: str = "system"):
        """
        Marca um alerta como resolvido.
        """
        self.db.resolve_alert(alert_id, resolved_by)
