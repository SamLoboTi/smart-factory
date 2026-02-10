import logging
from src.analytics import KpiCalculator, FailurePredictor
import pandas as pd

class DataProcessor:
    def __init__(self, db_manager):
        self.db = db_manager
        self.kpi = KpiCalculator(db_manager)
        self.predictor = FailurePredictor()
        
        self.logger = logging.getLogger("Processor")
        logging.basicConfig(level=logging.INFO)

    def process_packet(self, packet):
        # 1. Validação (verificação simples)
        if 'temperature' not in packet or 'device_id' not in packet:
            self.logger.warning("Pacote inválido recebido")
            return

        # 2. Analytics / IA - Calcular Risco ANTES de salvar
        # Para precisão, deveríamos pegar hitórico + atual. 
        # Simplificação: Usar apenas dados atuais para o modelo simples ou buscar histórico rápido.
        # O modelo espera um DataFrame.
        recent_df = self.db.get_recent_readings(packet['device_id'], limit=20)
        # Adicionar o atual no topo (simulação rápida de append) se necessário, 
        # mas como o modelo usa apenas o ultimo (iloc[0]), podemos montar um DF só com o atual se o histórico não for crucial para features de janela.
        # O analytics.py atual usa apenas iloc[0].
        
        current_df = pd.DataFrame([packet])
        risk, rul, waste = self.predictor.predict_failure_risk(current_df)
        packet['risk_score'] = float(risk)
        packet['predicted_rul'] = float(rul)
        packet['energy_waste'] = float(waste)

        # 3. Armazenar Tempo Real (agora com risk_score)
        self.db.save_reading(packet)

        # 4. Lógica de Verificação / Detecção de Parada
        if packet['status'] == 'parado':
            self.logger.info(f"PARADA DETECTADA em {packet['device_id']}!")
            self.db.log_event(packet['device_id'], 'PARADA', f"Máquina parada. Temp: {packet['temperature']}")
            
        if risk > 0.7:
             self.logger.warning(f"ALTO RISCO DE FALHA em {packet['device_id']}: {risk*100:.1f}%")
             # Opcional: logar evento de alerta também
             # self.db.log_event(packet['device_id'], 'ALERTA', f"Alto risco de falha: {risk}")

        # 5. Calcular OEE (Apenas para logar ocasionalmente)
        if  random.randint(0, 100) < 5: # 5% de chance de logar OEE no console para não spamar
             oee, _, _, _ = self.kpi.calculate_oee(packet['device_id'])
             self.logger.info(f"OEE atualizado para {packet['device_id']}: {oee}%")

import random # re-import for the random check
