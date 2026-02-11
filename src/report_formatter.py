from datetime import datetime

class ReportFormatter:
    """
    Padroniza a formatação de relatórios para Assistente e WhatsApp.
    """
    
    @staticmethod
    def format_report(data: dict) -> str:
        """
        Gera o relatório textual no formato padrão.
        
        Args:
            data (dict): Contém chaves:
                - status: str (Preventivo / Crítico / Normal)
                - timestamp: str (ISO format or similar, will be parsed if needed)
                - device_name: str
                - sensor: str (Temperatura / Vibração)
                - value: float
                - limit: float
                - unit: str
                - risk_score: float (0.0 to 1.0)
                - analysis: str (Contextual text)
                - recommendation: str (Action text)
                - header: str (Optional override)
        """
        
        # Parse timestamp safely
        try:
            dt = datetime.fromisoformat(data['timestamp'])
            time_str = dt.strftime("%d/%m/%Y – %H:%M")
        except:
            time_str = data.get('timestamp', 'Data Desconhecida')

        risk_pct = data.get('risk_score', 0) * 100
        
        # Determine Header based on status if not provided
        header = data.get('header', "")
        if not header:
            if "CRÍTICO" in data['status'].upper():
                header = "🚨 RELATÓRIO TÉCNICO – ALERTA CRÍTICO"
            elif "PREVENTIVO" in data['status'].upper():
                header = "⚠️ RELATÓRIO TÉCNICO – PRÉ-ALERTA"
            else:
                header = "🔵 RELATÓRIO TÉCNICO – OPERAÇÃO NORMAL"

        return f"""{header}

Status: {data['status']}
Data/Hora: {time_str}
Equipamento: {data['device_name']}
Sensor: {data['sensor']}
Valor Atual: {data['value']:.2f} {data['unit']}
Limite Operacional: {data['limit']:.1f} {data['unit']}
Risco Estimado (IA): {risk_pct:.1f}%

Análise:
{data['analysis']}

Recomendação:
{data['recommendation']}"""
