import sys
import os

sys.path.append(os.getcwd())

from src.database import DatabaseManager
from src.analytics import KpiCalculator
from src.assistant import SmartAssistant

def run_verification():
    try:
        db = DatabaseManager()
        kpi = KpiCalculator(db)
        assistant = SmartAssistant(db, kpi)
        
        # Test "relatorio rapido"
        response = assistant.ask("relatorio rapido")
        
        with open("verification_result_v2.txt", "w", encoding="utf-8") as f:
            f.write(response)
            
        print("Verification complete.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run_verification()
