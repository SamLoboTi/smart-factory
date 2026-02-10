from src.database import DatabaseManager
from src.analytics import KpiCalculator
from src.assistant import SmartAssistant

# Setup
db = DatabaseManager()
kpi = KpiCalculator(db)
assistant = SmartAssistant(db, kpi)

print("--- Step 1: Trigger (Broad) ---")
print(assistant.ask("relatorio DEV-100"))

print("\n--- Step 2: Choose Past (Option 2) ---")
print(assistant.ask("2"))

print("\n--- Step 3: Provide Data ---")
print(assistant.ask("02/02/2026 14:00"))

print("\n--- Step 4: Confirm (Sim) ---")
print(assistant.ask("Sim"))

print("\n--- Step 5: Trigger Current ---")
print(assistant.ask("relatorio DEV-100"))
print(assistant.ask("1"))
print(assistant.ask("Sim"))
