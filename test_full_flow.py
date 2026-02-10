from src.database import DatabaseManager
from src.analytics import KpiCalculator
from src.assistant import SmartAssistant

db = DatabaseManager()
kpi = KpiCalculator(db)
assistant = SmartAssistant(db, kpi)

print(">> Q1: preciso de relatorio 02/02/1998")
res1 = assistant.ask("preciso de relatorio 02/02/1998")
print(f"<< A1: {res1}")

print("\n>> Q2: 14:00")
res2 = assistant.ask("14:00")
print(f"<< A2: {res2}")

print("\n>> Q3: Sim")
res3 = assistant.ask("Sim")
print(f"<< A3: {res3}")
