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
        Enhanced Assistant with Auth & Prediction.
        Commands:
        - "login <user> <pass>"
        - "status <device_id>"
        - "oee <device_id>"
        - "predict <device_id>" (Requires Admin)
        """
        query = query.lower().strip()
        parts = query.split()
        
        if not parts:
            return "Olá! Como posso ajudar?"

        # --- AUTHENTICATION ---
        if parts[0] == "login":
            if len(parts) < 3:
                return "Use: login <usuario> <senha>"
            user = self.auth.login(parts[1], parts[2])
            if user:
                self.current_user = user
                return f"Login bem-sucedido! Bem-vindo, {user['username']} ({user['role']})."
            else:
                return "Falha no login. Verifique credenciais."

        if parts[0] == "logout":
            self.current_user = None
            return "Desconectado."

        if parts[0] == "whoami":
            if self.current_user:
                 return f"Usuário: {self.current_user['username']}, Role: {self.current_user['role']}"
            return "Não autenticado."

        # --- PUBLIC COMMANDS ---
        # Regex for date extraction: YYYY-MM-DD or YYYY-MM-DD HH:MM
        import re
        from datetime import datetime
        
        date_pattern = r"(\d{4}-\d{2}-\d{2})(?:\s(\d{2}:\d{2}))?"
        date_match = re.search(date_pattern, query)
        
        report_time = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        footer = f"\n\n🕒 Relatório gerado em: {report_time}"

        if "status" in query:
            device_id = parts[1] if len(parts) > 1 and not parts[1].startswith("em") else parts[-1]
            # Simple heuristic: if 'status' and 'em' <date>, it is historical
            
            readings = pd.DataFrame()
            is_historical = False
            
            if date_match and "em" in query:
                target_date = date_match.group(0)
                readings = self.db.get_readings_at(device_id, target_date)
                is_historical = True
                if readings.empty:
                    return f"⚠️ Não existem registros para {device_id} em {target_date}. Verifique a data (muito antiga ou futura?).{footer}"
            else:
                readings = self.db.get_recent_readings(device_id, limit=1)

            info = self.db.get_device_info(device_id)
            
            if not info or readings.empty:
               return f"Não encontrei o dispositivo {device_id} ou dados recentes.{footer}"
               
            current_status = readings.iloc[0]['status']
            temp = readings.iloc[0]['temperature']
            ts = readings.iloc[0]['timestamp']
            
            prefix = f"📜 [HISTÓRICO {ts}]" if is_historical else "🟢 [AGORA]"
            return f"{prefix} {info['name']} ({device_id}): {current_status}. Temp: {temp:.1f}C.{footer}"

        # --- RESTRICTED COMMANDS (Example) ---
        # Let's say OEE is for logged in users only
        if "oee" in query:
            if not self.current_user:
                return f"🔒 Acesso Negado. Faça login para ver KPIs.{footer}"
                
            device_id = parts[-1]
            oee, avail, perf, qual = self.kpi.calculate_oee(device_id)
            return f"📊 OEE {device_id}: {oee}%. (A: {avail}%, P: {perf}%, Q: {qual}%){footer}"

        # --- ADMIN / AI PREDICTION ---
        if "predict" in query or "prever" in query:
            # Check permissions (assuming only admin sees predictions for safety/demo)
            if not self.auth.check_permission(self.current_user, 'admin'):
                return f"🔒 Acesso Negado. Apenas Admins podem acessar previsões de falha.{footer}"

            device_id = parts[-1] 
            # Check if this input is just 'predict' without ID
            if not device_id.startswith("DEV"):
                 return f"Por favor especifique o ID do dispositivo (ex: DEV-100).{footer}"

            readings = self.db.get_recent_readings(device_id, limit=5)
            if readings.empty:
                return f"Dados insuficientes para predição.{footer}"
            
            risk, rul, waste = self.predictor.predict_failure_risk(readings)
            risk_pct = risk * 100
            
            status_moji = "🟢" if risk < 0.3 else ("🟡" if risk < 0.7 else "🔴")
            
            rul_text = f"{rul:.1f}h" if rul < 900 else "Estável (>48h)"
            
            response = f"""
{status_moji} **Análise de Risco para {device_id}**:
- 📉 Probabilidade de Falha: {risk_pct:.1f}%
- ⏳ Vida Útil Restante (RUL): {rul_text}
- ⚡ Desperdício de Energia: {waste:.1f}W
            """
            return response + footer

        # --- CONVERSATIONAL REPORT FLOW ---
        
        # 0. Check Context: Waiting for Confirmation?
        if self.context.get('awaiting_confirmation'):
            if 'sim' in query or 's' == query or 'yes' in query:
                target_id = self.context.get('report_device_id', 'DEV-100')
                target_time = self.context.get('report_target_time')
                is_current = self.context.get('report_is_current')
                
                if is_current:
                    # Fetch recent data for trends
                    df = self.db.get_recent_readings(target_id, limit=20)
                else:
                    # Fetch historical window
                    df = self.db.get_readings_window(target_id, target_time, window_minutes=60)
                
                self.context = {} # Clear context
                
                if df.empty:
                     return f"⚠️ Sem dados encontrados para {target_id} por volta de {target_time}."
                     
                return self._generate_report_string(df, target_time, target_id)
            else:
                self.context = {}
                return "❌ Operação cancelada. O que deseja fazer agora?"

        # 0.1 Check Context: Waiting for Date?
        if self.context.get('awaiting_report_date'):
            # User sent something, hopefully a date like dd-mm-yyyy or dd/mm/yyyy
            # Support both - and /
            date_time_pattern = r"(\d{2}[-/]\d{2}[-/]\d{4})\D+(\d{2}:\d{2})"
            match = re.search(date_time_pattern, query)
            
            # Since we are in a flow, we need the device_id. Ideally previously stored.
            # For simplicity, if not stored, we might default to DEV-100 or ask again.
            # But let's check if the query *also* has an ID.
            
            target_id = self.context.get('report_device_id', 'DEV-100') # Default fallback
            
            # Update ID if present in this new message
            for p in parts:
                if p.upper().startswith("DEV-"):
                    target_id = p.upper()
                    self.context['report_device_id'] = target_id
            
            if not match:
                 return f"⚠️ Formato incorreto. Por favor, informe a data e hora: dd/mm/aaaa hh:mm"

            date_str = match.group(1)
            time_str = match.group(2)
            
            # Normalize date separator to /
            date_str = date_str.replace('-', '/')
            
            full_target_str = f"{date_str} {time_str}"
            
            # Fetch
            df = self.db.get_readings_window(target_id, full_target_str, window_minutes=60)
            self.context = {} # Reset context logic
            
            if df.empty:
                return f"Essa data ({full_target_str}) não consta relatórios no banco de dados para {target_id}."
                
            return self._generate_report_string(df, full_target_str, target_id)


        # 1. Trigger: Broad "Relatorio"
        if "relatorio" in query or "report" in query:
             # Capture ID if strictly present now, or save for later
             target_id = "DEV-100" # Default or from context
             for p in parts:
                if p.upper().startswith("DEV-"):
                    target_id = p.upper()
             
             # Shortcut 1: "Relatorio Rapido" or "Atual"
             if "rapido" in query or "atual" in query or "agora" in query:
                 return self._generate_quick_report(query, target_id)

             # Shortcut 2: Did user provide a date?
             date_pattern = r"(\d{2}[-/]\d{2}[-/]\d{4})"
             date_match = re.search(date_pattern, query)
             
             if date_match:
                 # Found a date, check for time
                 time_pattern = r"(\d{2}:\d{2})"
                 time_match = re.search(time_pattern, query)
                 
                 date_str = date_match.group(1).replace('-', '/')
                 
                 if time_match:
                     # Full Date+Time -> Go to Confirmation
                     time_str = time_match.group(1)
                     full_str = f"{date_str} {time_str}"
                     self.context['report_target_time'] = full_str
                     self.context['report_device_id'] = target_id
                     self.context['report_is_current'] = False
                     self.context['awaiting_confirmation'] = True
                     return f"Entendido. Gerar relatório passado de {target_id} para **{full_str}**? (Sim/Não)"
                 else:
                     # Only Date -> Ask for Time
                     self.context['report_temp_date'] = date_str
                     self.context['report_device_id'] = target_id
                     self.context['awaiting_report_time_only'] = True
                     return f"Entendi que você quer um relatório de {date_str}. Qual o horário? (hh:mm)"

             # No date, show menu or ask for date directly if intent is clear
             # User asked: "Exemplo Preciso de um relatorio ? sistema: Perfeito! digite a data :dd-mm-aaaa e horario xx:xx"
             self.context['report_device_id'] = target_id
             self.context['awaiting_report_date'] = True
             return "Perfeito! digite a data :dd-mm-aaaa e horario xx:xx"

        # 1.5 Handle Time Only (Intermediate step for Shortcut)
        if self.context.get('awaiting_report_time_only'):
             time_pattern = r"(\d{2}:\d{2})"
             match = re.search(time_pattern, query)
             if match:
                 date_str = self.context.get('report_temp_date')
                 time_str = match.group(1)
                 full_str = f"{date_str} {time_str}"
                 
                 self.context['awaiting_report_time_only'] = False
                 self.context['report_target_time'] = full_str
                 self.context['report_is_current'] = False
                 self.context['awaiting_confirmation'] = True
                 return f"Certo. Gerar relatório para **{full_str}**? (Sim/Não)"
             else:
                 return "Hora inválida. Por favor digite no formato hh:mm (ex: 14:30)."

        # 2. Handle Choice (1 or 2)
        if self.context.get('awaiting_report_choice'):
            # Strict checks
            is_opt1 = query == "1" or "atual" in query or "rapido" in query
            is_opt2 = query == "2" or "passado" in query or "historico" in query
            
            if is_opt1:
                # Current Report
                target_id = self.context.get('report_device_id', 'DEV-100')
                self.context = {} # Reset specific wait states but set confirmation
                
                now_str = datetime.now().strftime("%d/%m/%Y %H:%M")
                self.context['report_target_time'] = now_str
                self.context['report_is_current'] = True
                self.context['awaiting_confirmation'] = True
                
                return f"Gerar relatório do **TURNO ATUAL** ({now_str})? (Sim/Não)"
            
            elif is_opt2:
                self.context['awaiting_report_choice'] = False
                self.context['awaiting_report_date'] = True
                return "Me informe a data e a hora que gostaria desse relatório (dd/mm/aaaa hh:mm)."
            
            # If neither matched strictly (e.g. user typed a date here by mistake? catch it in next turn or warn)
            return "Opção inválida. Digite 1 para Atual ou 2 para Passado."

 

        # --- EXPLAIN COMMAND (New) ---
        if "explain" in query or "explica" in query:
             device_id = None
             for p in parts:
                if p.upper().startswith("DEV-"):
                    device_id = p.upper()
                    break
             
             if not device_id: return f"Qual dispositivo você quer que eu explique? (Ex: explain DEV-100)"
             
             info = self.db.get_device_info(device_id)
             readings = self.db.get_recent_readings(device_id, limit=1)
             
             if readings.empty: return f"Sem dados para explicar {device_id}."
             
             last = readings.iloc[0]
             reasons = []
             if last['temperature'] > 80: reasons.append(f"Temperatura alta ({last['temperature']}°C)")
             if last['vibration'] > 4: reasons.append(f"Vibração excessiva ({last['vibration']}mm/s)")
             if last['status'] == 'parado': reasons.append("Status reportado como PARADO")
             
             if not reasons:
                 explanation = "O dispositivo está operando dentro dos parâmetros normais. Nenhuma anomalia detectada."
             else:
                 explanation = "Fatores de risco identificados:\n- " + "\n- ".join(reasons)
             
             return f"🧐 **Análise Profunda ({device_id})**:\n{explanation}{footer}"

        # --- FUZZY MATCHING FALLBACK ---
        # If we got here, no exact command matched.
        known_commands = ['status', 'oee', 'predict', 'relatorio', 'login', 'logout', 'explain']
        # Check first word usually
        potential_cmd = parts[0]
        matches = difflib.get_close_matches(potential_cmd, known_commands, n=1, cutoff=0.6)
        
        if matches:
            suggestion = matches[0]
            return f"🤔 Você quis dizer '{suggestion}'? Tente digitar novamente corretamente.{footer}"

        return f"Comandos: login, logout, 'preciso de relatorio', status [id], predict [id], explain [id]{footer}"

    def _generate_report_string(self, df, time_str, device_id):
        # 1. AI Analysis
        risk, rul, waste = self.predictor.predict_failure_risk(df)
        risk_pct = risk * 100
        
        # 2. Extract Key Metrics (Last reading in the window)
        last_reading = df.iloc[-1]
        current_temp = last_reading['temperature']
        current_vib = last_reading['vibration']
        
        # 3. Determine Status & Recommendation
        # Logic: Risk < 30% (Normal), 30-70% (Preventivo), > 70% (Crítico)
        if risk_pct < 30:
            status = "Normal (Operação Estável)"
            rec_action = "Manter monitoramento padrão."
            analysis_text = "Parâmetros operacionais dentro da normalidade."
        elif risk_pct < 70:
            status = "Preventivo (antes do modo crítico)"
            rec_action = "Inspeção preventiva e monitoramento reforçado."
            analysis_text = "Tendência de aumento de risco detectada pela IA."
        else:
            status = "CRÍTICO (Risco de Falha Iminente)"
            rec_action = "PARADA IMEDIATA para manutenção."
            analysis_text = "Deterioração acelerada e alta probabilidade de falha."

        # 4. Determine Primary Sensor Context
        # Default limits
        limit_temp = 85.0
        limit_vib = 4.5
        
        # Heuristic: Which is closer to or exceeding limit?
        temp_ratio = current_temp / limit_temp
        vib_ratio = current_vib / limit_vib
        
        if vib_ratio > temp_ratio:
            sensor = "Vibração"
            val_atual = f"{current_vib:.2f} mm/s"
            limite = f"{limit_vib:.1f} mm/s"
            specific_analysis = f"Vibração elevada detectada ({val_atual})."
            specific_rec = "Verificar alinhamento, fixação e lubrificação de rolamentos."
        else:
            sensor = "Temperatura"
            val_atual = f"{current_temp:.1f} °C"
            limite = f"{limit_temp:.1f} °C"
            specific_analysis = f"Aquecimento identificado ({val_atual})."
            specific_rec = "Verificar sistema de resfriamento e ventilação do motor."

        # Combine Analysis/Rec
        final_analysis = f"{analysis_text} {specific_analysis}"
        final_rec = f"{rec_action} {specific_rec}"

        # 5. Format Output
        return f"""
