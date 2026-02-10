from src.database import DatabaseManager
from src.analytics import KpiCalculator
from src.assistant import SmartAssistant

# Setup
db = DatabaseManager()
kpi = KpiCalculator(db)
assistant = SmartAssistant(db, kpi)

print("--- Test 1: Date Shortcut (No Time) ---")
print(assistant.ask("preciso de relatorio 02/02/1998"))
# Expected: "Entendi... qual horario?"

print("\n--- Test 2: Provide Time ---")
print(assistant.ask("14:00"))
# Expected: "Gerar... Confirm?"

print("\n--- Test 3: Confirm ---")
print(assistant.ask("Sim"))
# Expected: "No records" (since 1998)
