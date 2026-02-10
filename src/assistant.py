import sys
import pandas as pd
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
        
        # 0. Check Context: Waiting for Date?
        if self.context.get('awaiting_report_date'):
            # User sent something, hopefully a date
            date_time_pattern = r"(\d{2}/\d{2}/\d{4})\D+(\d{2}:\d{2})"
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
            full_target_str = f"{date_str} {time_str}"
            
            # Fetch
            df = self.db.get_readings_window(target_id, full_target_str, window_minutes=60)
            self.context = {} # Reset context logic
            
            if df.empty:
                return f"Essa data ({full_target_str}) não consta relatórios no banco de dados."
                
            return self._generate_report_string(df, full_target_str, target_id)


        # 1. Trigger: Broad "Relatorio"
        if "relatorio" in query or "report" in query:
             # Capture ID if strictly present now, or save for later
             for p in parts:
                if p.upper().startswith("DEV-"):
                    self.context['report_device_id'] = p.upper()
             
             # Shortcut: Did user provide a date?
             date_pattern = r"(\d{2}/\d{2}/\d{4})"
             date_match = re.search(date_pattern, query)
             
             if date_match:
                 # Found a date, check for time
                 time_pattern = r"(\d{2}:\d{2})"
                 time_match = re.search(time_pattern, query)
                 
                 date_str = date_match.group(1)
                 
                 if time_match:
                     # Full Date+Time -> Go to Confirmation
                     time_str = time_match.group(1)
                     full_str = f"{date_str} {time_str}"
                     self.context['report_target_time'] = full_str
                     self.context['report_is_current'] = False
                     self.context['awaiting_confirmation'] = True
                     return f"Entendido. Gerar relatório passado para **{full_str}**? (Sim/Não)"
                 else:
                     # Only Date -> Ask for Time
                     self.context['report_temp_date'] = date_str
                     self.context['awaiting_report_time_only'] = True
                     return f"Entendi que você quer um relatório de {date_str}. Qual o horário? (hh:mm)"

             # No date, show menu
             self.context['awaiting_report_choice'] = True
             now_str = datetime.now().strftime("%d/%m/%Y às %H:%M")
             return f"1 - Relatório rápido do turno atual ({now_str})\n2 - Relatório passado?"

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
        avg_temp = df['temperature'].mean()
        avg_vib = df['vibration'].mean()
        stops = len(df[df['status'] == 'parado'])
        
        if avg_temp > 90 or avg_vib > 6:
            status_icon = "⚠️"
            conclusion = "Anomalias Detectadas (Revisão Necessária)"
        elif stops > 5:
            status_icon = "🛑"
            conclusion = "Instabilidade Operacional (Muitas Paradas)"
        else:
            status_icon = "✅"
            conclusion = "Operação Estável"

        return f"""
📄 **Relatório ({time_str})**
• 🆔 **Dispositivo**: {device_id}
• 🔥 **Temp. Média**: {avg_temp:.1f}°C
• 〰️ **Vibração Média**: {avg_vib:.2f} mm/s
• 🛑 **Paradas**: {stops} microparadas
• {status_icon} **Conclusão**: {conclusion}
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
