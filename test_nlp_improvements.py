import sys
import os
from datetime import datetime

# Ensure we can import from src
sys.path.append(os.getcwd())

from src.database import DatabaseManager
from src.analytics import KpiCalculator
from src.assistant import SmartAssistant

# Setup
db = DatabaseManager()
kpi = KpiCalculator(db)
assistant = SmartAssistant(db, kpi)

output_file = 'nlp_test_output.txt'

with open(output_file, 'w', encoding='utf-8') as f:
    def test_query(query, description):
        f.write(f"\n--- TEST: {description} ---\n")
        f.write(f"Query: '{query}'\n")
        response = assistant.ask(query)
        f.write(f"Response:\n{response}\n")
        return response

    # 1. Test Hello
    test_query("", "Empty Query")

    # 2. Test Accent Handling
    test_query("relatório", "Accent: 'relatório' (Broad)")

    # 3. Test Quick Report
    resp_quick = test_query("relatório rápido", "Quick Report")
    if "⚠️ RELATÓRIO RÁPIDO" in resp_quick and "Status:" in resp_quick:
        f.write("✅ Quick Report Format Verified\n")
    else:
        f.write("❌ Quick Report Format Failed\n")

    # 4. Test Complete Report Flow (Initiation)
    test_query("relatório completo", "Complete Report (No Date)")

    # 5. Test Fallback (Should be polite)
    test_query("blablabla", "Unknown Command")

    # 6. Test OEE Removal (Should trigger fallback or unknown)
    resp_oee = test_query("oee dev-100", "OEE Command (Should Fail/Fallback)")
    if "Desculpe, não entendi" in resp_oee or "tente comandos como" in resp_oee.lower():
         f.write("✅ OEE Removal Verified (Triggered Fallback)\n")
    elif "OEE" in resp_oee and "%" in resp_oee:
         f.write("❌ OEE Removal Failed (Still producing OEE)\n")
    else:
         f.write("❓ OEE Result Ambiguous\n")

    # 7. Test Specific Device Status
    test_query("status dev-100", "Status DEV-100")

print(f"NLP test results written to {output_file}")
