from src.database import DatabaseManager
from src.analytics import KpiCalculator
from src.assistant import SmartAssistant

# Setup
db = DatabaseManager()
kpi = KpiCalculator(db)
assistant = SmartAssistant(db, kpi)

print("--- Test 1: Fuzzy Matching (Typos) ---")
print(assistant.ask("stutus DEV-100"))      # Should suggest 'status'
print(assistant.ask("predicct DEV-100"))    # Should suggest 'predict'
print(assistant.ask("relatorioo DEV-100"))  # Should suggest 'relatorio'

print("\n--- Test 2: Explain Command ---")
print(assistant.ask("explain DEV-100"))
