import sys
import os
from datetime import datetime

# Ensure we can import from src
sys.path.append(os.getcwd())

try:
    from src.report_formatter import ReportFormatter
except ImportError:
    # Fallback if running from a different directory
    sys.path.append(os.path.join(os.getcwd(), '..'))
    from src.report_formatter import ReportFormatter

output_file = 'verification_output.txt'

with open(output_file, 'w', encoding='utf-8') as f:
    # 1. Quick Status Data (Status Rapido)
    quick_data = {
        'status': 'Preventivo (antes do modo crítico)',
        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        'device_name': 'DEV-100',
        'sensor': 'Vibração',
        'value': 4.8,
        'limit': 4.5,
        'unit': 'mm/s',
        'risk_score': 0.65,
        'analysis': 'Tendência de aumento de risco detectada pela IA. Vibração elevada detectada.',
        'recommendation': 'Inspeção preventiva e monitoramento reforçado. Verificar alinhamento e rolamentos.',
        'header': '⚠️ RELATÓRIO RÁPIDO (AGORA)'
    }

    f.write("=== RELATÓRIO RÁPIDO (SIMULAÇÃO) ===\n")
    f.write(ReportFormatter.format_report(quick_data))
    f.write("\n" + "="*30 + "\n\n")

    # 2. Complete/Historical Report (Relatorio Completo)
    complete_data = {
        'status': 'CRÍTICO',
        'timestamp': '2026-02-11 14:30:00',
        'device_name': 'DEV-200',
        'sensor': 'Temperatura',
        'value': 95.5,
        'limit': 85.0,
        'unit': '°C',
        'risk_score': 0.92,
        'analysis': 'Deterioração acelerada e alta probabilidade de falha. Aquecimento identificado.',
        'recommendation': 'PARADA IMEDIATA para manutenção. Verificar sistema de resfriamento.'
    }

    f.write("=== RELATÓRIO COMPLETO (SIMULAÇÃO) ===\n")
    f.write(ReportFormatter.format_report(complete_data))

print(f"Verification output written to {output_file}")
