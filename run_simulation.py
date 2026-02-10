import time
import uuid
import threading
import logging
import sys
from src.database import DatabaseManager
from src.ingestion import SensorSimulator, MqttMock
from src.processor import DataProcessor
from src.assistant import SmartAssistant

# Configuration
NUM_DEVICES = 3
SIMULATION_SPEED = 1.0 # Segundos por tick

def main():
    print("Inicializando Simulação de Fábrica Inteligente...")
    
    # 1. Configurar Banco de Dados e Auth
    db = DatabaseManager()
    
    # Setup Auth & Create Default Users
    from src.auth import AuthManager
    auth = AuthManager(db)
    # Create default Admin and User if not exist
    if not auth.login("admin", "admin123"):
        auth.register_user("admin", "admin123", role="admin")
        print("👤 Admin criado: admin/admin123")
    if not auth.login("operador", "1234"):
        auth.register_user("operador", "1234", role="user")
        print("👤 Operador criado: operador/1234")
    
    # 2. Configurar Dispositivos e Sensores
    devices = []
    mqtt = MqttMock()
    sensors = [] # Keep track for scenario updates
    
    for i in range(NUM_DEVICES):
        dev_id = f"DEV-{i+100}"
        db.register_device(dev_id, f"CNC Machine {i+1}", "CNC", {'temp': 90, 'vib': 5})
        sensor = SensorSimulator(dev_id)
        mqtt.register_sensor(sensor)
        sensors.append(sensor)
        devices.append(dev_id)
        print(f"Registrado {dev_id}")

    # 3. Configurar Processador & Assistente
    from src.analytics import KpiCalculator, FailurePredictor
    from src.alert_manager import AlertManager, AlertLevel
    from src.notification_service import NotificationService
    from src.dashboard_capture import DashboardCapture
    
    processor = DataProcessor(db)
    kpi_calc = KpiCalculator(db)
    predictor = FailurePredictor()
    assistant = SmartAssistant(db, kpi_calc)
    
    # Inicializar Sistema de Alertas
    alert_manager = AlertManager(db, predictor)
    notification_service = NotificationService()
    dashboard_capture = DashboardCapture()
    
    print("\n🔔 Sistema de Alertas Preventivos Ativado")
    print(f"   Pré-Alerta: Risco ≥ {alert_manager.PRE_ALERT_THRESHOLD*100:.0f}%")
    print(f"   Crítico: Risco ≥ {alert_manager.CRITICAL_THRESHOLD*100:.0f}%")
    print(f"   Cooldown: {alert_manager.ALERT_COOLDOWN_MINUTES} minutos\n")
    
    # Auto-login assistant as admin for demo purposes (so predictions work in log)
    assistant.ask("login admin admin123")

    print("Sistema Rodando. Pressione Ctrl+C para parar.")
    print("------------------------------------------------")

    # Configuração de Cenários
    # Simulação Semanal: Ciclo de 30 ticks (Normal -> Positivo -> Negativo)
    WEEKLY_CYCLE = True
    SCENARIO_DURATION = 30 
    current_scenario_idx = 0
    scenarios = ['normal', 'positive', 'negative']

    # Loop de Simulação
    try:
        tick = 0
        scenario_timer = 0
        
        for packet in mqtt.listen():
            tick += 1
            scenario_timer += 1
            
            # Gerenciador de Cenário Semanal
            if WEEKLY_CYCLE and scenario_timer >= SCENARIO_DURATION:
                scenario_timer = 0
                current_scenario_idx = (current_scenario_idx + 1) % len(scenarios)
                new_scenario = scenarios[current_scenario_idx]
                print(f"\n--- 🔄 MUDANÇA DE CENÁRIO: {new_scenario.upper()} ---\n")
                for s in sensors: s.set_scenario(new_scenario)

            print(f"[{packet['timestamp']}] Recebido: {packet}")
            
            processor.process_packet(packet)
            
            # ===== SISTEMA DE ALERTAS =====
            # Verificar condições de alerta para cada dispositivo
            device_id = packet['device_id']
            alert_level, alert_data = alert_manager.check_alert_conditions(device_id)
            
            if alert_level != AlertLevel.NORMAL and alert_data:
                print("\n" + "="*70)
                if alert_level == AlertLevel.PRE_ALERT:
                    print("⚠️  PRÉ-ALERTA DISPARADO (PREVENTIVO)")
                else:
                    print("🚨 ALERTA CRÍTICO DISPARADO")
                print("="*70)
                
                # Gerar relatório
                report = alert_manager.generate_report(alert_data)
                print(report)
                
                # Capturar dashboard
                readings_history = db.get_recent_readings(device_id, limit=20)
                image_path = dashboard_capture.generate_alert_image(alert_data, readings_history)
                
                # Enviar notificação WhatsApp
                if alert_level == AlertLevel.PRE_ALERT:
                    success = notification_service.send_prealert(alert_data, report, image_path)
                else:
                    success = notification_service.send_critical_alert(alert_data, report, image_path)
                
                # Salvar alerta no banco
                alert_id = db.save_alert(alert_data, report, image_path, notification_sent=success)
                print(f"\n💾 Alerta salvo no banco (ID: {alert_id})")
                print("="*70 + "\n")
            # ===== FIM SISTEMA DE ALERTAS =====
            
            # Simular consulta de usuário ocasionalmente
            if tick % 10 == 0:
                 query_target = devices[0]
                 print(f"\n[CHAT USUARIO] >> 'Status {query_target}'")
                 response = assistant.ask(f"status {query_target}")
                 print(f"[ASSISTENTE] << {response}")

                 # Demonstrate Prediction (only works if logged in as admin)
                 print(f"[CHAT USUARIO] >> 'Predict {query_target}'")
                 response_pred = assistant.ask(f"predict {query_target}")
                 print(f"[ASSISTENTE] << {response_pred}\n")

            # Simular salvamento em lote no Data Lake a cada ~20 ticks
            if tick % 20 == 0:
                 print("[SISTEMA] Agregando dados ao Data Lake (CSV Histórico)...")
                 # Lógica para pegar buffer recente iria aqui
                 pass

    except KeyboardInterrupt:
        print("Parando Simulação...")

if __name__ == "__main__":
    main()
