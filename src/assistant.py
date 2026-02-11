import sys
import pandas as pd
from datetime import datetime
from src.database import DatabaseManager
from src.analytics import KpiCalculator
import difflib # For fuzzy matching

class SmartAssistant:
    def __init__(self, db_manager, kpi_calculator):
        self.db = db_manager
        self.kpi = kpi_calculator
        
        # New: Security & AI
        from src.auth import AuthManager
        from src.analytics import FailurePredictor
        self.auth = AuthManager(self.db)
        self.predictor = FailurePredictor()
        
        self.predictor = FailurePredictor()
        
        self.current_user = None
        self.context = {} # For multi-turn conversation state

    def ask(self, query):
        """
        Enhanced Assistant with Auth, Prediction & Reports.
        Commands:
        - "login <user> <pass>"
        - "status <device_id>"
        - "predict <device_id>" (Requires Admin)
        - "relatório <rápido|completo>"
        """
        original_query = query
        query = self._normalize_text(query)
        parts = query.split()
        
        # Default Greeting
        if not parts:
            return "Olá! Sou seu assistente inteligente. Monitorando a planta em tempo real. Como posso ajudar você hoje?"

        # --- AUTHENTICATION ---
        if parts[0] == "login":
            if len(parts) < 3:
                return "Use: login <usuario> <senha>"
            # Use original parts for case-sensitive password if needed, but simplistic here
            user = self.auth.login(parts[1], parts[2])
            if user:
                self.current_user = user
                return f"Login realizado com sucesso. Bem-vindo, {user['username']} ({user['role']})."
            else:
                return "Falha no login. Verifique suas credenciais."

        if parts[0] == "logout":
            self.current_user = None
            return "Desconectado com sucesso."

        if parts[0] == "whoami" or parts[0] == "quem":
            if self.current_user:
                 return f"Usuário logado: {self.current_user['username']} ({self.current_user['role']})"
            return "Você não está autenticado no momento."

        # --- PUBLIC & CONTEXTUAL COMMANDS ---
        
        # 1. Status Check
        if "status" in query:
            device_id = self._extract_device_id(query, parts)
            if not device_id:
                return "Por favor, especifique o ID do dispositivo para verificar o status (ex: status DEV-100)."

            # Check for history date
            date_match = self._extract_date(original_query)
            
            if date_match:
                # Historical Status
                target_date = date_match
                readings = self.db.get_readings_at(device_id, target_date)
                prefix = f"📜 [HISTÓRICO {target_date}]"
                if readings.empty:
                    return f"⚠️ Não encontrei registros para {device_id} em {target_date}. Verifique a data."
            else:
                # Current Status
                readings = self.db.get_recent_readings(device_id, limit=1)
                prefix = "🟢 [AGORA]"

            info = self.db.get_device_info(device_id)
            if not info:
                 return f"Dispositivo {device_id} não encontrado."
            
            if readings.empty:
                return f"Sem dados recentes para {device_id}."

            current_status = readings.iloc[0]['status']
            temp = readings.iloc[0]['temperature']
            
            # Simple status line as requested, without complicating it
            return f"{prefix} {info['name']} ({device_id}): {current_status}. Temperatura: {temp:.1f}°C."

        # 2. Prediction
        if "predict" in query or "prever" in query or "predicao" in query:
            if not self.auth.check_permission(self.current_user, 'admin'):
                return "🔒 Acesso restrito. Apenas administradores podem gerar previsões de falha."

            device_id = self._extract_device_id(query, parts)
            if not device_id: return "Informe o ID para previsão (ex: predict DEV-100)."

            readings = self.db.get_recent_readings(device_id, limit=5)
            if readings.empty: return "Dados insuficientes para gerar previsão."

            risk, rul, waste = self.predictor.predict_failure_risk(readings)
            risk_pct = risk * 100
            
            status_icon = "🟢" if risk < 0.3 else ("🟡" if risk < 0.7 else "🔴")
            rul_text = f"{rul:.1f}h" if rul < 900 else "Estável (>48h)"
            
            return f"{status_icon} Análise de Risco ({device_id}):\n📉 Probabilidade de Falha: {risk_pct:.1f}%\n⏳ Vida Útil Restante: {rul_text}\n⚡ Desperdício de Energia: {waste:.1f}W"

        # 3. Reports (Relatório)
        if "relatorio" in query:
            # 3a. Quick Report (Rápido/Atual/Agora)
            if "rapido" in query or "atual" in query or "agora" in query:
                device_id = self._extract_device_id(query, parts) or "DEV-100" # Default if not specified
                return self._generate_quick_report(query, device_id)
            
            # 3b. Complete/Historical Report
            if "completo" in query or "historico" in query or "detalhado" in query:
                 date_match = self._extract_date(original_query)
                 device_id = self._extract_device_id(query, parts) or "DEV-100"
                 
                 if date_match:
                     return self._generate_historical_report(device_id, date_match)
                 else:
                     self.context['report_type'] = 'complete'
                     self.context['report_device_id'] = device_id
                     self.context['awaiting_date'] = True
                     return f"Para o relatório completo de {device_id}, por favor informe a data e hora (dd/mm/aaaa hh:mm)."

            # 3c. General Inquiry
            return "Você gostaria de um relatório **Rápido** (situação atual) ou **Completo** (histórico)? Por favor, especifique."

        # 4. Explain
        if "explain" in query or "explicar" in query or "explica" in query:
            device_id = self._extract_device_id(query, parts)
            if not device_id: return "Qual dispositivo você quer que eu analise? (ex: explicar DEV-100)"
            
            readings = self.db.get_recent_readings(device_id, limit=1)
            if readings.empty: return f"Sem dados para explicar a situação de {device_id}."
            
            last = readings.iloc[0]
            reasons = []
            if last['temperature'] > 80: reasons.append(f"Temperatura alta ({last['temperature']}°C)")
            if last['vibration'] > 4: reasons.append(f"Vibração excessiva ({last['vibration']}mm/s)")
            
            explanation = "Operação normal." if not reasons else "Fatores de risco: " + "; ".join(reasons) + "."
            return f"🧐 Análise ({device_id}): {explanation}"

        # --- CONTEXT HANDLING ---
        if self.context.get('awaiting_date'):
            date_match = self._extract_date(original_query)
            if date_match and len(date_match) > 10: # Basic check for full datetime
                 target_id = self.context.get('report_device_id', 'DEV-100')
                 self.context = {} # Clear
                 return self._generate_historical_report(target_id, date_match)
            else:
                 return "Formato de data inválido. Por favor use: dd/mm/aaaa hh:mm"

        # --- FALLBACK ---
        # Polite fallback without "OEE"
        return (
            "Desculpe, não entendi o comando. Tente:\n"
            "- 'Status DEV-100'\n"
            "- 'Relatório rápido'\n"
            "- 'Relatório completo'\n"
            "- 'Login <user> <pass>'"
        )

    def _normalize_text(self, text):
        import unicodedata
        text = text.lower().strip()
        # Remove accents
        text = ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
        return text

    def _extract_device_id(self, query, parts):
        # 1. Look for explicit DEV-XXX
        for p in parts:
            if p.upper().startswith("DEV-"):
                return p.upper()
        # 2. Heuristic: maybe just a number? (riskier)
        return None

    def _extract_date(self, text):
        import re
        # Try full datetime first
        match = re.search(r"(\d{2}[-/]\d{2}[-/]\d{4})\s+(\d{2}:\d{2})", text)
        if match:
            return f"{match.group(1).replace('-', '/')} {match.group(2)}"
        # Try just date
        match = re.search(r"(\d{2}[-/]\d{2}[-/]\d{4})", text)
        if match:
             return match.group(1).replace('-', '/')
        return None

    def _generate_report_string(self, df, time_str, device_id, header_override=None):
        # 1. AI Analysis
        risk, rul, waste = self.predictor.predict_failure_risk(df)
        
        # 2. Extract Key Metrics (Last reading)
        last_reading = df.iloc[-1]
        
        # 3. Determine Status & Context
        status_data = self._analyze_status(risk, last_reading['temperature'], last_reading['vibration'])
        
        # 4. Prepare Data
        report_data = {
            'status': status_data['status'],
            'timestamp': time_str,
            'device_name': device_id,
            'sensor': status_data['sensor'],
            'value': status_data['value'],
            'limit': status_data['limit'],
            'unit': status_data['unit'],
            'risk_score': risk,
            'analysis': status_data['analysis'],
            'recommendation': status_data['recommendation'],
            'header': header_override
        }
        
        from src.report_formatter import ReportFormatter
        return ReportFormatter.format_report(report_data)

    def _generate_quick_report(self, query, device_id):
        readings = self.db.get_recent_readings(device_id, limit=5)
        if readings.empty: return f"Sem dados recentes para {device_id}."
        
        now_str = datetime.now().strftime("%d/%m/%Y – %H:%M") # Format expected by user
        # Note: ReportFormatter handles formatting too, but we pass string here
        
        return self._generate_report_string(
            readings, 
            now_str, 
            device_id, 
            header_override="⚠️ RELATÓRIO RÁPIDO (AGORA)"
        )

    def _generate_historical_report(self, device_id, date_str):
        # Fetch window around that time
        df = self.db.get_readings_window(device_id, date_str, window_minutes=60)
        if df.empty:
             return f"Não encontrei dados para {device_id} em {date_str}."
        
        return self._generate_report_string(
            df, 
            date_str, 
            device_id, 
            header_override="" # Explicitly empty as requested by user logic if they don't want a header for 'Complete'
        )

    def _analyze_status(self, risk, temp, vib):
        """Helper to determine status, sensor context, and recommendations."""
        risk_pct = risk * 100
        
        # Status Logic
        if risk_pct < 30:
            status = "Normal (Operação Estável)"
            rec_main = "Manter monitoramento padrão."
            analysis_main = "Parâmetros operacionais dentro da normalidade."
        elif risk_pct < 70:
            status = "Preventivo (antes do modo crítico)"
            rec_main = "Inspeção preventiva e monitoramento reforçado."
            analysis_main = "Tendência de aumento de risco detectada pela IA."
        else:
            status = "CRÍTICO"
            rec_main = "PARADA IMEDIATA para manutenção."
            analysis_main = "Deterioração acelerada e alta probabilidade de falha."

        # Primary Sensor Context
        limit_temp = 85.0
        limit_vib = 4.5
        
        temp_ratio = temp / limit_temp
        vib_ratio = vib / limit_vib
        
        if vib_ratio > temp_ratio:
            sensor = "Vibração"
            val_atual = vib
            limit = limit_vib
            unit = "mm/s"
            specific_analysis = "Vibração elevada detectada."
            specific_rec = "Verificar alinhamento e rolamentos."
        else:
            sensor = "Temperatura"
            val_atual = temp
            limit = limit_temp
            unit = "°C"
            specific_analysis = "Aquecimento identificado."
            specific_rec = "Verificar sistema de resfriamento."

        return {
            'status': status,
            'sensor': sensor,
            'value': val_atual,
            'limit': limit,
            'unit': unit,
            'analysis': f"{analysis_main} {specific_analysis}",
            'recommendation': f"{rec_main} {specific_rec}"
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python assistant.py <query>")
        sys.exit(1)
        
    query = sys.argv[1]
    
    # Initialize dependencies
    db = DatabaseManager()
    kpi = KpiCalculator(db)
    
    assistant = SmartAssistant(db, kpi)
    response = assistant.ask(query)
    
    print(response)
