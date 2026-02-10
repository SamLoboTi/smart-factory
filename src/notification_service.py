"""
Notification Service - Envio de Alertas via WhatsApp
Utiliza Twilio API para enviar mensagens e imagens
"""

import os
from typing import Dict, Optional
from datetime import datetime

try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    print("⚠️ Twilio não instalado. Instale com: pip install twilio")

class NotificationService:
    """
    Serviço de notificações via WhatsApp usando Twilio.
    
    Configuração necessária (.env):
    - TWILIO_ACCOUNT_SID
    - TWILIO_AUTH_TOKEN
    - TWILIO_WHATSAPP_NUMBER (ex: whatsapp:+14155238886)
    - RECIPIENT_WHATSAPP (ex: whatsapp:+5511912040306)
    """
    
    def __init__(self):
        self.enabled = False
        self.client = None
        self.from_number = None
        self.to_number = None
        
        # Carregar configurações
        account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.from_number = os.getenv('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886')
        self.to_number = os.getenv('RECIPIENT_WHATSAPP', 'whatsapp:+5511912040306')
        
        # Inicializar cliente Twilio
        if TWILIO_AVAILABLE and account_sid and auth_token:
            try:
                self.client = Client(account_sid, auth_token)
                self.enabled = True
                print("✅ NotificationService: WhatsApp habilitado (Twilio)")
            except Exception as e:
                print(f"❌ Erro ao inicializar Twilio: {e}")
                self.enabled = False
        else:
            if not TWILIO_AVAILABLE:
                print("⚠️ NotificationService: Twilio não disponível (modo simulação)")
            else:
                print("⚠️ NotificationService: Credenciais Twilio não configuradas (modo simulação)")
    
    def send_prealert(self, alert_data: Dict, report: str, image_path: Optional[str] = None) -> bool:
        """
        Envia pré-alerta preventivo via WhatsApp.
        
        Args:
            alert_data: Dados do alerta
            report: Relatório textual completo
            image_path: Caminho para imagem do dashboard (opcional)
        
        Returns:
            True se enviado com sucesso, False caso contrário
        """
        message = self._format_prealert_message(alert_data, report)
        return self._send_message(message, image_path)
    
    def send_critical_alert(self, alert_data: Dict, report: str, image_path: Optional[str] = None) -> bool:
        """
        Envia alerta crítico via WhatsApp.
        
        Args:
            alert_data: Dados do alerta
            report: Relatório textual completo
            image_path: Caminho para imagem do dashboard (opcional)
        
        Returns:
            True se enviado com sucesso, False caso contrário
        """
        message = self._format_critical_message(alert_data, report)
        return self._send_message(message, image_path)
    
    def _format_prealert_message(self, alert_data: Dict, report: str) -> str:
        """
        Formata mensagem de pré-alerta (preventivo).
        """
        dt = datetime.fromisoformat(alert_data['timestamp'])
        timestamp_str = dt.strftime("%d/%m/%Y – %H:%M")
        
        message = f"""⚠️ *PRÉ-ALERTA – SMART FACTORY*

*Status:* Preventivo (antes do modo crítico)
*Data/Hora:* {timestamp_str}
*Equipamento:* {alert_data['device_name']}
*Sensor:* Temperatura / Vibração

*Valores Atuais:*
🌡️ Temperatura: {alert_data['temperature']:.1f}°C
📊 Limite: {alert_data['temp_limit']:.1f}°C
🔴 Proximidade: {alert_data['temp_proximity']*100:.1f}%

📳 Vibração: {alert_data['vibration']:.2f} mm/s
📊 Limite: {alert_data['vib_limit']:.2f} mm/s
🔴 Proximidade: {alert_data['vib_proximity']*100:.1f}%

*Risco Estimado (IA):* {alert_data['risk_score']*100:.1f}%

*Análise:*
{alert_data['reasons'][0] if alert_data['reasons'] else 'Tendência anormal detectada'}

*Recomendação:*
✅ Inspeção preventiva recomendada
✅ Monitoramento reforçado nas próximas horas

📊 Relatório completo e dashboard em anexo.
"""
        return message
    
    def _format_critical_message(self, alert_data: Dict, report: str) -> str:
        """
        Formata mensagem de alerta crítico.
        """
        dt = datetime.fromisoformat(alert_data['timestamp'])
        timestamp_str = dt.strftime("%d/%m/%Y – %H:%M")
        
        message = f"""🚨 *ALERTA CRÍTICO – SMART FACTORY*

*Status:* CRÍTICO (ação imediata necessária)
*Data/Hora:* {timestamp_str}
*Equipamento:* {alert_data['device_name']}

*Valores Críticos:*
🌡️ Temperatura: {alert_data['temperature']:.1f}°C / {alert_data['temp_limit']:.1f}°C
📳 Vibração: {alert_data['vibration']:.2f} / {alert_data['vib_limit']:.2f} mm/s

*Risco Estimado (IA):* {alert_data['risk_score']*100:.1f}%
*Vida Útil Restante:* {alert_data['rul_hours']:.1f} horas

*AÇÃO NECESSÁRIA:*
🛑 Parar equipamento imediatamente
🔧 Inspeção técnica urgente
📞 Contatar equipe de manutenção

📊 Relatório completo e dashboard em anexo.
"""
        return message
    
    def _send_message(self, message: str, image_path: Optional[str] = None) -> bool:
        """
        Envia mensagem via WhatsApp (com ou sem imagem).
        """
        if not self.enabled:
            print("\n" + "="*60)
            print("📱 SIMULAÇÃO DE WHATSAPP (Twilio não configurado)")
            print("="*60)
            print(f"Para: {self.to_number}")
            print(f"De: {self.from_number}")
            print("\nMensagem:")
            print(message)
            if image_path:
                print(f"\n📎 Anexo: {image_path}")
            print("="*60 + "\n")
            return True
        
        try:
            # Enviar mensagem
            if image_path and os.path.exists(image_path):
                # Mensagem com imagem
                msg = self.client.messages.create(
                    from_=self.from_number,
                    to=self.to_number,
                    body=message,
                    media_url=[f'file://{os.path.abspath(image_path)}']
                )
            else:
                # Mensagem apenas texto
                msg = self.client.messages.create(
                    from_=self.from_number,
                    to=self.to_number,
                    body=message
                )
            
            print(f"✅ WhatsApp enviado! SID: {msg.sid}")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao enviar WhatsApp: {e}")
            return False
    
    def test_connection(self) -> bool:
        """
        Testa conexão com Twilio enviando mensagem de teste.
        """
        if not self.enabled:
            print("⚠️ Twilio não habilitado. Configure as credenciais primeiro.")
            return False
        
        test_message = "🧪 Teste de conexão - Smart Factory Alert System"
        return self._send_message(test_message)