⚠️ PRÉ-ALERTA – SMART FACTORY

Status: {status}
Data/Hora: {time_str}
Equipamento: {device_id}
Sensor: {sensor}
Valor Atual: {val_atual}
Limite Operacional: {limite}
Risco Estimado (IA): {risk_pct:.1f}%

Análise:
{final_analysis}

Recomendação:
{final_rec}
"""

    def _generate_quick_report(self, query, device_id="DEV-100"):
        # Get recent reading
        readings = self.db.get_recent_readings(device_id, limit=5)
        if readings.empty:
            return f"Sem dados recentes para {device_id}."
            
        last = readings.iloc[0]
        now_str = datetime.now().strftime("%d/%m/%Y – %H:%M")
        
        # Calculate simplistic risk if not present
        risk = last.get('risk_score', 0.65) # Mock default to show 'preventive' example
        risk_pct = risk * 100
        
        current_temp = last['temperature']
        current_vib = last['vibration']
        
        # Status Logic
        if risk_pct < 30:
            status = "Normal"
        elif risk_pct < 70:
            status = "Preventivo (antes do modo crítico)"
        else:
            status = "CRÍTICO"

        # Determine Primary Sensor Context
        limit_temp = 85.0
        limit_vib = 4.5
        
        temp_ratio = current_temp / limit_temp
        vib_ratio = current_vib / limit_vib
        
        if vib_ratio > temp_ratio:
            sensor = "Vibração"
            val_atual = f"{current_vib:.2f} mm/s"
            limite = f"{limit_vib:.1f} mm/s"
            analysis_text = f"Níveis de vibração ({val_atual}) acima do ideal, indicando possível desbalanceamento ou desgaste."
            rec_text = "Realizar análise de espectro de vibração e verificar fixação da base."
        else:
            sensor = "Temperatura"
            val_atual = f"{current_temp:.1f} °C"
            limite = f"{limit_temp:.1f} °C"
            analysis_text = f"Temperatura de operação ({val_atual}) próxima do limite, indicando sobrecarga ou deficiência na troca térmica."
            rec_text = "Inspecionar desobstrução das aletas de refrigeração e carga do motor."
            
        return f"""
⚠️ RELATÓRIO RÁPIDO (AGORA)

Status: {status}
Data/Hora: {now_str}
Equipamento: {device_id}
Sensor: {sensor}
Valor Atual: {val_atual}
Limite Operacional: {limite}
Risco Estimado (IA): {risk_pct:.0f}%

Análise:
{analysis_text}

Recomendação:
{rec_text}

"""

        return f"Comandos: login, logout, status [id], relatorio [id], oee [id], predict [id]{footer}"

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
